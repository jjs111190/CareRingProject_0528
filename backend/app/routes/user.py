from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.basic_info import BasicInfo
from app.models.lifestyle import Lifestyle
from app.models.post import Post
from app.schemas.user import UserResponse, UserUpdate, PasswordResetRequest
from app.auth.utils import hash_password

router = APIRouter()

# ✅ 내 정보 조회
@router.get("/me", response_model=UserResponse)
def read_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return current_user

# ✅ 내 소개글 수정
@router.put("/me", response_model=UserResponse)
def update_about(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.about is not None:
        current_user.about = user_update.about
        db.commit()
        db.refresh(current_user)
    return current_user

# ✅ 비밀번호 재설정 (이메일 기반)
@router.put("/reset-password")
def reset_password(
    data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successful"}

# ✅ 특정 사용자 정보 조회
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ✅ 특정 사용자의 기본 정보 조회
@router.get("/basic-info/{user_id}")
def get_basic_info_by_user(user_id: int, db: Session = Depends(get_db)):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == user_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Basic info not found")
    return info

# ✅ 특정 사용자의 생활습관 정보 조회
@router.get("/lifestyle/{user_id}")
def get_lifestyle_by_user(user_id: int, db: Session = Depends(get_db)):
    lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == user_id).first()
    if not lifestyle:
        raise HTTPException(status_code=404, detail="Lifestyle info not found")
    return lifestyle

# ✅ 특정 사용자의 게시글 조회
@router.get("/posts/user/{user_id}")
def get_posts_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == user_id).all()
    return posts