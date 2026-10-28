from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Route, Stop, Vehicle, Agency, Notice

router = APIRouter(prefix="/routes", tags=["routes"])

@router.get("")
def list_routes(
    state: Optional[str] = None,
    district: Optional[str] = None,
    transport_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Route, Agency.name.label("agency_name")).outerjoin(Agency, Route.agency_id == Agency.id)

    if state and state != "All":
        query = query.filter(Route.state.ilike(f"%{state}%"))
    if district and district != "All":
        query = query.filter(Route.district.ilike(f"%{district}%"))
    if transport_type and transport_type != "All":
        query = query.filter(Route.transport_type.ilike(transport_type))

    rows = query.order_by(Route.route_short_name.asc()).all()

    routes_out = []
    for route, agency_name in rows:
        r_dict = {c.name: getattr(route, c.name) for c in route.__table__.columns}
        r_dict["agency_name"] = agency_name
        routes_out.append(r_dict)

    return {"routes": routes_out}

@router.get("/{id}")
def get_route_detail(id: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.id == id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    stops = db.query(Stop).filter(Stop.route_id == id).order_by(Stop.stop_sequence.asc()).all()
    vehicles = db.query(Vehicle).filter(Vehicle.route_id == id).all()
    notices = db.query(Notice).filter(Notice.route_id == id, Notice.status.in_(["active", "revised", "upcoming"])).all()

    r_dict = {c.name: getattr(route, c.name) for c in route.__table__.columns}

    return {
        "route": r_dict,
        "stops": stops,
        "vehicles": vehicles,
        "activeNotices": notices
    }

@router.get("/vehicles/all")
def list_all_vehicles(
    route_id: Optional[str] = None,
    agency_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        Vehicle,
        Route.route_short_name.label("route_short_name"),
        Route.transport_type.label("transport_type"),
        Agency.name.label("agency_name")
    ).outerjoin(Route, Vehicle.route_id == Route.id)\
     .outerjoin(Agency, Vehicle.agency_id == Agency.id)

    if route_id:
        query = query.filter(Vehicle.route_id == route_id)
    if agency_id:
        query = query.filter(Vehicle.agency_id == agency_id)

    rows = query.all()
    vehicles_out = []
    for v, r_short, t_type, ag_name in rows:
        v_dict = {c.name: getattr(v, c.name) for c in v.__table__.columns}
        v_dict["route_short_name"] = r_short
        v_dict["transport_type"] = t_type
        v_dict["agency_name"] = ag_name
        vehicles_out.append(v_dict)

    return {"vehicles": vehicles_out}
