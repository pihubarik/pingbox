from pydantic import BaseModel
from datetime import datetime

class MessageSend(BaseModel):
    receiver_id: str
    content: str

class MessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    delivered: bool
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
