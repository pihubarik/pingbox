import json
from datetime import datetime

import redis.asyncio as aioredis

from app.core.config import settings

# Global Redis connection
redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)

# ─── Presence ───────────────────────────────────────────


async def set_user_online(user_id: str):
    """Mark user as online with 60 second TTL"""
    await redis_client.setex(f"presence:{user_id}", 60, "online")


async def set_user_offline(user_id: str):
    """Mark user as offline"""
    await redis_client.delete(f"presence:{user_id}")


async def is_user_online(user_id: str) -> bool:
    """Check if user is online"""
    return await redis_client.exists(f"presence:{user_id}") > 0


async def get_last_seen(user_id: str) -> str:
    """Get last seen timestamp"""
    val = await redis_client.get(f"lastseen:{user_id}")
    return val or "a while ago"


async def update_last_seen(user_id: str) -> None:
    """Persist last-seen timestamp for a user"""
    await redis_client.set(
        f"lastseen:{user_id}",
        datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )


# ─── Status/Stories ─────────────────────────────────────

STATUS_TTL = 86400  # 24 hours in seconds


async def post_status(
    user_id: str, username: str, content: str, media_url: str | None = None
):
    """Store a status with 24hr TTL"""
    status_data = {
        "user_id": user_id,
        "username": username,
        "content": content,
        "media_url": media_url,
        "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    }
    await redis_client.setex(
        f"status:{user_id}",
        STATUS_TTL,
        json.dumps(status_data),
    )
    return status_data


async def get_status(user_id: str) -> dict | None:
    """Get a user's current status"""
    data = await redis_client.get(f"status:{user_id}")
    if data:
        status = json.loads(data)
        ttl = await redis_client.ttl(f"status:{user_id}")
        status["expires_in_seconds"] = ttl
        return status
    return None


async def delete_status(user_id: str):
    """Manually delete a status"""
    await redis_client.delete(f"status:{user_id}")

def time_ago(timestamp_str: str) -> str:
    """Convert timestamp to human readable last seen"""
    if not timestamp_str or timestamp_str == "a while ago":
        return "a while ago"
    try:
        from datetime import datetime
        last_seen = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
        now = datetime.utcnow()
        seconds = (now - last_seen).total_seconds()

        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            return f"last seen {minutes} minute{'s' if minutes > 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds // 3600)
            return f"last seen {hours} hour{'s' if hours > 1 else ''} ago"
        else:
            days = int(seconds // 86400)
            return f"last seen {days} day{'s' if days > 1 else ''} ago"
    except:
        return "a while ago"
