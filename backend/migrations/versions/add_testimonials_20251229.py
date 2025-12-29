"""Create testimonials table

Revision ID: add_testimonials_20251229
Revises: add_evergreen_20251229
Create Date: 2025-12-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_testimonials_20251229'
down_revision = 'add_evergreen_20251229'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'testimonials',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('quote', sa.Text(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('event.id'), nullable=True),
        sa.Column('avatar_url', sa.String(length=512), nullable=True),
        sa.Column('is_approved', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_testimonials_approved_featured', 'testimonials', ['is_approved', 'is_featured'])
    op.create_index('ix_testimonials_created_at', 'testimonials', ['created_at'])
    op.create_index('ix_testimonials_rating', 'testimonials', ['rating'])


def downgrade():
    op.drop_index('ix_testimonials_rating', table_name='testimonials')
    op.drop_index('ix_testimonials_created_at', table_name='testimonials')
    op.drop_index('ix_testimonials_approved_featured', table_name='testimonials')
    op.drop_table('testimonials')
