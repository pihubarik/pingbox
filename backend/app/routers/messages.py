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
        username = payload.get("username")
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
            msg_type = payload_data.get("type", "message")

            if msg_type == "typing_start":
                receiver_id = payload_data.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, {
                        "type": "typing_start",
                        "sender_id": user_id,
                        "username": username
                    })
                continue

            if msg_type == "typing_stop":
                receiver_id = payload_data.get("receiver_id")
                if receiver_id:
                    await manager.send_to_user(receiver_id, {
                        "type": "typing_stop",
                        "sender_id": user_id,
                        "username": username
                    })
                continue

            if msg_type == "read_receipt":
                sender_id = payload_data.get("sender_id")
                if sender_id:
                    from sqlalchemy import and_
                    result = await db.execute(
                        select(Message).where(
                            and_(
                                Message.sender_id == sender_id,
                                Message.receiver_id == user_id,
                                Message.read == False
                            )
                        )
                    )
                    unread_messages = result.scalars().all()
                    for msg in unread_messages:
                        msg.read = True
                        await manager.send_to_user(sender_id, {
                            "type": "ack",
                            "message_id": msg.id,
                            "status": "read"
                        })
                    await db.commit()
                continue

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
                "created_at": str(message.created_at),
                "username": username
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
