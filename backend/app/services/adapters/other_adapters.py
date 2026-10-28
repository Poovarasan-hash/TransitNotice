import datetime
from typing import List, Dict, Any
from backend.app.services.adapters.base_adapter import BaseAdapter

class MtcChennaiAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            agency_id="mtc_chennai",
            agency_name="Metropolitan Transport Corporation (MTC Chennai) & CMRL",
            source_url="https://mtcbus.tn.gov.in"
        )

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        in15days = now + datetime.timedelta(days=15)
        threedaysago = now - datetime.timedelta(days=3)

        return [
            {
                "id": "MTC-ADV-2026-041",
                "title": "Phase-2 CMRL Corridor 4 Work: Mount-Poonamallee Road Route Diversions",
                "summary": "Due to elevated metro pier construction on Mount-Poonamallee High Road near Porur junction, MTC Deluxe bus routes 25G, 49, 88M and 54 are diverted via Ramapuram DLF IT Park and Butt Road. All scheduled stops between Mugalivakkam and Porur will be served via parallel service lane.",
                "notice_type": "diversion",
                "route_id": "MTC-25G",
                "state": "Tamil Nadu",
                "district": "Chennai",
                "transport_type": "bus",
                "affected_area": "Porur Junction, Ramapuram, Mount-Poonamallee Road, Guindy",
                "source_url": "https://mtcbus.tn.gov.in/notices/porur-cmrl-diversion",
                "published_time": threedaysago,
                "valid_from": threedaysago,
                "valid_to": in15days,
                "geojson": {
                    "type": "LineString",
                    "coordinates": [[80.1582, 13.0336], [80.1741, 13.0298], [80.2014, 13.0102]]
                }
            }
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        return [
            {
                "id": "TN-01-AN-1984",
                "agency_id": "mtc_chennai",
                "route_id": "MTC-25G",
                "vehicle_label": "MTC Low-Floor AC #1984",
                "lat": 13.0298,
                "lng": 80.1741,
                "bearing": 105.0,
                "speed_kmh": 22.0,
                "status": "delayed",
                "last_updated_at": now
            }
        ]

class KsrtcAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            agency_id="ksrtc_kerala",
            agency_name="Kerala State Road Transport Corp (KSRTC SWIFT) & Kochi Metro",
            source_url="https://www.onlineksrtcswift.com"
        )

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        in14days = now + datetime.timedelta(days=14)
        yesterday = now - datetime.timedelta(days=1)

        return [
            {
                "id": "KSRTC-GHAT-2026-14",
                "title": "Thamarassery Churam (NH 766): Heavy Multi-Axle Bus Restriction & Diversion via Kuttiyadi",
                "summary": "Following district collectorate advisory regarding heavy rainfall and slope stabilization works at hairpin bends 7 and 8 of Thamarassery ghat road, multi-axle buses are diverted via Kuttiyadi ghat route.",
                "notice_type": "diversion",
                "route_id": "KSRTC-WAYANAD",
                "state": "Kerala",
                "district": "Wayanad",
                "transport_type": "bus",
                "affected_area": "Thamarassery Churam, Adivaram, Lakkidi, Kalpetta, Kuttiyadi",
                "source_url": "https://www.keralartc.com/travel-alerts/ghat-diversion",
                "published_time": yesterday,
                "valid_from": yesterday,
                "valid_to": in14days,
                "geojson": {
                    "type": "LineString",
                    "coordinates": [[75.9821, 11.4889], [76.0145, 11.5120], [76.0825, 11.5540]]
                }
            }
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        return []

class NtesRailAdapter(BaseAdapter):
    def __init__(self):
        super().__init__(
            agency_id="indian_railways",
            agency_name="Indian Railways / NTES & Suburban Commuter Rail",
            source_url="https://enquiry.indianrail.gov.in"
        )

    async def fetch_notices(self) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        in2days = now + datetime.timedelta(days=2)
        yesterday = now - datetime.timedelta(days=1)

        return [
            {
                "id": "IR-CR-MEGABLOCK-2026-44",
                "title": "Central Railway: Sunday Mega Block Between Matunga and Mulund (Slow Corridor)",
                "summary": "Engineering and maintenance works on UP and DOWN slow lines between Matunga and Mulund stations from 11:05 AM to 03:55 PM. Slow local trains diverted on fast corridors.",
                "notice_type": "interruption",
                "route_id": "IR-CR-MAIN",
                "state": "Maharashtra",
                "district": "Mumbai Suburban",
                "transport_type": "rail",
                "affected_area": "CSMT, Dadar, Matunga, Kurla, Ghatkopar, Thane, Kalyan",
                "source_url": "https://cr.indianrailways.gov.in/press_releases/mega-block",
                "published_time": yesterday,
                "valid_from": yesterday,
                "valid_to": in2days,
                "geojson": {
                    "type": "LineString",
                    "coordinates": [[72.8550, 19.0270], [72.8710, 19.0650], [72.9380, 19.1720]]
                }
            }
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        return []
