"""rename rsvp.status interested -> maybe

Revision ID: 20250913_000002
Revises: 20250913_000001_initial
Create Date: 2025-09-13 00:30:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250913_000002'
down_revision = '20250913_000001_initial'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Update existing rows where status is 'interested' to 'maybe'
    conn.execute(sa.text("UPDATE rsvp SET status = 'maybe' WHERE status = 'interested'"))


def downgrade():
    conn = op.get_bind()
    # Revert 'maybe' back to 'interested' (best-effort)
    conn.execute(sa.text("UPDATE rsvp SET status = 'interested' WHERE status = 'maybe'"))
