"""Add event metadata columns: terms_and_conditions, organizer_bio, organizer_contact

Revision ID: add_event_meta_20251219
Revises: add_event_qna_20250921
Create Date: 2025-12-19
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_event_meta_20251219'
down_revision = 'add_event_qna_20250921'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite supports ADD COLUMN for simple nullable columns
    with op.batch_alter_table('event') as batch_op:
        batch_op.add_column(sa.Column('terms_and_conditions', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('organizer_bio', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('organizer_contact', sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table('event') as batch_op:
        batch_op.drop_column('organizer_contact')
        batch_op.drop_column('organizer_bio')
        batch_op.drop_column('terms_and_conditions')
