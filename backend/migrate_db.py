#!/usr/bin/env python3
"""
Database migration script to add new columns for RSVP approval workflow
"""

import sqlite3
import os

def migrate_database():
    db_path = os.path.join(os.path.dirname(__file__), 'eventify.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if requires_approval column exists in event table
        cursor.execute("PRAGMA table_info(event)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'requires_approval' not in columns:
            print("Adding requires_approval column to event table...")
            cursor.execute("ALTER TABLE event ADD COLUMN requires_approval BOOLEAN DEFAULT 0")
            print("✓ Added requires_approval column")
        else:
            print("requires_approval column already exists in event table")
        
        # Check if approved_by and approved_at columns exist in rsvp table
        cursor.execute("PRAGMA table_info(rsvp)")
        rsvp_columns = [column[1] for column in cursor.fetchall()]
        
        if 'approved_by' not in rsvp_columns:
            print("Adding approved_by column to rsvp table...")
            cursor.execute("ALTER TABLE rsvp ADD COLUMN approved_by INTEGER")
            print("✓ Added approved_by column")
        else:
            print("approved_by column already exists in rsvp table")
            
        if 'approved_at' not in rsvp_columns:
            print("Adding approved_at column to rsvp table...")
            cursor.execute("ALTER TABLE rsvp ADD COLUMN approved_at DATETIME")
            print("✓ Added approved_at column")
        else:
            print("approved_at column already exists in rsvp table")
        
        # Commit the changes
        conn.commit()
        print("✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
