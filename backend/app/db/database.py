from sqlmodel import create_engine as sqlmodel_create_engine, Session
from app.core.config import settings
from sqlalchemy import event
from sqlalchemy.pool import QueuePool
from sqlalchemy.engine import Engine
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
import os

def make_db_engine(db_url: str, env: str):
    """Create a SQLAlchemy engine with sensible defaults per backend/env.
    - SQLite: WAL, NORMAL sync, foreign_keys=ON, QueuePool with cross-thread access.
    - Postgres (and other non-SQLite): pre_ping and larger pools in prod.
    """
    url = make_url(db_url)
    driver = url.drivername  # e.g., 'sqlite', 'mysql+pymysql', 'postgresql+psycopg2'

    # Base pool options
    pool_opts = {
        "pool_pre_ping": True,
    }

    if driver.startswith("sqlite"):
        # SQLite tuning for dev
        engine_local = create_engine(
            db_url,
            connect_args={"check_same_thread": False, "timeout": 30.0},
            poolclass=QueuePool,
            pool_size=20,
            max_overflow=20,
            pool_timeout=30,
            echo=getattr(settings, "ECHO_SQL", False),
            **pool_opts,
        )

        @event.listens_for(Engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            try:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
            except Exception:
                pass

        return engine_local

    # Non-SQLite backends
    connect_args = {}

    if env == "prod":
        pool_opts.update({
            "pool_size": 40,
            "max_overflow": 100,
            "pool_recycle": 1800,
        })

    return create_engine(
        db_url,
        connect_args=connect_args,
        echo=getattr(settings, "ECHO_SQL", False),
        **pool_opts,
    )


# Instantiate the global engine using the selected environment and URL
engine = make_db_engine(settings.DATABASE_URL, getattr(settings, "ENVIRONMENT", "dev"))

def get_session():
    with Session(engine) as session:
        try:
            yield session
        finally:
            session.close()