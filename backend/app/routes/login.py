from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth.utils import verify_password, create_access_token
from app.schemas.token import TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

# ✅ JSON 형식 로그인 요청
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ✅ 1. 일반 JSON 로그인 (모바일 클라이언트 대응)
@router.post("/login", response_model=TokenResponse)
def login_user_json(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}

# ✅ 2. OAuth2 로그인 (폼 기반, Swagger/웹 대응)
@router.post("/token", response_model=TokenResponse)
def login_user_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}