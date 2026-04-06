from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models.group import Group, GroupMember, GroupMessage
from app.models.user import User
from app.core.security import get_current_user
from app.ws.manager import manager

router = APIRouter()

class GroupCreate(BaseModel):
    name: str
    member_ids: List[str]

class GroupMessageSend(BaseModel):
    content: str

@router.post("/")
async def create_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create group
    group = Group(
        name=payload.name,
        created_by=str(current_user.id)
    )
    db.add(group)
    await db.flush()

    # Add creator as member
    all_member_ids = list(set([str(current_user.id)] + payload.member_ids))
    for user_id in all_member_ids:
        member = GroupMember(group_id=group.id, user_id=user_id)
        db.add(member)

    await db.commit()
    await db.refresh(group)
    return {
        "id": group.id,
        "name": group.name,
        "created_by": group.created_by,
        "members": all_member_ids
    }

@router.get("/")
async def get_my_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(GroupMember).where(GroupMember.user_id == str(current_user.id))
    )
    memberships = result.scalars().all()
    groups = []
    for m in memberships:
        group_result = await db.execute(select(Group).where(Group.id == m.group_id))
        group = group_result.scalar_one_or_none()
        if group:
            groups.append({"id": group.id, "name": group.name, "created_by": group.created_by})
    return groups

@router.post("/{group_id}/messages")
async def send_group_message(
    group_id: str,
    payload: GroupMessageSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify user is member
    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == str(current_user.id)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Save message
    message = GroupMessage(
        group_id=group_id,
        sender_id=str(current_user.id),
        content=payload.content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Get all members
    members_result = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group_id)
    )
    members = members_result.scalars().all()

    # Fan-out — send to all online members except sender
    message_data = {
        "type": "group_message",
        "group_id": group_id,
        "messa_id": message.id,
        "sender_id": str(current_user.id),
        "username": current_user.username,
        "content": payload.content,
        "created_at": str(message.created_at)
    }

    delivered_to = []
    for member in members:
        if member.user_id != str(current_user.id):
            delivered = await manager.send_to_user(member.user_id, message_data)
            if delivered:
                delivered_to.append(member.user_id)

    return {
        "message_id": message.id,
        "delivered_to": len(delivered_to),
        "total_members": len(members) - 1
    }

@router.get("/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership
    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == str(current_user.id)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this group")

    result = await db.execute(
        select(GroupMessage).where(
            GroupMessage.group_id == group_id
        ).order_by(GroupMessage.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "content": m.content,
            "created_at": str(m.created_at)
        }
        for m in messages
    ]

@router.post("/{group_id}/members")
async def add_member(
    group_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only group creator can add members
    group_result = await db.execute(select(Group).where(Group.id == group_id))
    group = group_result.scalar_one_or_none()
    if not group or group.created_by != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only group creator can add members")

    member = GroupMember(group_id=group_id, user_id=user_id)
    db.add(member)
    await db.commit()
    return {"message": "Member added successfully"}
