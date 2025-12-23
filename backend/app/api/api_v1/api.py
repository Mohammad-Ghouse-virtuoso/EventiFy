from fastapi import APIRouter
from app.api.api_v1.endpoints import events, users, auth, comments, bookmarks, stats

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(comments.router, prefix="/events", tags=["comments"])
api_router.include_router(bookmarks.router, tags=["bookmarks"])
api_router.include_router(stats.router, tags=["stats"])