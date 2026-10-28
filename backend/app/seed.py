import bcrypt
import datetime
import json
from backend.app.database import SessionLocal, engine
from backend.app.models import User, UserPreference, Agency, Route, Stop, CoverageRegistry
from backend.app.services.coverage_registry import STATES_AND_DISTRICTS

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def seed_db():
    db = SessionLocal()
    now = datetime.datetime.utcnow()

    # 1. Demo Users
    if not db.query(User).filter(User.username == "rajesh_transit").first():
        commuter = User(
            id="user-demo-1",
            username="rajesh_transit",
            email="commuter@transitnotice.gov.in",
            password_hash=get_password_hash("TransitPass123!"),
            role="commuter",
            created_at=now
        )
        db.add(commuter)

        pref = UserPreference(
            id="pref-demo-1",
            user_id="user-demo-1",
            state="Delhi (NCT)",
            district="South Delhi",
            route_id="DTC-534",
            agency_id="delhi_otd",
            alert_types=["diversion", "delay", "cancellation"],
            created_at=now
        )
        db.add(pref)

    if not db.query(User).filter(User.username == "bmtc_dispatch").first():
        admin = User(
            id="user-demo-2",
            username="bmtc_dispatch",
            email="officer@bmtc.gov.in",
            password_hash=get_password_hash("AdminPass123!"),
            role="agency_admin",
            created_at=now
        )
        db.add(admin)

    # 2. Agencies
    agencies_data = [
        ("delhi_otd", "Delhi Transport (DTC & DMRC)", "Delhi Transport Corporation & Delhi Metro Rail Corp (OTD Portal)", "Delhi (NCT)", "New Delhi", ["bus", "metro"], "live_gtfs", "https://otd.delhi.gov.in"),
        ("bmtc_bengaluru", "BMTC & Namma Metro", "Bengaluru Metropolitan Transport Corporation & BMRCL", "Karnataka", "Bengaluru Urban", ["bus", "metro"], "live_gtfs", "https://mybmtc.karnataka.gov.in"),
        ("best_mumbai", "BEST & Maha Mumbai Metro", "Brihanmumbai Electric Supply & Transport & MMRDA Metro", "Maharashtra", "Mumbai Suburban", ["bus", "metro"], "advisory_verified", "https://www.bestundertaking.com"),
        ("mtc_chennai", "MTC Chennai & CMRL Metro", "Metropolitan Transport Corporation Chennai & Chennai Metro Rail Ltd", "Tamil Nadu", "Chennai", ["bus", "metro"], "advisory_verified", "https://mtcbus.tn.gov.in"),
        ("ksrtc_kerala", "KSRTC Kerala & Kochi Metro", "Kerala State Road Transport Corporation & KMRL Kochi Water Metro", "Kerala", "Ernakulam (Kochi)", ["bus", "ferry", "metro"], "advisory_verified", "https://www.onlineksrtcswift.com"),
        ("indian_railways", "Indian Railways (Suburban)", "Indian Railways / NTES & Suburban Commuter Rail", "Maharashtra", "Mumbai Suburban", ["rail"], "advisory_verified", "https://enquiry.indianrail.gov.in")
    ]

    for a_id, name, full_name, state, district, modes, feed_type, url in agencies_data:
        ag = db.query(Agency).filter(Agency.id == a_id).first()
        if not ag:
            ag = Agency(
                id=a_id,
                name=name,
                full_name=full_name,
                state=state,
                district=district,
                transport_types=modes,
                feed_type=feed_type,
                source_url=url,
                is_active=True,
                last_checked_at=now,
                status_message="Operational - Feed Verified"
            )
            db.add(ag)

    db.commit()

    # 3. Routes & Stops
    routes_data = [
        ("DTC-534", "delhi_otd", "534", "Mehrauli Terminal to Anand Vihar ISBT", "bus", "Delhi (NCT)", "South Delhi", "Mehrauli Terminal", "Anand Vihar ISBT", [[77.1855, 28.5186], [77.2066, 28.5412], [77.2410, 28.5670], [77.2588, 28.5714], [77.2810, 28.5990], [77.3150, 28.6470]], "#06B6D4"),
        ("DTC-429", "delhi_otd", "429", "Kashmere Gate ISBT to Nehru Place Terminal", "bus", "Delhi (NCT)", "Central Delhi", "Kashmere Gate ISBT", "Nehru Place Terminal", [[77.2285, 28.6675], [77.2340, 28.6505], [77.2167, 28.6315], [77.2435, 28.5850], [77.2520, 28.5480]], "#38BDF8"),
        ("DMRC-RED", "delhi_otd", "Red Line", "Rithala to Shaheed Sthal (New Bus Adda)", "metro", "Delhi (NCT)", "Central Delhi", "Rithala", "Shaheed Sthal", [[77.1065, 28.7208], [77.1480, 28.6980], [77.1950, 28.6740], [77.2285, 28.6675], [77.2750, 28.6750], [77.3480, 28.6720]], "#EF4444"),
        ("BMTC-500D", "bmtc_bengaluru", "500-D", "Hebbal to Central Silk Board via ORR", "bus", "Karnataka", "Bengaluru Urban", "Hebbal TTMC", "Central Silk Board", [[77.5970, 13.0358], [77.6250, 13.0110], [77.6970, 12.9980], [77.6980, 12.9550], [77.6744, 12.9372], [77.6245, 12.9176]], "#10B981"),
        ("BEST-108", "best_mumbai", "108", "CSMT to Marine Drive / Backbay Depot", "bus", "Maharashtra", "Mumbai City", "CSMT Mumbai", "Backbay Depot", [[72.8358, 18.9400], [72.8315, 18.9370], [72.8282, 18.9322], [72.8258, 18.9240], [72.8205, 18.9180]], "#EC4899"),
        ("MTC-25G", "mtc_chennai", "25G", "Anna Square to Poonamallee via Porur", "bus", "Tamil Nadu", "Chennai", "Anna Square", "Poonamallee Terminus", [[80.2820, 13.0640], [80.2450, 13.0450], [80.2014, 13.0102], [80.1741, 13.0298], [80.1582, 13.0336], [80.1110, 13.0480]], "#8B5CF6")
    ]

    for r_id, a_id, short_n, long_n, t_type, st, dst, orig, dest, coords, col in routes_data:
        r = db.query(Route).filter(Route.id == r_id).first()
        if not r:
            r = Route(
                id=r_id,
                agency_id=a_id,
                route_short_name=short_n,
                route_long_name=long_n,
                transport_type=t_type,
                state=st,
                district=dst,
                origin=orig,
                destination=dest,
                coordinates=coords,
                color=col
            )
            db.add(r)

    db.commit()

    # 4. Stops
    stops_data = [
        ("stop-534-1", "DTC-534", "Mehrauli Terminal", 28.5186, 77.1855, 1),
        ("stop-534-2", "DTC-534", "IIT Delhi Gate", 28.5412, 77.2066, 2),
        ("stop-534-3", "DTC-534", "AIIMS Ring Road", 28.5670, 77.2410, 3),
        ("stop-534-4", "DTC-534", "Ashram Chowk (Diverted Bay)", 28.5714, 77.2588, 4),
        ("stop-534-5", "DTC-534", "Anand Vihar ISBT", 28.6470, 77.3150, 5),
        ("stop-500d-1", "BMTC-500D", "Hebbal TTMC", 13.0358, 77.5970, 1),
        ("stop-500d-2", "BMTC-500D", "Manyata Tech Park", 13.0110, 77.6250, 2),
        ("stop-500d-3", "BMTC-500D", "Marathahalli Bridge", 12.9550, 77.6980, 3),
        ("stop-500d-4", "BMTC-500D", "Bellandur EcoSpace", 12.9279, 77.6744, 4),
        ("stop-500d-5", "BMTC-500D", "Central Silk Board", 12.9176, 77.6245, 5)
    ]

    for s_id, r_id, s_name, lat, lng, seq in stops_data:
        st = db.query(Stop).filter(Stop.id == s_id).first()
        if not st:
            st = Stop(id=s_id, route_id=r_id, stop_name=s_name, lat=lat, lng=lng, stop_sequence=seq)
            db.add(st)

    # 5. Coverage Registry
    for st in STATES_AND_DISTRICTS:
        for d in st["districts"]:
            cov_id = f"cov-{st['state']}-{d['name']}".lower().replace(" ", "-").replace("(", "").replace(")", "")
            c = db.query(CoverageRegistry).filter(CoverageRegistry.id == cov_id).first()
            if not c:
                c = CoverageRegistry(
                    id=cov_id,
                    state=st["state"],
                    district=d["name"],
                    coverage_level=d["level"],
                    transport_modes=d["modes"],
                    notes=d["notes"],
                    last_verified_at=now
                )
                db.add(c)

    db.commit()
    db.close()
    print("[Seed] FastAPI PostgreSQL/SQLite database successfully populated!")

if __name__ == "__main__":
    seed_db()
