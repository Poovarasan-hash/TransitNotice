import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import CoverageRegistry, Notice
from backend.app.services.coverage_registry import STATES_AND_DISTRICTS, get_coverage_for_district

router = APIRouter(prefix="/coverage", tags=["coverage"])

@router.get("/states")
def get_coverage_states(db: Session = Depends(get_db)):
    rows = db.query(CoverageRegistry).order_by(CoverageRegistry.state.asc(), CoverageRegistry.district.asc()).all()

    registry_map = {}
    for r in rows:
        if r.state not in registry_map:
            registry_map[r.state] = []
        registry_map[r.state].append({
            "district": r.district,
            "coverage_level": r.coverage_level,
            "modes": r.transport_modes or ["bus"],
            "notes": r.notes,
            "last_verified_at": r.last_verified_at.isoformat()
        })

    return {
        "states": [s["state"] for s in STATES_AND_DISTRICTS],
        "registry": registry_map,
        "rawList": STATES_AND_DISTRICTS
    }

@router.get("/check")
def check_coverage(state: str, district: str = "", db: Session = Depends(get_db)):
    if not state:
        raise HTTPException(status_code=400, detail="State parameter is required")

    verdict = get_coverage_for_district(state, district)

    # Count notices
    query = db.query(Notice).filter(Notice.status.in_(["active", "revised", "upcoming"]))
    if state and state != "All":
        query = query.filter(Notice.state.ilike(f"%{state}%"))
    if district and district != "All":
        query = query.filter(Notice.district.ilike(f"%{district}%"))

    verdict["active_advisories_count"] = query.count()
    verdict["last_checked"] = datetime.datetime.utcnow().isoformat()

    return verdict
