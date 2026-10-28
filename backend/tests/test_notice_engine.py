import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models import Notice, NoticeRevision, Alert, Agency
from backend.app.services.notice_engine import (
    compute_content_hash,
    normalize_notice,
    calculate_status,
    refresh_notice_statuses,
    process_notice_batch
)
from backend.app.services.adapters.base_adapter import BaseAdapter
from backend.app.services.scheduler import scheduler_service

MOCK_AGENCY = {
    "id": "test_agency",
    "name": "Test Transit Agency",
    "state": "Delhi (NCT)",
    "district": "Central Delhi",
    "transport_types": ["bus"],
    "source_url": "https://test-transit.gov.in"
}

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    agency = Agency(
        id=MOCK_AGENCY["id"],
        name=MOCK_AGENCY["name"],
        full_name=MOCK_AGENCY["name"],
        state=MOCK_AGENCY["state"],
        district=MOCK_AGENCY["district"],
        transport_types=MOCK_AGENCY["transport_types"],
        feed_type="advisory_verified",
        source_url=MOCK_AGENCY["source_url"],
        is_active=True,
        last_checked_at=datetime.datetime.utcnow(),
        status_message="Active"
    )
    session.add(agency)
    session.commit()

    yield session
    session.close()

def test_deterministic_content_hashing():
    notice_a = {
        "title": "Route 101 Diversion",
        "summary": "Diverted via Outer Ring Road",
        "notice_type": "diversion",
        "affected_area": "Outer Ring Road",
        "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 10, 15, 0, 0),
        "route_id": "R-101",
        "transport_type": "bus"
    }
    notice_b = dict(notice_a)
    notice_modified = dict(notice_a, summary="Diverted via Central Boulevard instead")

    hash_a = compute_content_hash(notice_a)
    hash_b = compute_content_hash(notice_b)
    hash_mod = compute_content_hash(notice_modified)

    assert hash_a == hash_b, "Identical content must yield identical hash"
    assert hash_a != hash_mod, "Altered content must produce different hash"
    assert len(hash_a) == 64, "SHA-256 hash must be 64 hexadecimal characters"

def test_missing_fields_normalization():
    raw_missing = {
        "title": "Advisory with Missing Route and Timestamps"
    }
    norm = normalize_notice(raw_missing, MOCK_AGENCY)
    assert norm is not None
    assert norm["title"] == "Advisory with Missing Route and Timestamps"
    assert norm["agency_id"] == MOCK_AGENCY["id"]
    assert norm["notice_type"] == "advisory"
    assert norm["state"] == MOCK_AGENCY["state"]
    assert norm["valid_from"] is not None

def test_malformed_feed_handling():
    malformed_items = [
        {"id": "CORRUPT-01", "header": None, "description": 12345},
        None,
        "just a string instead of object",
        {"notice_id": "CORRUPT-02", "text": "Partially broken record without title"}
    ]
    processed = []
    for item in malformed_items:
        if isinstance(item, dict):
            norm = normalize_notice(item, MOCK_AGENCY)
            if norm:
                processed.append(norm)

    assert len(processed) == 2, "Should safely normalize valid objects and ignore junk"

def test_status_determination():
    now = datetime.datetime(2026, 10, 28, 12, 0, 0)

    # Active
    active_item = {
        "valid_from": datetime.datetime(2026, 10, 20, 0, 0),
        "valid_to": datetime.datetime(2026, 11, 5, 0, 0),
        "revision_id": 1
    }
    assert calculate_status(active_item, now) == "active"

    # Upcoming
    upcoming_item = {
        "valid_from": datetime.datetime(2026, 11, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 11, 10, 0, 0),
        "revision_id": 1
    }
    assert calculate_status(upcoming_item, now) == "upcoming"

    # Expired: expired notices MUST NEVER appear as active!
    expired_item = {
        "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 10, 25, 0, 0),
        "revision_id": 1
    }
    assert calculate_status(expired_item, now) == "expired"

    # Revised
    revised_item = {
        "valid_from": datetime.datetime(2026, 10, 20, 0, 0),
        "valid_to": datetime.datetime(2026, 11, 5, 0, 0),
        "revision_id": 2
    }
    assert calculate_status(revised_item, now) == "revised"

