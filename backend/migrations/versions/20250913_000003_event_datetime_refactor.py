"""event datetime refactor: add event_start/event_end, backfill, drop date/time

Revision ID: 20250913_000003
Revises: 20250913_000002
Create Date: 2025-09-13 01:00:00

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '20250913_000003'
down_revision = '20250913_000002'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name
    inspector = sa.inspect(conn)
    cols = {c['name'] for c in inspector.get_columns('event')}

    # Add new columns (nullable for backfill) if not already present
    if 'event_start' not in cols:
        op.add_column('event', sa.Column('event_start', sa.DateTime(), nullable=True))
    if 'event_end' not in cols:
        op.add_column('event', sa.Column('event_end', sa.DateTime(), nullable=True))

    # Backfill event_start from date + time only if legacy columns still exist
    if 'date' in cols:
        if dialect == 'sqlite':
            conn.execute(sa.text(
                """
                UPDATE event
                SET event_start = 
                    CASE 
                        WHEN time IS NOT NULL AND time != '' THEN datetime(date || ' ' || substr(time, 1, 2) || char(58) || substr(time, 4, 2) || char(58) || '00')
                        ELSE date
                    END
                WHERE event_start IS NULL
                """
            ))
        elif dialect == 'mysql':
            # MySQL/PlanetScale: use STR_TO_DATE and DATE_FORMAT
            conn.execute(sa.text(
                """
                UPDATE event
                SET event_start =
                    CASE
                        WHEN time IS NOT NULL AND time != '' THEN STR_TO_DATE(CONCAT(DATE_FORMAT(date, '%Y-%m-%d'), ' ', time, ':00'), '%Y-%m-%d %H:%i:%s')
                        ELSE date
                    END
                WHERE event_start IS NULL
                """
            ))
        else:
            # Generic fallback: just copy date into event_start
            conn.execute(sa.text(
                """
                UPDATE event
                SET event_start = date
                WHERE event_start IS NULL
                """
            ))

    # Make event_start non-null after backfill if there are no NULLs remaining
    null_count = conn.execute(sa.text("SELECT COUNT(1) FROM event WHERE event_start IS NULL")).scalar()
    # SQLite doesn't support ALTER COLUMN to add NOT NULL; skip strictness on SQLite in dev.
    if null_count == 0 and dialect != 'sqlite':
        op.alter_column('event', 'event_start', nullable=False)

    # Drop old columns if still present
    with op.batch_alter_table('event') as batch_op:
        if 'date' in cols:
            batch_op.drop_column('date')
        if 'time' in cols:
            batch_op.drop_column('time')


def downgrade():
    # Recreate old columns as nullable for best-effort downgrade
    with op.batch_alter_table('event') as batch_op:
        batch_op.add_column(sa.Column('date', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('time', sa.String(), nullable=True))

    conn = op.get_bind()
    dialect = conn.dialect.name
    # Backfill date/time from event_start
    # date gets the full datetime; time gets HH:MM
    if dialect == 'sqlite':
        conn.execute(sa.text(
            """
            UPDATE event
            SET date = event_start,
                time = strftime('%H:%M', event_start)
            """
        ))
    elif dialect == 'mysql':
        conn.execute(sa.text(
            """
            UPDATE event
            SET date = event_start,
                time = DATE_FORMAT(event_start, '%H:%i')
            """
        ))
    else:
        # Fallback: keep date as event_start and leave time NULL
        conn.execute(sa.text(
            """
            UPDATE event
            SET date = event_start
            """
        ))

    # Drop new columns
    with op.batch_alter_table('event') as batch_op:
        batch_op.drop_column('event_end')
        batch_op.drop_column('event_start')
