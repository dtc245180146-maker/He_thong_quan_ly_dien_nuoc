from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "INFO"
    room_id: Optional[int] = None
    user_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
