import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("transitnotice.db")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("postgresql"):
            # Test PostgreSQL connection with a short timeout
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 3},
                pool_pre_ping=True
            )
            with test_engine.connect() as conn:
                logger.info(f"Connected to PostgreSQL database: {settings.POSTGRES_DB}")
            return test_engine
        else:
            return create_engine(
                db_url,
                connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
                pool_pre_ping=True
            )
    except Exception as e:
        logger.warning(
            f"Unable to connect to PostgreSQL at {db_url} ({e}). "
            "Falling back to local persistent SQLite database ('sqlite:///./transitnotice.db') for zero-friction local execution."
        )
        return create_engine(
            "sqlite:///./transitnotice.db",
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    from backend.app import models  # load all models
    Base.metadata.create_all(bind=engine)

init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
