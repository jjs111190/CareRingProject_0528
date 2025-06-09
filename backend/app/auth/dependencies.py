# app/auth/dependencies.py

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.utils import verify_token
from app.models.user import User
from app.models.follow import Follow
from app.models.user import User
# NameError: name 'List' is not defined 방지
from typing import List
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    user_id = verify_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_friends_and_following(db: Session, user_id: int):
    """
    현재 사용자가 팔로우한 사용자들을 반환합니다.
    향후 친구 테이블이 있으면 병합도 가능.
    """
    following = db.query(Follow.followed_id).filter(Follow.follower_id == user_id).all()  # ✅ 수정
    user_ids = [f[0] for f in following]
    return db.query(User).filter(User.id.in_(user_ids)).all()
# ✅ 반드시 이 아래 정의
def is_friend(current_user_id: int, target_user_id: int) -> bool:
    return current_user_id != target_user_id  # 실제 로직은 친구 관계 DB 확인 시 수정
def is_following(db: Session, current_user_id: int, target_user_id: int) -> bool:
    return db.query(Follow).filter(
        Follow.follower_id == current_user_id,
        Follow.followed_id == target_user_id  # ✅ 수정
    ).first() is not None