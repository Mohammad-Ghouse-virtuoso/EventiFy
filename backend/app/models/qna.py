from datetime import datetime
from typing import List, Optional

import sqlalchemy as sa
from sqlmodel import Field, SQLModel


class EventQuestionBase(SQLModel):
    text: str = Field(max_length=500)
    asker_email: str = Field(max_length=255)
    asker_name: Optional[str] = Field(default=None, max_length=100)


class EventQuestion(EventQuestionBase, table=True):
    __tablename__ = "event_question"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class EventQuestionCreate(EventQuestionBase):
    pass


class EventAnswerBase(SQLModel):
    text: str = Field(max_length=1000)


class EventAnswer(EventAnswerBase, table=True):
    __tablename__ = "event_answer"

    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="event_question.id")
    user_id: int = Field(foreign_key="user.id")
    helpful_count: int = Field(default=0, sa_column=sa.Column(sa.Integer(), nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class EventAnswerCreate(EventAnswerBase):
    pass


class EventAnswerResponse(EventAnswerBase):
    id: int
    question_id: int
    user_id: int
    helpful_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    answerer_name: Optional[str] = None
    has_voted: bool = False


class EventQuestionResponse(EventQuestionBase):
    id: int
    event_id: int
    user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime] = None
    answers: List[EventAnswerResponse] = Field(default_factory=list)


class AnswerHelpfulVote(SQLModel, table=True):
    __tablename__ = "answer_helpful_vote"
    __table_args__ = (sa.UniqueConstraint("user_id", "answer_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    answer_id: int = Field(foreign_key="event_answer.id")
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
