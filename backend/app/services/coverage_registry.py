COVERAGE_LEVELS = {
    "LIVE_RT": "live_rt",
    "ADVISORY_VERIFIED": "advisory_verified",
    "SCHEDULE_ONLY": "schedule_only",
    "UNINTEGRATED": "unintegrated"
}

STATES_AND_DISTRICTS = [
    {
        "state": "Delhi (NCT)",
        "districts": [
            {"name": "Central Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "Delhi Transport Corp (DTC) & DMRC", "notes": "Open Transit Data (OTD) portal live GTFS & static feeds"},
            {"name": "New Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "DTC, Cluster, DMRC", "notes": "Verified real-time route alerts and diversions"},
            {"name": "South Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "DTC & DMRC", "notes": "Live GPS bus positions & metro advisory notifications"},
            {"name": "North Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "DTC & DMRC", "notes": "GTFS-RT alerts verified"},
            {"name": "West Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "DTC & DMRC", "notes": "Active route alerts and track maintenance"},
            {"name": "East Delhi", "level": "live_rt", "modes": ["bus", "metro"], "agency": "DTC & DMRC", "notes": "Trans-Yamuna corridor updates"}
        ]
    },
    {
        "state": "Karnataka",
        "districts": [
            {"name": "Bengaluru Urban", "level": "live_rt", "modes": ["bus", "metro"], "agency": "BMTC & BMRCL Namma Metro", "notes": "BMTC Intelligent Transport System API & Namma Metro Yellow/Purple line advisories"},
            {"name": "Mysuru", "level": "schedule_only", "modes": ["bus"], "agency": "KSRTC Mysore Urban", "notes": "Schedule/advisory data only. Live GPS feed restricted to internal depot dispatch."},
            {"name": "Dakshina Kannada (Mangaluru)", "level": "schedule_only", "modes": ["bus"], "agency": "KSRTC Mangalore", "notes": "Intercity schedule and coastal road monsoon advisories"}
        ]
    },
    {
        "state": "Maharashtra",
        "districts": [
            {"name": "Mumbai Suburban", "level": "advisory_verified", "modes": ["bus", "metro", "rail"], "agency": "BEST, Maha Mumbai Metro & Central/Western Railway", "notes": "Daily mega-block updates, Metro Line 2A/7 & Aqua Line 3 diversions"},
            {"name": "Mumbai City", "level": "advisory_verified", "modes": ["bus", "metro", "rail"], "agency": "BEST & CMRL", "notes": "South Mumbai coastal road & arterial diversions"},
            {"name": "Pune", "level": "advisory_verified", "modes": ["bus", "metro"], "agency": "PMPML & Pune Metro", "notes": "Civil Court interchange & Swargate underground extension updates"}
        ]
    },
    {
        "state": "Tamil Nadu",
        "districts": [
            {"name": "Chennai", "level": "advisory_verified", "modes": ["bus", "metro", "rail"], "agency": "MTC Chennai, CMRL & Southern Railway", "notes": "Phase 2 Metro construction diversions at Kodambakkam, Porur & OMR"},
            {"name": "Coimbatore", "level": "schedule_only", "modes": ["bus"], "agency": "TNSTC Coimbatore", "notes": "Schedule data only. Live tracking pending smart city API integration."}
        ]
    },
    {
        "state": "Kerala",
        "districts": [
            {"name": "Ernakulam (Kochi)", "level": "advisory_verified", "modes": ["bus", "metro", "ferry"], "agency": "KMRL Metro, Kochi Water Metro & KSRTC SWIFT", "notes": "Water Metro jetty updates & Vyttila mobility hub diversions"},
            {"name": "Wayanad", "level": "advisory_verified", "modes": ["bus"], "agency": "KSRTC North Zone", "notes": "Thamarassery Churam ghat road weather diversions and weight limits"}
        ]
    },
    {
        "state": "Telangana",
        "districts": [
            {"name": "Hyderabad", "level": "advisory_verified", "modes": ["bus", "metro"], "agency": "TSRTC & Hyderabad Metro Rail (L&T)", "notes": "Ameerpet interchange, MGBS hub and airport express updates"}
        ]
    },
    {
        "state": "West Bengal",
        "districts": [
            {"name": "Kolkata", "level": "advisory_verified", "modes": ["bus", "metro", "ferry", "rail"], "agency": "WBTC, KMRCL Metro & Eastern Railway", "notes": "Underwater East-West Green line, Howrah tram route alterations"}
        ]
    }
]

def get_coverage_for_district(state: str, district: str = None) -> dict:
    norm_state = (state or "").lower()
    norm_dist = (district or "").lower()

    for st in STATES_AND_DISTRICTS:
        if st["state"].lower() in norm_state or norm_state in st["state"].lower():
            if district:
                for d in st["districts"]:
                    if d["name"].lower() in norm_dist or norm_dist in d["name"].lower():
                        return {
                            "state": st["state"],
                            "district": d["name"],
                            "coverage_level": d["level"],
                            "modes": d["modes"],
                            "agency": d["agency"],
                            "notes": d["notes"],
                            "is_live_available": d["level"] == COVERAGE_LEVELS["LIVE_RT"],
                            "provenance": "Official Live Feed" if d["level"] == COVERAGE_LEVELS["LIVE_RT"] else "Official Portal / Circulars"
                        }
            else:
                first = st["districts"][0]
                return {
                    "state": st["state"],
                    "district": "All Districts",
                    "coverage_level": first["level"],
                    "modes": first["modes"],
                    "agency": first["agency"],
                    "notes": first["notes"],
                    "is_live_available": first["level"] == COVERAGE_LEVELS["LIVE_RT"],
                    "provenance": "Official State Portal"
                }

    return {
        "state": state or "India",
        "district": district or "Unspecified",
        "coverage_level": COVERAGE_LEVELS["UNINTEGRATED"],
        "modes": ["bus", "rail"],
        "agency": "State Transport / Regional Authority",
        "notes": "Live data unavailable. Schedule/advisory data only. No direct real-time API connected for this specific district yet.",
        "is_live_available": False,
        "provenance": "Unintegrated Area"
    }
