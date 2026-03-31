from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageOut
from app.core.security import get_current_user, decode_token
from app.ws.manager import manager
from jose import JWTError
import json

router = APIRouter()

@router.websocket("/ws/{token}")
async def websocket_endpoint(token: str, websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)

    result = await db.execute(
        select(Message).where(
            Message.receiver_id == user_id,
            Message.delivered == False
        )
    )
    offline_messages = result.scalars().all()
    for msg in offline_messages:
        await manager.send_to_user(user_id, {
            "type": "message",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": str(msg.created_at)
        })
        msg.delivered = True
        await manager.send_to_user(msg.sender_id, {
            "type": "ack",
            "message_id": msg.id,
            "status": "delivered"
        })
    await db.commit()

    try:
        while True:
            data = await websocket.receive_text()
            payload_data = json.loads(data)
            receiver_id = payload_data.get("receiver_id")
            content = payload_data.get("content")
            if not receiver_id or not content:
                continue
            message = Message(
                sender_id=user_id,
                receiver_id=receiver_id,
                content=content,
                delivered=False,
                read=False
            )
            db.add(message)
            await db.commit()
            await db.refresh(message)
            delivered = await manager.send_to_user(receiver_id, {
                "type": "message",
                "id": message.id,
                "sender_id": user_id,
                "content": content,
                "created_at": str(message.created_at)
            })
            if delivered:
                message.delivered = True
                await db.commit()
                await manager.send_to_user(user_id, {
                    "type": "ack",
                    "message_id": message.id,
                    "status": "delivered"
                })
            else:
                await manager.send_to_user(user_id, {
                    "type": "ack",
                    "message_id": message.id,
                    "status": "sent"
                })
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@router.get("/history/{other_user_id}", response_model=list[MessageOut])
async def get_chat_history(
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message).where(
            or_(
                (Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id),
                (Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at)
    )
    return result.scalars().all()
