from fastapi import APIRouter, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
from app.core.security import create_jwt_token

router = APIRouter()

GOOGLE_CLIENT_ID = "구글 콘솔에서 발급한 WEB CLIENT ID"

@router.post("/auth/google")
def login_with_google(id_token: str):
    try:
        idinfo = id_token.verify_oauth2_token(id_token, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email in token")

        # DB에서 사용자 조회 또는 생성 (예시 함수)
        user = get_or_create_user_by_email(email)
        token = create_jwt_token(user.id)
        return {"access_token": token}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid token")