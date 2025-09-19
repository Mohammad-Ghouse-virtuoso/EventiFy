"""
Add indexes for comments and sanity-check user unique email

Revision ID: 20250914_000007
Revises: 20250914_000006
Create Date: 2025-09-14 13:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250914_000007'
down_revision = '20250914_000006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # Comment indexes to support common queries
    try:
        comment_indexes = {ix['name'] for ix in inspector.get_indexes('comment')}
    except Exception:
        comment_indexes = set()

    if 'ix_comment_event_id_is_approved' not in comment_indexes:
        op.create_index('ix_comment_event_id_is_approved', 'comment', ['event_id', 'is_approved'], unique=False)
    if 'ix_comment_user_id' not in comment_indexes:
        op.create_index('ix_comment_user_id', 'comment', ['user_id'], unique=False)
    if 'ix_comment_is_approved' not in comment_indexes:
        op.create_index('ix_comment_is_approved', 'comment', ['is_approved'], unique=False)

    # User email uniqueness already enforced in initial migration via uq_user_email
    # Create explicit index only if missing (for completeness/SQLite pragmatism)
    try:
        user_indexes = {ix['name'] for ix in inspector.get_indexes('user')}
    except Exception:
        user_indexes = set()

    if 'ix_user_email' not in user_indexes:
        op.create_index('ix_user_email', 'user', ['email'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    try:
        comment_indexes = {ix['name'] for ix in inspector.get_indexes('comment')}
    except Exception:
        comment_indexes = set()

    if 'ix_comment_is_approved' in comment_indexes:
        op.drop_index('ix_comment_is_approved', table_name='comment')
    if 'ix_comment_user_id' in comment_indexes:
        op.drop_index('ix_comment_user_id', table_name='comment')
    if 'ix_comment_event_id_is_approved' in comment_indexes:
        op.drop_index('ix_comment_event_id_is_approved', table_name='comment')

    try:
        user_indexes = {ix['name'] for ix in inspector.get_indexes('user')}
    except Exception:
        user_indexes = set()

    # Don't drop uq_user_email (unique constraint) created in the initial migration; only drop the non-unique index we created if present
    if 'ix_user_email' in user_indexes:
        op.drop_index('ix_user_email', table_name='user')
