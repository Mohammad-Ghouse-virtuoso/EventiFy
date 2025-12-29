"""add is_evergreen, organizer_email, tags to events (simple)

Revision ID: add_evergreen_20251229
Revises: add_event_meta_20251219
Create Date: 2025-12-29 09:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_evergreen_20251229'
down_revision = 'add_event_meta_20251219'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to event table
    op.add_column('event', sa.Column('organizer_email', sa.String(), nullable=True))
    op.add_column('event', sa.Column('is_evergreen', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('event', sa.Column('tags', sa.String(), nullable=True))


def downgrade():
    # Remove columns if needed
    op.drop_column('event', 'tags')
    op.drop_column('event', 'is_evergreen')
    op.drop_column('event', 'organizer_email')
