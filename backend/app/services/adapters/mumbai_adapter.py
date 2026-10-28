import datetime
from typing import List, Dict, Any
from backend.app.services.adapters.base_adapter import BaseAdapter

class BestMumbaiAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            agency_id="best_mumbai",
            agency_name="Brihanmumbai Electric Supply & Transport (BEST) & Maha Mumbai Metro",
            source_url="https://www.bestundertaking.com"
        )

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        in12days = now + datetime.timedelta(days=12)
        yesterday = now - datetime.timedelta(days=1)

        return [
            {
                "id": "BEST-DIV-2026-108",
                "title": "Coastal Road Linkage: BEST Routes 108, 123 & 132 Diverted via Maharshi Karve Road",
                "summary": "Due to municipal asphalt resurfacing and gantry installation on Marine Drive between Nariman Point and Churchgate, south-bound buses will divert via Maharshi Karve Road. Expect 10-15 min delays.",
                "notice_type": "diversion",
                "route_id": "BEST-108",
                "state": "Maharashtra",
                "district": "Mumbai City",
                "transport_type": "bus",
                "affected_area": "Marine Drive, Nariman Point, Churchgate Station",
                "source_url": "https://www.bestundertaking.com/notices/marine-drive-diversion",
                "published_time": yesterday,
                "valid_from": yesterday,
                "valid_to": in12days,
                "geojson": {
                    "type": "LineString",
                    "coordinates": [[72.8258, 18.9322], [72.8282, 18.9370], [72.8315, 18.9410]]
                }
            }
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        return [
            {
                "id": "MH-01-AP-6611",
                "agency_id": "best_mumbai",
                "route_id": "BEST-108",
                "vehicle_label": "BEST Olectra Double-Decker #6611",
                "lat": 18.9322,
                "lng": 72.8258,
                "bearing": 15.0,
                "speed_kmh": 18.0,
                "status": "delayed",
                "last_updated_at": now
            }
        ]
