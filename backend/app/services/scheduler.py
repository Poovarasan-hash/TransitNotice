import asyncio
import time
import uuid
import datetime
import logging
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.models import Agency, RefreshLog, Vehicle
from backend.app.services.notice_engine import process_notice_batch, refresh_notice_statuses
from backend.app.services.adapters.delhi_adapter import DelhiOtdAdapter
from backend.app.services.adapters.bmtc_adapter import BmtcAdapter
from backend.app.services.adapters.mumbai_adapter import BestMumbaiAdapter
from backend.app.services.adapters.other_adapters import MtcChennaiAdapter, KsrtcAdapter, NtesRailAdapter

logger = logging.getLogger("transitnotice.scheduler")

class SchedulerService:
    def __init__(self):
        self.adapters = [
            DelhiOtdAdapter(),
            BmtcAdapter(),
            BestMumbaiAdapter(),
            MtcChennaiAdapter(),
            KsrtcAdapter(),
            NtesRailAdapter()
        ]
        self.is_running = False
        self.last_refresh_timestamp = None
        self._task = None

    async def run_single_adapter(self, adapter, db: Session):
        start_time = time.time()
        now = datetime.datetime.utcnow()
        agency_id = adapter.agency_id

        agency = db.query(Agency).filter(Agency.id == agency_id).first()
        if not agency:
            agency = Agency(
                id=agency_id,
                name=adapter.agency_name,
                full_name=adapter.agency_name,
                state="India",
                district="Regional",
                transport_types=["bus", "metro", "rail"],
                feed_type="advisory_verified",
                source_url=adapter.source_url,
                is_active=True,
                last_checked_at=now,
                status_message="Active"
            )
            db.add(agency)
            db.commit()

        agency_dict = {
            "id": agency.id,
            "name": agency.name,
            "state": agency.state,
            "district": agency.district,
            "transport_types": agency.transport_types,
            "source_url": agency.source_url
        }

        try:
            raw_notices = await adapter.fetch_notices()
            proc_res = process_notice_batch(db, raw_notices, agency_dict, now)

            # Vehicles
            raw_vehicles = await adapter.fetch_vehicles()
            for v in raw_vehicles:
                veh = db.query(Vehicle).filter(Vehicle.id == v["id"]).first()
                if not veh:
                    veh = Vehicle(
                        id=v["id"],
                        agency_id=v["agency_id"],
                        route_id=v["route_id"],
                        vehicle_label=v["vehicle_label"],
                        lat=v["lat"],
                        lng=v["lng"],
                        bearing=v.get("bearing", 0.0),
                        speed_kmh=v.get("speed_kmh", 0.0),
                        status=v.get("status", "in_transit"),
                        last_updated_at=now
                    )
                    db.add(veh)
                else:
                    veh.lat = v["lat"]
                    veh.lng = v["lng"]
                    veh.bearing = v.get("bearing", 0.0)
                    veh.speed_kmh = v.get("speed_kmh", 0.0)
                    veh.status = v.get("status", "in_transit")
                    veh.last_updated_at = now
            db.commit()

            duration_ms = int((time.time() - start_time) * 1000)
            log = RefreshLog(
                id=str(uuid.uuid4()),
                agency_id=agency_id,
                status="success",
                items_found=proc_res["itemsFound"],
                new_count=proc_res["newCount"],
                revised_count=proc_res["revisedCount"],
                withdrawn_count=proc_res["withdrawnCount"],
                error_message=None,
                response_time_ms=duration_ms,
                created_at=now
            )
            db.add(log)
            db.commit()

            return {
                "agency_id": agency_id,
                "status": "success",
                "itemsFound": proc_res["itemsFound"],
                "newCount": proc_res["newCount"],
                "revisedCount": proc_res["revisedCount"],
                "durationMs": duration_ms
            }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"[Scheduler] Feed refresh failed for {agency_id}: {e}")

            log = RefreshLog(
                id=str(uuid.uuid4()),
                agency_id=agency_id,
                status="failed",
                items_found=0,
                new_count=0,
                revised_count=0,
                withdrawn_count=0,
                error_message=str(e),
                response_time_ms=duration_ms,
                created_at=now
            )
            db.add(log)
            if agency:
                agency.status_message = f"Degraded - {str(e)[:40]}"
                agency.last_checked_at = now
            db.commit()

            return {
                "agency_id": agency_id,
                "status": "failed",
                "error": str(e),
                "durationMs": duration_ms
            }

    async def run_all_refreshes(self):
        db = SessionLocal()
        results = []
        try:
            for adapter in self.adapters:
                res = await self.run_single_adapter(adapter, db)
                results.push if hasattr(results, 'push') else results.append(res)
            
            transitions = refresh_notice_statuses(db)
            self.last_refresh_timestamp = datetime.datetime.utcnow()
            return {
                "success": True,
                "refreshedAt": self.last_refresh_timestamp.isoformat(),
                "adaptersCount": len(self.adapters),
                "results": results,
                "transitions": transitions
            }
        finally:
            db.close()

    async def _loop(self):
        while self.is_running:
            try:
                await self.run_all_refreshes()
            except Exception as e:
                logger.error(f"[Scheduler] Loop execution error: {e}")
            await asyncio.sleep(settings.REFRESH_INTERVAL_SECONDS)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._loop())
            logger.info(f"Background refresh engine started (Interval: {settings.REFRESH_INTERVAL_SECONDS}s)")

    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None

scheduler_service = SchedulerService()
