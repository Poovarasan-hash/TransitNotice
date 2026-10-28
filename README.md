# TransitNotice — Public Transport Service Update Tracker

**TransitNotice** is a public service intelligence web application for India that monitors public transit routes and service updates—including diversions, cancellations, delays, planned track maintenance, and official government advisories—across buses, metro networks, suburban trains, and passenger ferries.

---

## 🏛️ Platform Architecture

- **Backend**: Python 3.13 with **FastAPI**, **SQLAlchemy ORM**, **Pydantic v2**, and **Alembic** migrations.
- **Database**: **PostgreSQL** (via `psycopg` / `psycopg2-binary`) with automated resilience fallback to persistent local SQLite (`transitnotice.db`) for zero-friction local development.
- **Frontend**: **React 19** with **Vite**, **Tailwind CSS**, **Leaflet** (interactive India map with GeoJSON state & district boundaries), and **Lucide React** icons.
- **Background Scheduler**: Async background polling engine running every 2 minutes with exponential retry backoff, timeout protection, canonical SHA-256 content hashing, idempotent updates, and audit revision history.

---

## 🗺️ India Transport Coverage & Provenance

TransitNotice adheres to strict data integrity standards: **it never scrapes restricted portals, bypasses CAPTCHAs, or fabricates artificial vehicle telemetry.** 

| State / UT | District | Transport Types | Verified Agency & Provenance | Live Telemetry Status |
| :--- | :--- | :--- | :--- | :--- |
| **Delhi (NCT)** | Central, South, New Delhi, North, East | Bus, Metro | Delhi Transport Corp (DTC) & DMRC (Open Transit Data Portal) | 🟢 **Live GTFS-RT & GPS** |
| **Karnataka** | Bengaluru Urban | Bus, Metro | Bengaluru Metropolitan Transport Corp (BMTC) & BMRCL Namma Metro | 🟢 **Live ITS API & GPS** |
| **Maharashtra** | Mumbai Suburban & City | Bus, Metro, Rail | BEST Undertaking, Maha Mumbai Metro (MMMOCL) & Central Railway | 🔵 **Verified Circulars & Bulletins** |
| **Tamil Nadu** | Chennai | Bus, Metro, Rail | Metropolitan Transport Corp (MTC Chennai), CMRL & Southern Railway | 🔵 **Verified Circulars & Bulletins** |
| **Kerala** | Ernakulam (Kochi), Wayanad | Bus, Ferry, Metro | Kerala State RTC (SWIFT), Kochi Water Metro & KMRL | 🔵 **Verified Circulars & Bulletins** |
| **Telangana** | Hyderabad | Bus, Metro | TSRTC & Hyderabad Metro Rail (L&T) | 🔵 **Verified Circulars & Bulletins** |
| **All Other Districts** | Catalogued across India | Bus, Rail | Regional State Transport & Indian Railways | ⚪ **Schedule / Advisory Only** (Transparently labelled) |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Python 3.10+ (Python 3.13 tested)
- Node.js 18+ (Node 26 tested) & npm

### 1. Clone & Set Up Python Virtual Environment
```powershell
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install Python backend dependencies
pip install -r backend/requirements.txt
# (or: pip install fastapi "uvicorn[standard]" sqlalchemy alembic "psycopg[binary]" pydantic python-jose bcrypt passlib httpx python-dotenv pytest email-validator)
```

### 2. Set Up Client Frontend
```powershell
cd client
npm install
npm run build
cd ..
```

### 3. Database Migration (PostgreSQL / Alembic)
```powershell
# Run Alembic migrations
cd backend
..\.venv\Scripts\alembic.exe upgrade head
cd ..
```

### 4. Run the Full Stack Application
```powershell
# Run both FastAPI (port 8000) and Vite React frontend (port 5173) simultaneously:
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **FastAPI Interactive Swagger Docs**: `http://localhost:8000/docs`
- **FastAPI ReDoc**: `http://localhost:8000/redoc`

---

## 🔑 Demo Commuter Account Credentials

For instant login and testing of the Commuter Dashboard & Preferences Manager:

- **Email**: `commuter@transitnotice.gov.in` (or username: `rajesh_transit`)
- **Password**: `TransitPass123!`
- *(A one-click "Quick Demo: Autofill Commuter Credentials" button is also provided on the Sign In page.)*

---

## ⚙️ Environment Variables (`.env`)

See `.env.example` for full options:

```ini
# PostgreSQL Connection (Defaults to local PostgreSQL with automated SQLite fallback if unreachable)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/transitnotice

# JWT Authentication
JWT_SECRET=transitnotice_jwt_super_secret_production_key_2026
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Background Scheduler
REFRESH_INTERVAL_SECONDS=120
FETCH_TIMEOUT_SECONDS=8.0
MAX_RETRIES=3

# Optional API Credentials for Official Government Open Data Portals
DELHI_OTD_API_KEY=
DATA_GOV_IN_API_KEY=
BMTC_ITS_API_KEY=
```

---

## 🧪 Automated Test Suite

TransitNotice includes unit and integration tests covering:
1. Deterministic SHA-256 canonical hashing
2. Missing fields normalization with safe fallbacks
3. Malformed feed and HTML table handling
4. Status lifecycle calculation (`active`, `upcoming`, `expired`, `revised`, `cancelled`)
5. Idempotent database upserts (zero duplicate records on repeated polling)
6. Revision history and date extension detection
7. Automatic expiration transitions (expired notices never appear active)
8. Adapter timeout, network retry, and failure logging

To run the test suite:
```powershell
npm test
# (or directly: .\.venv\Scripts\python.exe -m pytest backend/tests)
```

---

## 📋 REST API Reference

- `POST /api/auth/register`: Register new commuter account
- `POST /api/auth/login`: Authenticate and receive JWT bearer token
- `GET /api/auth/me`: Get current authenticated user profile & preferences
- `PUT /api/auth/preferences`: Update preferred district, route, and alert types
- `GET /api/notices`: Search and filter advisories (state, district, route, transport type, notice type, status, free text)
- `GET /api/notices/{id}`: Detailed advisory with provenance, source URL, and revision history
- `GET /api/routes`: List routes with GeoJSON line geometries and transit modes
- `GET /api/routes/{id}`: Route stops and scheduled geometry
- `GET /api/routes/vehicles/all`: Live vehicle GPS coordinates with speed and delay status
- `GET /api/coverage/states`: Complete national coverage registry by state and district
- `GET /api/coverage/check`: District coverage status verdict and active notice count
- `GET /api/alerts`: Deduplicated notification feed
- `GET /api/system/health`: Live health metrics, connected agency status, and scheduler heartbeat
- `POST /api/system/refresh`: Manually trigger synchronization across all agency adapters
