import hashlib
import datetime
import uuid
import json
from sqlalchemy.orm import Session
from backend.app.models import Notice, NoticeRevision, Alert, Agency

def compute_content_hash(data: dict) -> str:
    canonical_parts = [
        str(data.get("title") or "").strip(),
        str(data.get("summary") or "").strip(),
        str(data.get("notice_type") or "").strip().lower(),
        str(data.get("affected_area") or "").strip(),
        data.get("valid_from").isoformat() if isinstance(data.get("valid_from"), datetime.datetime) else str(data.get("valid_from") or ""),
        data.get("valid_to").isoformat() if isinstance(data.get("valid_to"), datetime.datetime) else str(data.get("valid_to") or ""),
        str(data.get("route_id") or "").strip(),
        str(data.get("transport_type") or "").strip().lower()
    ]
    canonical = "|".join(canonical_parts)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

def normalize_notice(raw: dict, agency_dict: dict) -> dict | None:
    if not raw or not isinstance(raw, dict):
        return None

    raw_title = raw.get("title") or raw.get("header") or raw.get("subject") or "Transit Advisory"
    title = str(raw_title).strip()
    raw_summary = raw.get("summary") or raw.get("description") or raw.get("text") or raw.get("content") or title
    summary = str(raw_summary).strip()
    
    notice_type = str(raw.get("notice_type") or raw.get("type") or "advisory").lower().strip()
    valid_types = ["diversion", "delay", "cancellation", "interruption", "advisory"]
    final_type = notice_type if notice_type in valid_types else "advisory"

    # ID
    agency_id = agency_dict.get("id", "generic")
    if raw.get("id") or raw.get("notice_id") or raw.get("advisory_id"):
        notice_id = str(raw.get("id") or raw.get("notice_id") or raw.get("advisory_id")).strip()
    else:
        notice_id = f"{agency_id}-{hashlib.md5(title.encode('utf-8')).hexdigest()[:8]}"

    # Timestamps
    now = datetime.datetime.utcnow()
    published_time = now
    if raw.get("published_time") or raw.get("publish_date") or raw.get("timestamp"):
        try:
            ts = raw.get("published_time") or raw.get("publish_date") or raw.get("timestamp")
            if isinstance(ts, datetime.datetime):
                published_time = ts
            else:
                published_time = datetime.datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except Exception:
            published_time = now

    valid_from = published_time
    if raw.get("valid_from") or raw.get("start_time") or raw.get("effective_from"):
        try:
            ts = raw.get("valid_from") or raw.get("start_time") or raw.get("effective_from")
            if isinstance(ts, datetime.datetime):
                valid_from = ts
            else:
                valid_from = datetime.datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except Exception:
            valid_from = published_time

    valid_to = None
    if raw.get("valid_to") or raw.get("end_time") or raw.get("effective_to"):
        try:
            ts = raw.get("valid_to") or raw.get("end_time") or raw.get("effective_to")
            if isinstance(ts, datetime.datetime):
                valid_to = ts
            else:
                valid_to = datetime.datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except Exception:
            valid_to = None

    agency_modes = agency_dict.get("transport_types") or ["bus"]
    default_mode = agency_modes[0] if isinstance(agency_modes, list) and len(agency_modes) > 0 else "bus"

    normalized = {
        "id": notice_id,
        "agency_id": agency_id,
        "route_id": str(raw.get("route_id") or raw.get("route")).strip() if (raw.get("route_id") or raw.get("route")) else None,
        "state": str(raw.get("state") or agency_dict.get("state") or "India").strip(),
        "district": str(raw.get("district") or agency_dict.get("district") or "Unspecified").strip(),
        "transport_type": str(raw.get("transport_type") or default_mode).lower().strip(),
        "notice_type": final_type,
        "title": title,
        "summary": summary,
        "affected_area": str(raw.get("affected_area") or raw.get("area") or agency_dict.get("district") or "All Corridors").strip(),
        "source_url": str(raw.get("source_url") or raw.get("url") or agency_dict.get("source_url") or "https://transitnotice.gov.in").strip(),
        "published_time": published_time,
        "valid_from": valid_from,
        "valid_to": valid_to,
        "observed_time": now,
        "last_confirmed_time": now,
        "geojson": raw.get("geojson")
    }

    normalized["content_hash"] = compute_content_hash(normalized)
    return normalized

