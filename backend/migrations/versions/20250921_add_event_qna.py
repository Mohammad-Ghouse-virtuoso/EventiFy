"""Add Q&A tables for event questions and answers

Revision ID: add_event_qna_20250921
Revises: add_event_thumbnail_20250918
Create Date: 2025-09-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_event_qna_20250921'
down_revision = 'add_event_thumbnail_20250918'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'event_question',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(length=500), nullable=False),
        sa.Column('asker_email', sa.String(length=255), nullable=False),
        sa.Column('asker_name', sa.String(length=100), nullable=True),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['event.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_event_question_event_id', 'event_question', ['event_id'], unique=False)

    op.create_table(
        'event_answer',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(length=1000), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('helpful_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['event_question.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_event_answer_question_id', 'event_answer', ['question_id'], unique=False)

    op.create_table(
        'answer_helpful_vote',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('answer_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['answer_id'], ['event_answer.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'answer_id')
    )
    op.create_index('ix_answer_helpful_vote_answer_id', 'answer_helpful_vote', ['answer_id'], unique=False)


def downgrade():
    op.drop_index('ix_answer_helpful_vote_answer_id', table_name='answer_helpful_vote')
    op.drop_table('answer_helpful_vote')
    op.drop_index('ix_event_answer_question_id', table_name='event_answer')
    op.drop_table('event_answer')
    op.drop_index('ix_event_question_event_id', table_name='event_question')
    op.drop_table('event_question')
