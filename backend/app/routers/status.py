from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.status import UserStatus

router = APIRouter(prefix="/status", tags=["status"])


@router.get("/{user_id}")
async def get_status(user_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(UserStatus).where(UserStatus.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        return {"user_id": user_id, "state": "unknown"}
    return {"user_id": row.user_id, "state": row.state, "last_seen_at": row.last_seen_at}
