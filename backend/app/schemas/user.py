# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

#from app.auth.utils import hash_password
# ✅ 업데이트용 모델
class UserUpdate(BaseModel):
    about: Optional[str] = None

# ✅ 응답용 모델
class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    about: Optional[str] = None
    created_at: Optional[datetime] = None  # DB 필드와 일치해야 함
    profile_image: Optional[str]
    
    class Config:
        from_attributes = True  # orm_mode → from_attributes in Pydantic v2

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str
# 🔧 user.py (현재 파일 상단에 추가)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str

    def to_dict(self):
        return {
            "email": self.email,
            "password": hash_password(self.password),  # 비밀번호 해시화
            "nickname": self.nickname
        }
    
# app/schemas/user.py
class UserSchema(BaseModel):
    id: int
    email: str
    nickname: str
    profile_image: Optional[str] = None

    class Config:
        orm_mode = True

class UserInfo(BaseModel):
    id: int
    nickname: str
    profile_image: Optional[str]
    is_following: bool
    is_follower: bool



class UserSearchResult(BaseModel):
    id: int
    nickname: str  

    class Config:
        from_attributes = True 

