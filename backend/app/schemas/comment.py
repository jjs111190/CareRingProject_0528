from pydantic import BaseModel
from typing import Optional

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    user_nickname: str  # ✅ 이미 존재
    user_name: str      # ✅ 이거 추가해야 함
    user_profile_image: Optional[str] 

    class Config:
        from_attributes = True