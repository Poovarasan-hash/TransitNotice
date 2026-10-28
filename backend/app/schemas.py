import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# User & Auth
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    emailOrUsername: str
    password: str

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    message: str
    user: UserOut
    token: str

class UserPreferencesUpdate(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    route_id: Optional[str] = None
    agency_id: Optional[str] = None
    alert_types: Optional[List[str]] = None

class UserPreferencesOut(BaseModel):
    id: str
    user_id: str
    state: Optional[str] = None
    district: Optional[str] = None
    route_id: Optional[str] = None
    agency_id: Optional[str] = None
    alert_types: List[str] = []

    class Config:
        from_attributes = True

# Notice & Revisions
class NoticeRevisionOut(BaseModel):
    id: str
    notice_id: str
    revision_id: int
    title: str
    summary: str
    valid_from: datetime.datetime
    valid_to: Optional[datetime.datetime] = None
    content_hash: str
    change_type: str
    change_summary: str
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True

class NoticeOut(BaseModel):
    id: str
    agency_id: str
    route_id: Optional[str] = None
    state: str
    district: str
    transport_type: str
    notice_type: str
    title: str
    summary: str
    affected_area: Optional[str] = None
    source_url: str
    published_time: datetime.datetime
    valid_from: datetime.datetime
    valid_to: Optional[datetime.datetime] = None
    observed_time: datetime.datetime
    last_confirmed_time: datetime.datetime
    content_hash: str
    revision_id: int
    change_summary: str
    status: str
    geojson: Optional[Any] = None
    agency_name: Optional[str] = None
    route_short_name: Optional[str] = None
    route_long_name: Optional[str] = None

    class Config:
        from_attributes = True

class NoticeDetailOut(BaseModel):
    notice: Dict[str, Any]
    revisions: List[NoticeRevisionOut]

# Routes & Stops & Vehicles
class StopOut(BaseModel):
    id: str
    route_id: str
    stop_name: str
    lat: float
    lng: float
    stop_sequence: int

    class Config:
        from_attributes = True

class RouteOut(BaseModel):
    id: str
    agency_id: str
    route_short_name: str
    route_long_name: str
    transport_type: str
    state: str
    district: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    coordinates: List[Any] = []
    color: str = "#06B6D4"
    agency_name: Optional[str] = None

    class Config:
        from_attributes = True

class VehicleOut(BaseModel):
    id: str
    agency_id: str
    route_id: str
    vehicle_label: str
    lat: float
    lng: float
    bearing: float
    speed_kmh: float
    status: str
    last_updated_at: datetime.datetime
    route_short_name: Optional[str] = None
    transport_type: Optional[str] = None
    agency_name: Optional[str] = None

    class Config:
        from_attributes = True

# Alerts
class AlertOut(BaseModel):
    id: str
    notice_id: str
    user_id: Optional[str] = None
    event_type: str
    title: str
    message: str
    dedup_key: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Coverage
class CoverageCheckOut(BaseModel):
    state: str
    district: str
    coverage_level: str
    modes: List[str]
    agency: str
    notes: Optional[str] = None
    is_live_available: bool
    provenance: str
    active_advisories_count: int = 0
    last_checked: datetime.datetime

# System Health
class SystemHealthOut(BaseModel):
    status: str
    timestamp: datetime.datetime
    uptimeSeconds: float
    metrics: Dict[str, int]
    agencies: List[Dict[str, Any]]