def calculate_status(notice_data: dict, current_time: datetime.datetime = None) -> str:
    now = current_time or datetime.datetime.utcnow()

    if notice_data.get("is_withdrawn") or notice_data.get("status") == "withdrawn":
        return "withdrawn"
    if notice_data.get("status") == "cancelled":
        return "cancelled"

    valid_from = notice_data.get("valid_from")
    valid_to = notice_data.get("valid_to")

    # If valid_to is in past -> expired
    if valid_to and now > valid_to:
        return "expired"

    # If valid_from is in future -> upcoming
    if valid_from and valid_from > now:
        return "upcoming"

    # If revision > 1 -> revised
    revision_id = notice_data.get("revision_id", 1)
    if revision_id and revision_id > 1:
        return "revised"

    return "active"

def refresh_notice_statuses(db: Session, current_time: datetime.datetime = None) -> dict:
    now = current_time or datetime.datetime.utcnow()

    # Expired check
    expired_count = db.query(Notice).filter(
        Notice.valid_to.isnot(None),
        Notice.valid_to <= now,
        Notice.status.notin_(["expired", "withdrawn", "cancelled"])
    ).update(
        {Notice.status: "expired", Notice.last_confirmed_time: now},
        synchronize_session=False
    )

    # Upcoming to active
    upcoming_to_active = db.query(Notice).filter(
        Notice.valid_from <= now,
        (Notice.valid_to.is_(None) | (Notice.valid_to > now)),
        Notice.status == "upcoming"
    ).update(
        {Notice.status: "active", Notice.last_confirmed_time: now},
        synchronize_session=False
    )

    db.commit()
    return {
        "expiredTransitioned": expired_count,
        "activeTransitioned": upcoming_to_active
    }

