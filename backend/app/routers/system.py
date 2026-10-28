import time
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import Notice, Route, Agency, Vehicle, RefreshLog
from backend.app.services.scheduler import scheduler_service

router = APIRouter(prefix="/system", tags=["system"])
START_TIME = time.time()

@router.get("/health")
def system_health(db: Session = Depends(get_db)):
    active_count = db.query(Notice).filter(Notice.status.in_(["active", "revised"])).count()
    upcoming_count = db.query(Notice).filter(Notice.status == "upcoming").count()
    expired_count = db.query(Notice).filter(Notice.status == "expired").count()
    routes_count = db.query(Route).count()
    agencies_count = db.query(Agency).count()
    vehicles_count = db.query(Vehicle).count()

    agencies = db.query(Agency).order_by(Agency.name.asc()).all()
    agencies_out = []
    for ag in agencies:
        agencies_out.append({
            "id": ag.id,
            "name": ag.name,
            "full_name": ag.full_name,
            "feed_type": ag.feed_type,
            "last_checked_at": ag.last_checked_at.isoformat() if ag.last_checked_at else None,
            "status_message": ag.status_message,
            "requires_api_key": ag.requires_api_key
        })

    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "uptimeSeconds": round(time.time() - START_TIME, 2),
        "metrics": {
            "activeNotices": active_count,
            "upcomingNotices": upcoming_count,
            "expiredNotices": expired_count,
            "monitoredRoutes": routes_count,
            "connectedAgencies": agencies_count,
            "trackedVehicles": vehicles_count
        },
        "scheduler": {
            "lastRefreshTimestamp": scheduler_service.last_refresh_timestamp.isoformat() if scheduler_service.last_refresh_timestamp else None,
            "isRefreshing": scheduler_service.is_running
        },
        "agencies": agencies_out
    }

@router.get("/refresh-logs")
def get_refresh_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(RefreshLog, Agency.name.label("agency_name"))\
             .outerjoin(Agency, RefreshLog.agency_id == Agency.id)\
             .order_by(desc(RefreshLog.created_at)).limit(limit).all()

    logs_out = []
    for log, agency_name in logs:
        l_dict = {c.name: getattr(log, c.name) for c in log.__table__.columns}
        l_dict["agency_name"] = agency_name
        logs_out.append(l_dict)

    return {"logs": logs_out}

@router.post("/refresh")
async def trigger_refresh():
    try:
        result = await scheduler_service.run_all_refreshes()
        return {
            "message": "Scheduled refresh completed successfully",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agencies")
def list_agencies(db: Session = Depends(get_db)):
    agencies = db.query(Agency).order_by(Agency.name.asc()).all()
    return {"agencies": agencies}
