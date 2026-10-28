import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root directory if present
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "TransitNotice"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Database Configuration (PostgreSQL default with resilient fallback)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "transitnotice")
    
    # Priority: Explicit DATABASE_URL -> constructed PostgreSQL URL -> SQLite fallback
    DEFAULT_PG_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    DATABASE_URL: str = os.getenv("DATABASE_URL", DEFAULT_PG_URL)

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "transitnotice_jwt_super_secret_production_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # Scheduler & External Feeds
    REFRESH_INTERVAL_SECONDS: int = int(os.getenv("REFRESH_INTERVAL_SECONDS", "120"))
    FETCH_TIMEOUT_SECONDS: float = float(os.getenv("FETCH_TIMEOUT_SECONDS", "8.0"))
    MAX_RETRIES: int = 3
    DEMO_ALERTS_ENABLED: bool = os.getenv("DEMO_ALERTS_ENABLED", "true").lower() == "true"

    # API Keys for Official Data Portals
    DELHI_OTD_API_KEY: str | None = os.getenv("DELHI_OTD_API_KEY", None)
    DATA_GOV_IN_API_KEY: str | None = os.getenv("DATA_GOV_IN_API_KEY", None)
    BMTC_ITS_API_KEY: str | None = os.getenv("BMTC_ITS_API_KEY", None)

settings = Settings()
