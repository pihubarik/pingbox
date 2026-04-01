from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        # Update Redis presence
        from app.services.redis_service import set_user_online, update_last_seen
        await set_user_online(user_id)
        await update_last_seen(user_id)
        print(f"✅ User {user_id} connected. Online: {list(self.active_connections.keys())}")

    async def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        # Update Redis presence
        from app.services.redis_service import set_user_offline, update_last_seen
        await set_user_offline(user_id)
        await update_last_seen(user_id)
        print(f"❌ User {user_id} disconnected")

    def is_online(self, user_itr) -> bool:
        return user_id in self.active_connections

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)
            return True
        return False

manager = ConnectionManager()
