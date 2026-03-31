from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # user_id → active WebSocket connection
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {user_id} connected. Online: {list(self.active_connections.keys())}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        print(f"❌ User {user_id} disconnected")

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections

    async def send_to_user(self, user_id: str, message: dict) -> bool:
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)
            return True
        return False

# Single global instance shareds entire app
manager = ConnectionManager()
