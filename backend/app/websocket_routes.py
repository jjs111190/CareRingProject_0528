from fastapi import WebSocket
from fastapi.routing import APIRouter
import json

router = APIRouter()
user_socket = {}  # ✅ 사용자별 연결 저장

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    user_id = None
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "join":
                user_id = message["userId"]
                user_socket[user_id] = websocket
                print(f"✅ 유저 {user_id} 연결됨")

            elif message["type"] == "typing":
                receiver_id = message["receiverId"]
                if receiver_id in user_socket:
                    await user_socket[receiver_id].send_text(json.dumps({
                        "type": "typing",
                        "senderId": user_id
                    }))
            elif message["type"] == "message":
                # 메시지 처리 로직
                pass
    except Exception as e:
        print("❌ WebSocket error:", e)
    finally:
        if user_id and user_id in user_socket:
            del user_socket[user_id]
            print(f"🔌 유저 {user_id} 연결 해제됨")