from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import redis
import json

# ✅ Redis 클라이언트 설정
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# ✅ Go 서버로 브로드캐스트하는 함수
def broadcast_to_go(user: str, message: str):
    payload = json.dumps({"user": user, "msg": message})
    redis_client.publish("chat_channel", payload)

# ✅ WebSocket 클라이언트 관리
connected_clients: Dict[int, List[WebSocket]] = {}

# ✅ 클라이언트 연결 핸들링
async def handle_comment_ws(websocket: WebSocket, post_id: int):
    await websocket.accept()
    if post_id not in connected_clients:
        connected_clients[post_id] = []
    connected_clients[post_id].append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients[post_id].remove(websocket)
        print(f"🔌 WebSocket disconnected: post_id={post_id}")

# ✅ 댓글 생성 시 연결된 클라이언트에게 전송 + Redis로도 전송
async def notify_comment_clients(post_id: int, comment_data: dict):
    if post_id not in connected_clients:
        return

    living_clients = []
    for client in connected_clients[post_id]:
        try:
            await client.send_json(comment_data)
            living_clients.append(client)
        except Exception as e:
            print(f"❌ Failed to send to client: {e}")
    connected_clients[post_id] = living_clients

    # ✅ Go 서버로도 댓글 내용 전송
    user = comment_data.get("user", "anonymous")
    content = comment_data.get("content", "")
    broadcast_to_go(user, content)