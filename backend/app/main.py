import os
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import redis.asyncio as aioredis # ✅ Redis 비동기 클라이언트 임포트
import json # ✅ JSON 처리 임포트
from app.sockets import sio
import socketio
from socketio import ASGIApp


# 📦 내부 모듈 임포트
from app.auth.utils import hash_password, verify_token
from app.database import Base, engine, SessionLocal, get_db
from app.models import User, Comment, Post, BasicInfo, Lifestyle
# ✅ 라우터 임포트 시, 해당 파일 내의 `router` 객체를 명시적으로 임포트하는 것이 더 명확합니다.
from app.routes import basic_info, lifestyle, user, message, follow, favorite
# 라우터 파일에서 `router = APIRouter(...)`로 정의했다면, 아래처럼 임포트합니다.
from app.routes import login # login.router를 사용할 것이므로 login 모듈 임포트
from app.routes import post # post.router를 사용할 것이므로 post 모듈 임포트
from app.routes import comment # comment.router를 사용할 것이므로 comment 모듈 임포트
from app.websocket_routes import router as websocket_router 
from app.routes.login import create_access_token # `create_access_token`은 login 라우터에서 가져옴
from app.dependencies import get_current_user
from app.schemas import CommentCreate # `app.schemas`에 CommentCreate가 있다고 가정
from app.websocket_client import send_message_to_go_server

# ------------------------------
# ✅ Socket.IO 서버 생성
# ------------------------------


# ------------------------------
# ✅ FastAPI 앱 정의
# ------------------------------
fastapi_app = FastAPI()

# ✅ CORS 설정
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 배포 시에는 실제 프론트엔드 도메인으로 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DB 테이블 생성
Base.metadata.create_all(bind=engine)

# ✅ 정적 디렉토리 마운트
os.makedirs("media/profiles", exist_ok=True)
fastapi_app.mount("/media", StaticFiles(directory="media"), name="media")
fastapi_app.mount("/static", StaticFiles(directory="static"), name="static")

# ------------------------------
# ✅ 회원가입 API
# ------------------------------
class SignupRequest(BaseModel):
    nickname: str
    email: EmailStr
    password: str

@fastapi_app.post("/signup")
async def signup(data: SignupRequest):
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
        hashed_password = hash_password(data.password)
        new_user = User(nickname=data.nickname, email=data.email, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        db.add(BasicInfo(user_id=new_user.id))
        db.commit()
        access_token = create_access_token(data={"user_id": new_user.id})
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        db.close()

# ------------------------------
# ✅ Go 서버로 WebSocket 메시지 전송
# ------------------------------
@fastapi_app.post("/notify-go") # ✅ 엔드포인트 이름 변경 (더 명확하게)
async def notify_go_server(payload: dict): # ✅ payload를 받도록 수정
    room = payload.get("room")
    content = payload.get("content")
    if not room or not content:
        raise HTTPException(status_code=400, detail="'room' and 'content' are required in the payload.")

    data_to_go = {
        "room": room,
        "content": content
    }
    try:
        asyncio.create_task(send_message_to_go_server(data_to_go))
        return {"status": "✅ 전송 요청 완료", "details": "Message forwarded to Go server"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------
# ✅ 라우터 등록 (수정 필요한 핵심 부분)
# ------------------------------
fastapi_app.include_router(login.router) # ✅ `login.router`로 수정
fastapi_app.include_router(user.router, prefix="/users", tags=["users"])
fastapi_app.include_router(basic_info.router)
fastapi_app.include_router(lifestyle.router)
fastapi_app.include_router(post) # ✅ `post.router`로 수정
fastapi_app.include_router(message.router)
fastapi_app.include_router(follow.router)
fastapi_app.include_router(comment) # ✅ `comment.router`로 수정
fastapi_app.include_router(favorite.router, prefix="/favorites")
fastapi_app.include_router(websocket_router)

# ✅ 만약 `app/routes/comment.py`에 이미 라우터가 있다면, 아래 중복 정의는 제거해야 합니다.
# comment_router = APIRouter()
# @comment_router.post("/posts/{post_id}/comments")
# def create_comment(
#     post_id: int,
#     comment: CommentCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     post_obj = db.query(Post).filter(Post.id == post_id).first()
#     if not post_obj:
#         raise HTTPException(status_code=404, detail="Post not found")
#     new_comment = Comment(content=comment.content, user_id=current_user.id, post_id=post_id)
#     db.add(new_comment)
#     db.commit()
#     db.refresh(new_comment)
#     return {"message": "Comment added"}
# fastapi_app.include_router(comment_router)


# ------------------------------
# ✅ Redis Subscriber Background Task
# ------------------------------
async def redis_subscriber():
    """
    Redis의 'chat_channel'을 구독하고 수신된 메시지를 Socket.IO 클라이언트에 브로드캐스트합니다.
    """
    # Redis 연결 설정 (호스트, 포트 등을 환경에 맞게 조정)
    r = aioredis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe("chat_channel")
    print("👂 Redis PubSub subscribed to 'chat_channel'")

    async for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                room = data.get('room')
                if room:
                    # 특정 방으로 메시지 emit
                    await sio.emit('message', data, room=room)
                    print(f"📨 Redis → Room '{room}' → Socket.IO로 메시지 브로드캐스트: {data}")
                else:
                    # room 정보가 없으면 모든 클라이언트에 브로드캐스트 (예외 케이스)
                    await sio.emit('message', data)
                    print(f"📨 Redis → All Clients → Socket.IO로 메시지 브로드캐스트: {data}")
            except json.JSONDecodeError as e:
                print(f"❌ Redis 메시지 JSON 디코딩 실패: {e} - 데이터: {message['data']}")
            except Exception as e:
                print(f"❌ Redis 메시지 처리 중 오류 발생: {e}")

# ------------------------------
# ✅ FastAPI + Socket.IO 통합 실행
# ------------------------------
# Socket.IO 앱을 FastAPI 앱에 통합합니다.
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

# ✅ FastAPI 시작 시 이벤트 핸들러: Redis 리스너 시작
@fastapi_app.on_event("startup")
async def startup_event():
    """
    FastAPI 시작 시 Redis 구독자를 백그라운드 태스크로 실행합니다.
    """
    asyncio.create_task(redis_subscriber())
    print("🚀 Redis 백그라운드 리스너가 FastAPI 시작 태스크로 실행되었습니다.")


socket_app = ASGIApp(sio, other_asgi_app=app)