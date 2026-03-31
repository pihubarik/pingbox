from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageRead

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("", response_model=list[MessageRead])
async def list_messages(db: AsyncSession = Depends(get_db)) -> list[Message]:
    result = await db.execute(select(Message).order_by(Message.created_at.desc()).limit(100))
    return list(result.scalars().all())


@router.post("", response_model=MessageRead, status_code=201)
async def create_message(
    payload: MessageCreate, db: AsyncSession = Depends(get_db)
) -> Message:
    # TODO: replace with current user from JWT
    first = await db.execute(select(User).limit(1))
    author = first.scalar_one_or_none()
    if not author:
        raise HTTPException(status_code=400, detail="No users yet; register first")
    msg = Message(body=payload.body, author_id=author.id)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
