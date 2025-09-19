"""Add thumbnail column to event table

Revision ID: add_event_thumbnail_20250918
Revises: 
Create Date: 2025-09-18
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_event_thumbnail_20250918'
down_revision = '20250914_000007'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('event') as batch_op:
        batch_op.add_column(sa.Column('thumbnail', sa.String(), nullable=True))


def downgrade():
    with op.batch_alter_table('event') as batch_op:
        batch_op.drop_column('thumbnail')
