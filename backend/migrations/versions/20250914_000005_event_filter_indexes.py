"""
Add indexes to support GET /events filters

Revision ID: 20250914_000005
Revises: 20250914_000004
Create Date: 2025-09-14 12:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250914_000005'
down_revision = '20250914_000004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {ix['name'] for ix in inspector.get_indexes('event')}

    if 'ix_event_organizer_id' not in existing:
        op.create_index('ix_event_organizer_id', 'event', ['organizer_id'], unique=False)
    if 'ix_event_event_start' not in existing:
        op.create_index('ix_event_event_start', 'event', ['event_start'], unique=False)
    if 'ix_event_is_active' not in existing:
        op.create_index('ix_event_is_active', 'event', ['is_active'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {ix['name'] for ix in inspector.get_indexes('event')}

    if 'ix_event_is_active' in existing:
        op.drop_index('ix_event_is_active', table_name='event')
    if 'ix_event_event_start' in existing:
        op.drop_index('ix_event_event_start', table_name='event')
    if 'ix_event_organizer_id' in existing:
        op.drop_index('ix_event_organizer_id', table_name='event')
