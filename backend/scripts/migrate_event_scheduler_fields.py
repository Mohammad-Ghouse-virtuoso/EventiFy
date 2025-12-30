"""
Database migration script: Add timezone and last_refreshed_at to Event model
For SQLite: uses ALTER TABLE (limited support, but works for adding columns)
For PostgreSQL: full ALTER TABLE support

Run: python backend/scripts/migrate_event_scheduler_fields.py
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine

def migrate():
    """Add timezone and last_refreshed_at columns to event table."""
    with Session(engine) as session:
        try:
            # Check if columns already exist
            result = session.exec(text("PRAGMA table_info(event)")).all()
            columns = [row[1] for row in result]
            
            if "timezone" not in columns:
                print("Adding timezone column...")
                session.exec(text(
                    "ALTER TABLE event ADD COLUMN timezone VARCHAR DEFAULT 'UTC'"
                ))
                session.commit()
                print("✅ Added timezone column")
            else:
                print("⏭️  timezone column already exists")
            
            if "last_refreshed_at" not in columns:
                print("Adding last_refreshed_at column...")
                session.exec(text(
                    "ALTER TABLE event ADD COLUMN last_refreshed_at DATETIME"
                ))
                session.commit()
                print("✅ Added last_refreshed_at column")
            else:
                print("⏭️  last_refreshed_at column already exists")
            
            print("\n✅ Migration complete!")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            session.rollback()
            raise

if __name__ == "__main__":
    migrate()
