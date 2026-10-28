from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Alert, Notice

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
def list_alerts(limit: int = 30, db: Session = Depends(get_db)):
    query = db.query(
        Alert,
        Notice.title.label("notice_title"),
        Notice.transport_type.label("transport_type"),
        Notice.notice_type.label("notice_type"),
        Notice.state.label("state"),
        Notice.district.label("district")
    ).outerjoin(Notice, Alert.notice_id == Notice.id).order_by(desc(Alert.created_at)).limit(limit)

    rows = query.all()
    alerts_out = []
    for a, n_title, t_type, n_type, st, dst in rows:
        a_dict = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        a_dict["notice_title"] = n_title
        a_dict["transport_type"] = t_type
        a_dict["notice_type"] = n_type
        a_dict["state"] = st
        a_dict["district"] = dst
        alerts_out.append(a_dict)

    unread_count = db.query(Alert).filter(Alert.is_read == False).count()

    return {
        "alerts": alerts_out,
        "unreadCount": unread_count
    }

@router.post("/read/{id}")
def mark_alert_read(id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"success": True}

@router.post("/mark-all-read")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(Alert).update({Alert.is_read: True})
    db.commit()
    return {"success": True}
