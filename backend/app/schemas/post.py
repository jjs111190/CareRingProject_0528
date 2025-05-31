from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# 사용자 기본 정보 스키마
class UserBase(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]  # 프로필 이미지 경로 포함

    class Config:
        orm_mode = True

# 댓글 응답용 스키마
class CommentResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    content: str
    created_at: datetime
    profile_image: Optional[str] = None  # 사용자 프로필 이미지 추가

    class Config:
        from_attributes = True

# 게시글 생성 요청용 스키마 (user_id 포함)
class PostCreate(BaseModel):
    user_id: int
    user_name: str
    phrase: str
    hashtags: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    person_tag: Optional[str] = None
    disclosure: Optional[str] = None

# 게시글 생성 요청용 스키마 (user_id 미포함)
class PostCreateWithoutUserId(BaseModel):
    user_name: str
    phrase: str
    hashtags: Optional[str] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    person_tag: Optional[str] = None
    disclosure: Optional[str] = None

# 게시글 응답용 스키마
class PostResponse(BaseModel):
    id: int
    user_id: int
    phrase: str
    hashtags: Optional[str]
    location: Optional[str]
    person_tag: Optional[str]
    disclosure: Optional[str]
    image_url: Optional[str]
    likes: int
    comments: List[CommentResponse]
    user_name: Optional[str]  # ✅ 여기 추가!

    class Config:
        from_attributes = True