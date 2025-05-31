from socketio import AsyncServer
from fastapi_socketio import SocketManager
from fastapi import Request
import redis
import json

# ✅ Redis 클라이언트 설정
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# ✅ Redis를 통해 Go 서버로 메시지 전달
def broadcast_to_go(user: str, message: str):
    payload = json.dumps({"user": user, "msg": message})
    redis_client.publish("chat_channel", payload)

# ✅ Socket.IO 서버 인스턴스
sio = AsyncServer(async_mode="asgi", cors_allowed_origins="*")

@sio.event
async def connect(sid, environ, auth):
    token = auth.get('token')
    user_id = decode_jwt(token)  # 직접 디코딩하는 함수 필요
    room = f"user_{user_id}"
    await sio.save_session(sid, {'user_id': user_id})
    await sio.enter_room(sid, room)
    print(f"✅ {sid} joined room {room}")

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    user_id = session.get('user_id')
    room = f"user_{user_id}"
    await sio.leave_room(sid, room)
    print(f"❌ {sid} left room {room}")

@sio.event
async def join(sid, data):
    room = data.get("room")
    if room:
        await sio.save_session(sid, {'room': room})
        await sio.enter_room(sid, room)
        print(f"📦 {sid} joined room: {room}")

@sio.event
async def leave(sid, data):
    room = data.get("room")
    if room:
        await sio.leave_room(sid, room)
        print(f"👋 {sid} left room: {room}")


@sio.on("leave")
async def handle_leave(sid, data):
    room = data.get("room")
    if room:
        await sio.leave_room(sid, room)
        print(f"👋 User with sid {sid} left room: {room}")

@sio.on("join")
async def handle_join(sid, data):
    room = data.get("room")
    if room:
        await sio.enter_room(sid, room)
        print(f"✅ User with sid {sid} joined room: {room}")

@sio.on("typing")
async def handle_typing(sid, data):
    print("📥 [typing] 수신 데이터:", data)
    receiver_id = data.get("receiverId")
    sender_id = data.get("senderId")
    if receiver_id and sender_id:
        room = f"user_{receiver_id}"
        await sio.emit("typing", sender_id, room=room, skip_sid=sid)

        # Redis 발행
        broadcast_to_go(user=str(sender_id), message="typing...")

@sio.on("send_message")
async def handle_send_message(sid, data):
    receiver_room = f"user_{data['receiver_id']}"
    await sio.emit("message", data, room=receiver_room)