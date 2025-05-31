# app/redis_subscriber.py
import redis
import socketio
import json

sio = socketio.AsyncServer(async_mode='asgi')
r = redis.Redis(host="localhost", port=6379, decode_responses=True)

def listen_to_redis():
    pubsub = r.pubsub()
    pubsub.subscribe('chat_channel')

    for message in pubsub.listen():
        if message['type'] == 'message':
            try:
                data = json.loads(message['data'])
                receiver_id = data.get("receiver_id")
                content = data.get("content")
                sio.emit("receive_message", {"content": content}, room=str(receiver_id))
            except Exception as e:
                print("❌ Error in Redis message handling:", e)