def process_notice_batch(db: Session, raw_notices: list, agency_dict: dict, current_time: datetime.datetime = None) -> dict:
    now = current_time or datetime.datetime.utcnow()
    new_count = 0
    revised_count = 0
    confirmed_count = 0
    withdrawn_count = 0
    alerts_created = []

    seen_ids = set()
    valid_incoming = []
    for raw in raw_notices:
        norm = normalize_notice(raw, agency_dict)
        if norm and norm["id"] not in seen_ids:
            seen_ids.add(norm["id"])
            valid_incoming.append(norm)

    for item in valid_incoming:
        existing = db.query(Notice).filter(Notice.id == item["id"]).first()

        if not existing:
            # BRAND NEW NOTICE
            status = calculate_status(item, now)
            item["status"] = status
            item["revision_id"] = 1
            item["change_summary"] = "Initial notice publication"

            notice_obj = Notice(
                id=item["id"],
                agency_id=item["agency_id"],
                route_id=item["route_id"],
                state=item["state"],
                district=item["district"],
                transport_type=item["transport_type"],
                notice_type=item["notice_type"],
                title=item["title"],
                summary=item["summary"],
                affected_area=item["affected_area"],
                source_url=item["source_url"],
                published_time=item["published_time"],
                valid_from=item["valid_from"],
                valid_to=item["valid_to"],
                observed_time=now,
                last_confirmed_time=now,
                content_hash=item["content_hash"],
                revision_id=1,
                change_summary=item["change_summary"],
                status=status,
                geojson=item["geojson"]
            )
            db.add(notice_obj)

            # Record initial revision
            rev_obj = NoticeRevision(
                id=f"{item['id']}-rev1",
                notice_id=item["id"],
                revision_id=1,
                title=item["title"],
                summary=item["summary"],
                valid_from=item["valid_from"],
                valid_to=item["valid_to"],
                content_hash=item["content_hash"],
                change_type="created",
                change_summary=item["change_summary"],
                recorded_at=now
            )
            db.add(rev_obj)

            # Deduplicated Alert
            dedup_key = f"alert-{item['id']}-rev1"
            alert_title = f"[New {item['transport_type'].upper()}] {item['title']}"
            alert_msg = f"{agency_dict.get('name')}: {item['summary'][:140]}"
            
            existing_alert = db.query(Alert).filter(Alert.dedup_key == dedup_key).first()
            if not existing_alert:
                alert_obj = Alert(
                    id=str(uuid.uuid4()),
                    notice_id=item["id"],
                    user_id=None,
                    event_type="new",
                    title=alert_title,
                    message=alert_msg,
                    dedup_key=dedup_key,
                    is_read=False,
                    created_at=now
                )
                db.add(alert_obj)
                alerts_created.append({"id": alert_obj.id, "title": alert_title})

            new_count += 1
        else:
            # EXISTING NOTICE
            if existing.content_hash == item["content_hash"]:
                # Idempotent refresh: exactly identical
                existing.last_confirmed_time = now
                confirmed_count += 1
            else:
                # Content changed!
                next_rev = (existing.revision_id or 1) + 1
                change_type = "revised"
                change_summary = "Advisory details updated by agency"

                if existing.valid_to and item.get("valid_to") and item["valid_to"] > existing.valid_to:
                    change_type = "extended"
                    change_summary = f"Validity extended to {item['valid_to'].strftime('%Y-%m-%d')}"
                elif item.get("notice_type") == "cancellation":
                    change_type = "cancelled"
                    change_summary = "Service cancelled"

                item["revision_id"] = next_rev
                status = calculate_status(item, now)

                existing.route_id = item["route_id"]
                existing.state = item["state"]
                existing.district = item["district"]
                existing.transport_type = item["transport_type"]
                existing.notice_type = item["notice_type"]
                existing.title = item["title"]
                existing.summary = item["summary"]
                existing.affected_area = item["affected_area"]
                existing.source_url = item["source_url"]
                existing.valid_from = item["valid_from"]
                existing.valid_to = item["valid_to"]
                existing.last_confirmed_time = now
                existing.content_hash = item["content_hash"]
                existing.revision_id = next_rev
                existing.change_summary = change_summary
                existing.status = status
                existing.geojson = item["geojson"]

                rev_obj = NoticeRevision(
                    id=f"{item['id']}-rev{next_rev}",
                    notice_id=item["id"],
                    revision_id=next_rev,
                    title=item["title"],
                    summary=item["summary"],
                    valid_from=item["valid_from"],
                    valid_to=item["valid_to"],
                    content_hash=item["content_hash"],
                    change_type=change_type,
                    change_summary=change_summary,
                    recorded_at=now
                )
                db.add(rev_obj)

                dedup_key = f"alert-{item['id']}-rev{next_rev}"
                alert_title = f"[{change_type.upper()}] {item['title']}"
                alert_msg = f"{agency_dict.get('name')}: {change_summary} - {item['summary'][:120]}"

                existing_alert = db.query(Alert).filter(Alert.dedup_key == dedup_key).first()
                if not existing_alert:
                    alert_obj = Alert(
                        id=str(uuid.uuid4()),
                        notice_id=item["id"],
                        user_id=None,
                        event_type=change_type,
                        title=alert_title,
                        message=alert_msg,
                        dedup_key=dedup_key,
                        is_read=False,
                        created_at=now
                    )
                    db.add(alert_obj)
                    alerts_created.append({"id": alert_obj.id, "title": alert_title})

                revised_count += 1

    # Update Agency last_checked_at
    agency_db = db.query(Agency).filter(Agency.id == agency_dict["id"]).first()
    if agency_db:
        agency_db.last_checked_at = now
        agency_db.status_message = "Operational - Feed verified"

    db.commit()
    refresh_notice_statuses(db, now)

    return {
        "itemsFound": len(valid_incoming),
        "newCount": new_count,
        "revisedCount": revised_count,
        "confirmedCount": confirmed_count,
        "withdrawnCount": withdrawn_count,
        "alertsCreated": alerts_created
    }
