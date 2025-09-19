"""
Add RSVP indexes and unique constraint

Revision ID: 20250914_000004
Revises: 20250913_000003
Create Date: 2025-09-14 00:00:04
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250914_000004'
down_revision = '20250913_000003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite has limited ALTER TABLE; create indexes separately
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_indexes = {ix['name'] for ix in inspector.get_indexes('rsvp')}

    # Create indexes if they do not already exist
    if 'ix_rsvp_event_id' not in existing_indexes:
        op.create_index('ix_rsvp_event_id', 'rsvp', ['event_id'], unique=False)
    if 'ix_rsvp_user_id' not in existing_indexes:
        op.create_index('ix_rsvp_user_id', 'rsvp', ['user_id'], unique=False)

    # Add a unique index to prevent duplicate RSVPs per (user, event)
    # Using a unique INDEX for SQLite compatibility (ALTER TABLE ADD CONSTRAINT isn't supported)
    if 'uq_rsvp_user_event' not in existing_indexes:
        op.create_index('uq_rsvp_user_event', 'rsvp', ['user_id', 'event_id'], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_indexes = {ix['name'] for ix in inspector.get_indexes('rsvp')}

    if 'uq_rsvp_user_event' in existing_indexes:
        op.drop_index('uq_rsvp_user_event', table_name='rsvp')
    if 'ix_rsvp_user_id' in existing_indexes:
        op.drop_index('ix_rsvp_user_id', table_name='rsvp')
    if 'ix_rsvp_event_id' in existing_indexes:
        op.drop_index('ix_rsvp_event_id', table_name='rsvp')
