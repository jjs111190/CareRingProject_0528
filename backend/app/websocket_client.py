import asyncio
import websockets
import json
from typing import Dict

GO_WS_URL = "ws://localhost:8082/ws?token=YOUR_JWT_HERE"  # 실서비스에선 https

async def send_message_to_go_server(data: Dict):
    async with websockets.connect(GO_WS_URL) as websocket:
        await websocket.send(json.dumps(data))
        print("✅ 메시지 전송 완료")

        # 수신 테스트 (선택)
        response = await websocket.recv()
        print("📥 수신된 응답:", response)

# 사용 예시 (테스트 목적)
if __name__ == "__main__":
    sample_data = {
        "room": "chatroom-1",
        "content": "FastAPI에서 보낸 메시지"
    }
    asyncio.run(send_message_to_go_server(sample_data))
