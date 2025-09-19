"""initial schema for user, event, rsvp, comment

Revision ID: 20250913_000001_initial
Revises: 
Create Date: 2025-09-13 00:00:01

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250913_000001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Determine dialect to set proper boolean defaults
    bind = op.get_bind()
    dialect = getattr(bind.dialect, 'name', 'sqlite') if bind else 'sqlite'

    def bdef(val: bool):
        if dialect == 'postgresql':
            return sa.text('TRUE' if val else 'FALSE')
        # default to 1/0 for sqlite or others
        return sa.text('1' if val else '0')

    # user table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='attendee'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=bdef(True)),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint('email', name='uq_user_email')
    )
    op.create_index('ix_user_email', 'user', ['email'])

    # event table
    op.create_table(
        'event',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('time', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('max_attendees', sa.Integer(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False, server_default='0'),
        sa.Column('image', sa.String(), nullable=True),
        sa.Column('requires_approval', sa.Boolean(), nullable=False, server_default=bdef(False)),
        sa.Column('organizer_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=bdef(True)),
        sa.ForeignKeyConstraint(['organizer_id'], ['user.id'])
    )

    # rsvp table
    op.create_table(
        'rsvp',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column('checked_in', sa.Boolean(), nullable=False, server_default=bdef(False)),
        sa.Column('checked_in_at', sa.DateTime(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['event_id'], ['event.id']),
        sa.ForeignKeyConstraint(['approved_by'], ['user.id'])
    )

    # comment table
    op.create_table(
        'comment',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column('is_approved', sa.Boolean(), nullable=False, server_default=bdef(True)),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['event_id'], ['event.id'])
    )


def downgrade():
    op.drop_table('comment')
    op.drop_table('rsvp')
    op.drop_table('event')
    op.drop_index('ix_user_email', table_name='user')
    op.drop_table('user')
