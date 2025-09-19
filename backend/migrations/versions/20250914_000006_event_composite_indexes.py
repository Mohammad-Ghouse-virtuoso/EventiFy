"""
Add composite indexes for common queries

Revision ID: 20250914_000006
Revises: 20250914_000005
Create Date: 2025-09-14 12:30:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250914_000006'
down_revision = '20250914_000005'
branch_labels = None
depends_on = None


def upgrade() -> None:
	bind = op.get_bind()
	inspector = sa.inspect(bind)

	# Event composite index: speeds up WHERE is_active = 1 AND event_start >= ? ORDER BY event_start
	event_indexes = {ix['name'] for ix in inspector.get_indexes('event')}
	if 'ix_event_is_active_event_start' not in event_indexes:
		op.create_index('ix_event_is_active_event_start', 'event', ['is_active', 'event_start'], unique=False)

	# RSVP composite index: speeds up EXISTS with filters by (event_id, status)
	rsvp_indexes = {ix['name'] for ix in inspector.get_indexes('rsvp')}
	if 'ix_rsvp_event_id_status' not in rsvp_indexes:
		op.create_index('ix_rsvp_event_id_status', 'rsvp', ['event_id', 'status'], unique=False)


def downgrade() -> None:
	bind = op.get_bind()
	inspector = sa.inspect(bind)

	event_indexes = {ix['name'] for ix in inspector.get_indexes('event')}
	if 'ix_event_is_active_event_start' in event_indexes:
		op.drop_index('ix_event_is_active_event_start', table_name='event')

	rsvp_indexes = {ix['name'] for ix in inspector.get_indexes('rsvp')}
	if 'ix_rsvp_event_id_status' in rsvp_indexes:
		op.drop_index('ix_rsvp_event_id_status', table_name='rsvp')

