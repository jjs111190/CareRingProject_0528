# backend/app/auth/token.py

from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext
from app.config import settings
# app/auth/utils.py 또는 적절한 위치에 작성

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.follow import Follow



# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})

    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        print("✅ 생성된 JWT:", encoded_jwt)  # ✅ 이 위치로 이동
        return encoded_jwt
    except Exception as e:
        print(f"❌ JWT 생성 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="토큰 생성 중 오류가 발생했습니다."
        )

def verify_token(token: str) -> int:
    """JWT 토큰 검증 및 user_id 반환"""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 인증 정보",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except JWTError as e:
        print(f"❌ JWT 검증 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 정보가 만료되었거나 유효하지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_friends(db: Session, user_id: int) -> list[User]:
    """
    상호 팔로우 관계인 친구 리스트 반환
    """
    # 내가 팔로우한 사람들
    following = db.query(Follow.followed_id).filter(Follow.follower_id == user_id).subquery()

    # 나를 팔로우한 사람들 중, 내가 팔로우한 사람만 = 친구
    friend_users = db.query(User).join(Follow, Follow.follower_id == User.id)\
        .filter(Follow.followed_id == user_id)\
        .filter(User.id.in_(following)).all()

    return friend_users