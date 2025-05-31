from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ✅ 메시지 생성 요청용
class MessageCreate(BaseModel):
    receiver_id: int
    content: str

    class Config:
        from_attributes = True  # Pydantic v2 호환

# ✅ 메시지 단건 조회/응답용
class MessageSchema(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

# ✅ 메시지 전송 응답용 (is_read 포함)
class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

# ✅ 메시지 목록용 사용자 정보 + 마지막 메시지 + 읽지 않은 개수
class MessageUser(BaseModel):
    user_id: int
    username: str
    profile_image: Optional[str]
    last_message: str
    time: str
    unread_count: int

    class Config:
        from_attributes = True