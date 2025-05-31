from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User
from app.config import settings  # ✅ 설정 객체 import

# OAuth2 스킴 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # 프론트의 로그인 경로에 따라 조정

# ✅ 현재 로그인된 사용자 확인
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    print("📦 Token received in dependency:", token)

    if not token or "." not in token:
        print("❌ Invalid token format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰 형식입니다."
        )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])  # ✅ 수정
        print("✅ Token payload:", payload)
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰에 사용자 정보가 없습니다.")
    except JWTError as e:
        print("❌ JWT decoding failed:", str(e))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 검증 실패")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")

    print("🙆 인증된 유저 반환:", user.email)
    return user