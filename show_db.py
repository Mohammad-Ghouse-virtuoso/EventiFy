#!/usr/bin/env python3
import sqlite3
import os

# Connect to the database
db_path = os.path.join(os.path.dirname(__file__), 'backend', 'eventify.db')
if not os.path.exists(db_path):
    db_path = 'eventify.db'  # If running from backend directory

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🗄️  DATABASE LOCATION:", os.path.abspath(db_path))
    print("📊 DATABASE SIZE:", f"{os.path.getsize(db_path)} bytes")
    print("\n" + "="*60)
    
    # Show users
    print("👥 USERS TABLE:")
    print("-" * 60)
    cursor.execute("SELECT id, email, full_name, role, is_active FROM user")
    users = cursor.fetchall()
    
    print(f"{'ID':<3} {'Email':<25} {'Name':<20} {'Role':<10} {'Active'}")
    print("-" * 60)
    for user in users:
        print(f"{user[0]:<3} {user[1]:<25} {user[2]:<20} {user[3]:<10} {user[4]}")
    
    print(f"\nTotal Users: {len(users)}")
    
    # Show events
    print("\n" + "="*60)
    print("🎉 EVENTS TABLE:")
    print("-" * 60)
    # Use current schema fields (event_start instead of legacy 'date')
    cursor.execute("SELECT id, title, event_start, organizer_id, price FROM event")
    events = cursor.fetchall()
    
    print(f"{'ID':<3} {'Title':<30} {'Start':<19} {'Organizer':<10} {'Price'}")
    print("-" * 60)
    for event in events:
        start_str = (event[2] or 'N/A')
        # Ensure string and trim for display
        if isinstance(start_str, bytes):
            start_str = start_str.decode('utf-8', errors='ignore')
        start_str = str(start_str)[:19]
        print(f"{event[0]:<3} {event[1][:29]:<30} {start_str:<19} {event[3]:<10} ${event[4]}")
    
    print(f"\nTotal Events: {len(events)}")
    
    # Show RSVPs
    print("\n" + "="*60)
    print("📝 RSVPS TABLE:")
    print("-" * 60)
    cursor.execute("SELECT id, user_id, event_id, status FROM rsvp")
    rsvps = cursor.fetchall()
    
    if rsvps:
        print(f"{'ID':<3} {'User ID':<8} {'Event ID':<9} {'Status'}")
        print("-" * 30)
        for rsvp in rsvps:
            print(f"{rsvp[0]:<3} {rsvp[1]:<8} {rsvp[2]:<9} {rsvp[3]}")
        print(f"\nTotal RSVPs: {len(rsvps)}")
    else:
        print("No RSVPs found")
    
    # Show table info
    print("\n" + "="*60)
    print("📋 DATABASE TABLES:")
    print("-" * 60)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"• {table[0]}: {count} records")
    
    conn.close()
    print("\n✅ Database connection successful!")
    
except Exception as e:
    print(f"❌ Error accessing database: {e}")
    print(f"Looking for database at: {db_path}")
