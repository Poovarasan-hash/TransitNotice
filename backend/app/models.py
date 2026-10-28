import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="commuter")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    state = Column(String(64), nullable=True)
    district = Column(String(64), nullable=True)
    route_id = Column(String(64), nullable=True)
    agency_id = Column(String(64), nullable=True)
    alert_types = Column(JSON, default=list) # e.g. ["diversion", "delay", "cancellation"]
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="preferences")


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    full_name = Column(String(256), nullable=False)
    state = Column(String(64), nullable=False)
    district = Column(String(64), nullable=False)
    transport_types = Column(JSON, default=list) # ["bus", "metro"]
    feed_type = Column(String(32), nullable=False) # 'live_gtfs', 'advisory_verified', 'schedule_only'
    source_url = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime, nullable=True)
    status_message = Column(String(256), nullable=True)
    requires_api_key = Column(Boolean, default=False)

    routes = relationship("Route", back_populates="agency")
    notices = relationship("Notice", back_populates="agency")
    vehicles = relationship("Vehicle", back_populates="agency")


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(64), primary_key=True, index=True)
    agency_id = Column(String(64), ForeignKey("agencies.id"), nullable=False)
    route_short_name = Column(String(32), nullable=False, index=True)
    route_long_name = Column(String(256), nullable=False)
    transport_type = Column(String(32), nullable=False, index=True) # 'bus', 'metro', 'rail', 'ferry'
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    origin = Column(String(128), nullable=True)
    destination = Column(String(128), nullable=True)
    coordinates = Column(JSON, default=list) # [[lng, lat], ...]
    color = Column(String(16), default="#06B6D4")

    agency = relationship("Agency", back_populates="routes")
    stops = relationship("Stop", back_populates="route", cascade="all, delete-orphan")
    notices = relationship("Notice", back_populates="route")
    vehicles = relationship("Vehicle", back_populates="route")


class Stop(Base):
    __tablename__ = "stops"

    id = Column(String(64), primary_key=True, index=True)
    route_id = Column(String(64), ForeignKey("routes.id"), nullable=False)
    stop_name = Column(String(128), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    stop_sequence = Column(Integer, nullable=False)

    route = relationship("Route", back_populates="stops")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(String(128), primary_key=True, index=True)
    agency_id = Column(String(64), ForeignKey("agencies.id"), nullable=False, index=True)
    route_id = Column(String(64), ForeignKey("routes.id"), nullable=True, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    transport_type = Column(String(32), nullable=False, index=True)
    notice_type = Column(String(32), nullable=False, index=True) # diversion, delay, cancellation, interruption, advisory
    title = Column(String(256), nullable=False)
    summary = Column(Text, nullable=False)
    affected_area = Column(String(256), nullable=True)
    source_url = Column(String(256), nullable=False)
    published_time = Column(DateTime, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=True)
    observed_time = Column(DateTime, nullable=False)
    last_confirmed_time = Column(DateTime, nullable=False)
    content_hash = Column(String(64), nullable=False) # SHA-256
    revision_id = Column(Integer, default=1)
    change_summary = Column(String(256), default="Initial notice publication")
    status = Column(String(32), nullable=False, index=True) # active, upcoming, expired, revised, withdrawn, cancelled
    geojson = Column(JSON, nullable=True)

    agency = relationship("Agency", back_populates="notices")
    route = relationship("Route", back_populates="notices")
    revisions = relationship("NoticeRevision", back_populates="notice", cascade="all, delete-orphan", order_by="NoticeRevision.revision_id.desc()")

    __table_args__ = (
        Index("idx_notices_state_district", "state", "district"),
        Index("idx_notices_status_validity", "status", "valid_from", "valid_to"),
    )


class NoticeRevision(Base):
    __tablename__ = "notice_revisions"

    id = Column(String(128), primary_key=True, index=True)
    notice_id = Column(String(128), ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(Integer, nullable=False)
    title = Column(String(256), nullable=False)
    summary = Column(Text, nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=True)
    content_hash = Column(String(64), nullable=False)
    change_type = Column(String(32), nullable=False) # created, revised, extended, withdrawn, cancelled
    change_summary = Column(String(256), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    notice = relationship("Notice", back_populates="revisions")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(64), primary_key=True, index=True)
    agency_id = Column(String(64), ForeignKey("agencies.id"), nullable=False)
    route_id = Column(String(64), ForeignKey("routes.id"), nullable=False)
    vehicle_label = Column(String(64), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    bearing = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=0.0)
    status = Column(String(32), default="in_transit") # in_transit, delayed, normal
    last_updated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    agency = relationship("Agency", back_populates="vehicles")
    route = relationship("Route", back_populates="vehicles")


class RefreshLog(Base):
    __tablename__ = "refresh_logs"

    id = Column(String(64), primary_key=True, index=True)
    agency_id = Column(String(64), ForeignKey("agencies.id"), nullable=False, index=True)
    status = Column(String(32), nullable=False) # success, failed, partial
    items_found = Column(Integer, default=0)
    new_count = Column(Integer, default=0)
    revised_count = Column(Integer, default=0)
    withdrawn_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    response_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    notice_id = Column(String(128), ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), nullable=True) # Null for broadcast
    event_type = Column(String(32), nullable=False) # new, revised, withdrawn, cancelled
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    dedup_key = Column(String(128), unique=True, index=True, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class CoverageRegistry(Base):
    __tablename__ = "coverage_registry"

    id = Column(String(128), primary_key=True, index=True)
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    coverage_level = Column(String(32), nullable=False) # live_rt, advisory_verified, schedule_only, unintegrated
    transport_modes = Column(JSON, default=list) # ["bus", "metro"]
    notes = Column(Text, nullable=True)
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
