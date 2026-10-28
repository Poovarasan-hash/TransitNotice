from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, case

from backend.app.database import get_db
from backend.app.models import Notice, NoticeRevision, Agency, Route
from backend.app.services.notice_engine import refresh_notice_statuses

router = APIRouter(prefix="/notices", tags=["notices"])

@router.get("")
def list_notices(
    state: Optional[str] = None,
    district: Optional[str] = None,
    route_id: Optional[str] = None,
    agency_id: Optional[str] = None,
    transport_type: Optional[str] = None,
    notice_type: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    # Ensure statuses are refreshed
    refresh_notice_statuses(db)

    query = db.query(
        Notice,
        Agency.name.label("agency_name"),
        Route.route_short_name.label("route_short_name"),
        Route.route_long_name.label("route_long_name")
    ).outerjoin(Agency, Notice.agency_id == Agency.id).outerjoin(Route, Notice.route_id == Route.id)

    if state and state != "All":
        query = query.filter(Notice.state.ilike(f"%{state}%"))
    if district and district != "All":
        query = query.filter(Notice.district.ilike(f"%{district}%"))
    if route_id and route_id != "All":
        query = query.filter(Notice.route_id == route_id)
    if agency_id and agency_id != "All":
        query = query.filter(Notice.agency_id == agency_id)
    if transport_type and transport_type != "All":
        query = query.filter(Notice.transport_type.ilike(transport_type))
    if notice_type and notice_type != "All":
        query = query.filter(Notice.notice_type.ilike(notice_type))
    if status and status != "All":
        query = query.filter(Notice.status.ilike(status))

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Notice.title.ilike(term),
                Notice.summary.ilike(term),
                Notice.affected_area.ilike(term),
                Notice.id.ilike(term)
            )
        )

    # Order priority: active -> revised -> upcoming -> cancelled -> expired
    status_order = case(
        (Notice.status == "active", 1),
        (Notice.status == "revised", 2),
        (Notice.status == "upcoming", 3),
        (Notice.status == "cancelled", 4),
        (Notice.status == "expired", 5),
        else_=6
    )

    query = query.order_by(status_order, desc(Notice.published_time))
    rows = query.offset(offset).limit(limit).all()

    notices_out = []
    for notice, agency_name, r_short, r_long in rows:
        n_dict = {c.name: getattr(notice, c.name) for c in notice.__table__.columns}
        n_dict["agency_name"] = agency_name
        n_dict["route_short_name"] = r_short
        n_dict["route_long_name"] = r_long
        notices_out.append(n_dict)

    return {
        "count": len(notices_out),
        "notices": notices_out
    }

@router.get("/{id}")
def get_notice_detail(id: str, db: Session = Depends(get_db)):
    refresh_notice_statuses(db)

    row = db.query(
        Notice,
        Agency.name.label("agency_name"),
        Agency.full_name.label("agency_full_name"),
        Agency.feed_type.label("agency_feed_type"),
        Agency.source_url.label("agency_source_url"),
        Route.route_short_name.label("route_short_name"),
        Route.route_long_name.label("route_long_name"),
        Route.coordinates.label("route_coordinates")
    ).outerjoin(Agency, Notice.agency_id == Agency.id)\
     .outerjoin(Route, Notice.route_id == Route.id)\
     .filter(Notice.id == id).first()

    if not row:
        raise HTTPException(status_code=404, detail="Notice not found")

    notice, ag_name, ag_full, feed_type, ag_url, r_short, r_long, r_coords = row

    n_dict = {c.name: getattr(notice, c.name) for c in notice.__table__.columns}
    n_dict["agency_name"] = ag_name
    n_dict["agency_full_name"] = ag_full
    n_dict["feed_type"] = feed_type
    n_dict["agency_source_url"] = ag_url
    n_dict["route_short_name"] = r_short
    n_dict["route_long_name"] = r_long
    n_dict["route_coordinates"] = r_coords

    revisions = db.query(NoticeRevision).filter(NoticeRevision.notice_id == id).order_by(desc(NoticeRevision.revision_id)).all()

    return {
        "notice": n_dict,
        "revisions": revisions
    }

@router.get("/{id}/revisions")
def get_notice_revisions(id: str, db: Session = Depends(get_db)):
    revisions = db.query(NoticeRevision).filter(NoticeRevision.notice_id == id).order_by(NoticeRevision.revision_id.asc()).all()
    return {"revisions": revisions}
