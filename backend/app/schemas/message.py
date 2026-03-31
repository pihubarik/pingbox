from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    body: str


class MessageRead(BaseModel):
    id: int
    body: str
    created_at: datetime
    author_id: int

    model_config = {"from_attributes": True}