def test_idempotent_database_batch_processing(db_session):
    dup_feed = [
        {
            "id": "DUP-TEST-01",
            "title": "Bus Stop Relocation at Majlis Park",
            "summary": "Bus stop relocated 50 meters south due to foot overbridge construction.",
            "notice_type": "diversion",
            "route_id": "DTC-534",
            "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
            "valid_to": datetime.datetime(2026, 11, 30, 0, 0)
        },
        {
            "id": "DUP-TEST-01",
            "title": "Bus Stop Relocation at Majlis Park",
            "summary": "Bus stop relocated 50 meters south due to foot overbridge construction.",
            "notice_type": "diversion",
            "route_id": "DTC-534",
            "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
            "valid_to": datetime.datetime(2026, 11, 30, 0, 0)
        }
    ]
    fixed_time = datetime.datetime(2026, 10, 28, 12, 0, 0)

    # First pass
    res1 = process_notice_batch(db_session, dup_feed, MOCK_AGENCY, fixed_time)
    assert res1["newCount"] == 1
    assert db_session.query(Notice).count() == 1
    assert db_session.query(NoticeRevision).count() == 1

    # Second pass: 100% idempotent
    res2 = process_notice_batch(db_session, dup_feed, MOCK_AGENCY, fixed_time)
    assert res2["newCount"] == 0
    assert res2["revisedCount"] == 0
    assert res2["confirmedCount"] == 1
    assert db_session.query(Notice).count() == 1
    assert db_session.query(NoticeRevision).count() == 1

def test_revision_and_extension_detection(db_session):
    initial = [{
        "id": "REV-TEST-01",
        "title": "Bridge Reconstruction Notice (Initial)",
        "summary": "Traffic diversion via Ring Road until Oct 20.",
        "notice_type": "diversion",
        "route_id": "MTC-25G",
        "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 10, 20, 0, 0)
    }]
    extended = [{
        "id": "REV-TEST-01",
        "title": "Bridge Reconstruction Notice (Extended)",
        "summary": "Traffic diversion via Ring Road extended until Nov 15 due to monsoon delay.",
        "notice_type": "diversion",
        "route_id": "MTC-25G",
        "valid_from": datetime.datetime(2026, 10, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 11, 15, 0, 0)
    }]

    time1 = datetime.datetime(2026, 10, 5, 10, 0, 0)
    res1 = process_notice_batch(db_session, initial, MOCK_AGENCY, time1)
    assert res1["newCount"] == 1

    notice1 = db_session.query(Notice).filter(Notice.id == "REV-TEST-01").first()
    assert notice1.revision_id == 1
    assert notice1.valid_to == datetime.datetime(2026, 10, 20, 0, 0)

    time2 = datetime.datetime(2026, 10, 18, 10, 0, 0)
    res2 = process_notice_batch(db_session, extended, MOCK_AGENCY, time2)
    assert res2["revisedCount"] == 1

    notice2 = db_session.query(Notice).filter(Notice.id == "REV-TEST-01").first()
    assert notice2.revision_id == 2
    assert notice2.valid_to == datetime.datetime(2026, 11, 15, 0, 0)
    assert "extended" in notice2.change_summary.lower()

    # Verify 2 revisions recorded
    revs = db_session.query(NoticeRevision).filter(NoticeRevision.notice_id == "REV-TEST-01").all()
    assert len(revs) == 2

    # Verify alerts deduplicated
    alerts = db_session.query(Alert).filter(Alert.notice_id == "REV-TEST-01").all()
    assert len(alerts) == 2

def test_automatic_expired_transition(db_session):
    exp_feed = [{
        "id": "EXP-TEST-01",
        "title": "Completed Festival Special Service",
        "summary": "Concluded operations.",
        "notice_type": "advisory",
        "valid_from": datetime.datetime(2026, 9, 1, 0, 0),
        "valid_to": datetime.datetime(2026, 9, 10, 23, 59)
    }]
    now = datetime.datetime(2026, 10, 28, 12, 0, 0)
    process_notice_batch(db_session, exp_feed, MOCK_AGENCY, now)

    stored = db_session.query(Notice).filter(Notice.id == "EXP-TEST-01").first()
    assert stored.status == "expired"
