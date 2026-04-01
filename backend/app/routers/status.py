from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user
from app.models.user import User
from app.services.redis_service import (
    post_status, get_status, delete_status,
    is_user_online, get_last_seen, time_ago
)

router = APIRouter()

class StatusCreate(BaseModel):
    content: str
    media_url: Optional[str] = None

@router.post("/")
async def create_status(
    payload: StatusCreate,
    current_user: User = Depends(get_current_user)
):
    status = await post_status(
        user_id=str(current_user.id),
        username=current_user.username,
        content=payload.content,
        media_url=payload.media_url
    )
    return {
        "message": "Status posted successfully",
        "status": status,
        "expires_in": "24 hours"
    }

@router.get("/presence/{user_id}")
async def get_presence(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    online = await is_user_online(user_id)
    last_seen_raw = await get_last_seen(user_id)
    return {
        "user_id": user_id,
        "online": online,
        "last_seen": "online" if online else time_ago(last_seen_raw)
    }

@router.get("/{user_id}")
async def get_user_status(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    status = await get_status(user_id)
    if not status:
        raise HTTPException(
            status_code=404,
            detail="No active status found for this user"
        )
    return status

@router.delete("/")
async def remove_status(
    current_user: User = Depends(get_current_user)
):
    await delete_status(str(current_user.id))
    return {"message": "Status deleted"}
