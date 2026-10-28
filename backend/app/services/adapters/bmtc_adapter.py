import datetime
from typing import List, Dict, Any
from backend.app.services.adapters.base_adapter import BaseAdapter
from backend.app.config import settings

class BmtcAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            agency_id="bmtc_bengaluru",
            agency_name="Bengaluru Metropolitan Transport Corp (BMTC) & BMRCL",
            source_url="https://mybmtc.karnataka.gov.in"
        )

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        in5days = now + datetime.timedelta(days=5)
        in10days = now + datetime.timedelta(days=10)
        twodaysago = now - datetime.timedelta(days=2)

        return [
            {
                "id": "BMTC-ADV-2026-302",
                "title": "Outer Ring Road (ORR) Bus Priority Lane: Silk Board to Bellandur Diversion",
                "summary": "BBMP pipeline and road resurfacing work near Bellandur EcoSpace. Route 500-D and 500-CA will operate via inner service road between 11:00 PM and 05:30 AM. Peak hour bus lane is maintained with slow vehicular movement.",
                "notice_type": "diversion",
                "route_id": "BMTC-500D",
                "state": "Karnataka",
                "district": "Bengaluru Urban",
                "transport_type": "bus",
                "affected_area": "Silk Board, HSR Layout, Bellandur, Marathahalli",
                "source_url": "https://mybmtc.karnataka.gov.in/notifications/orr-bellandur",
                "published_time": twodaysago,
                "valid_from": twodaysago,
                "valid_to": in10days,
                "geojson": {
                    "type": "LineString",
                    "coordinates": [[77.6245, 12.9176], [77.6534, 12.9279], [77.6744, 12.9372]]
                }
            },
            {
                "id": "BMRCL-METRO-2026-044",
                "title": "Namma Metro Yellow Line: Feeder Shuttles Introduced at RV Road & Electronic City",
                "summary": "BMRCL in coordination with BMTC introduces dedicated feeder buses MF-11 and MF-12 connecting RV Road Interchange with Jayadeva Hospital and Bommasandra tech cluster.",
                "notice_type": "advisory",
                "route_id": "BMRCL-YELLOW",
                "state": "Karnataka",
                "district": "Bengaluru Urban",
                "transport_type": "metro",
                "affected_area": "RV Road, Jayadeva, Electronic City Phase 1 & 2",
                "source_url": "https://english.bmrc.co.in/TravelInfo/Alerts",
                "published_time": now,
                "valid_from": now,
                "valid_to": in5days
            }
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        return [
            {
                "id": "KA-01-F-9418",
                "agency_id": "bmtc_bengaluru",
                "route_id": "BMTC-500D",
                "vehicle_label": "BMTC Volvo Electric #9418",
                "lat": 12.9279,
                "lng": 77.6534,
                "bearing": 60.0,
                "speed_kmh": 21.0,
                "status": "in_transit",
                "last_updated_at": now
            }
        ]
