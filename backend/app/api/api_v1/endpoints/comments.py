from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List
from app.db.database import get_session
from app.models.comment import Comment, CommentCreate, CommentUpdate, CommentResponse
from app.models.user import User
from app.models.event import Event
from app.core.auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/{event_id}/comments", response_model=List[CommentResponse])
async def get_event_comments(
    event_id: int,
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    # Check if event exists
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get comments with user information
    statement = (
        select(Comment, User.full_name)
        .join(User, Comment.user_id == User.id)
        .where(Comment.event_id == event_id, Comment.is_approved == True)
        .offset(skip)
        .limit(limit)
    )
    
    results = session.exec(statement).all()
    
    comments = []
    for comment, user_name in results:
        comment_response = CommentResponse(
            **comment.dict(),
            user_name=user_name
        )
        comments.append(comment_response)
    
    return comments

@router.post("/{event_id}/comments", response_model=CommentResponse)
async def create_comment(
    event_id: int,
    comment_data: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    # Check if event exists
    event = session.get(Event, event_id)
    if not event or not event.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Create comment
    db_comment = Comment(
        **comment_data.dict(),
        user_id=current_user.id,
        event_id=event_id
    )
    
    session.add(db_comment)
    session.commit()
    session.refresh(db_comment)
    
    return CommentResponse(
        **db_comment.dict(),
        user_name=current_user.full_name
    )

@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user owns the comment or is admin
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    update_data = comment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)
    
    session.add(comment)
    session.commit()
    session.refresh(comment)
    
    return CommentResponse(
        **comment.dict(),
        user_name=current_user.full_name
    )

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user owns the comment or is admin
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    session.delete(comment)
    session.commit()
    return {"message": "Comment deleted successfully"}

@router.get("/comments/pending", response_model=List[CommentResponse])
async def get_pending_comments(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Admin endpoint to view pending comments for moderation."""
    statement = (
        select(Comment, User.full_name)
        .join(User, Comment.user_id == User.id)
        .where(Comment.is_approved == False)
        .offset(skip)
        .limit(limit)
    )
    
    results = session.exec(statement).all()
    
    comments = []
    for comment, user_name in results:
        comment_response = CommentResponse(
            **comment.dict(),
            user_name=user_name
        )
        comments.append(comment_response)
    
    return comments

@router.put("/comments/{comment_id}/approve")
async def approve_comment(
    comment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Admin endpoint to approve a comment."""
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    comment.is_approved = True
    session.add(comment)
    session.commit()
    
    return {"message": "Comment approved successfully"}
