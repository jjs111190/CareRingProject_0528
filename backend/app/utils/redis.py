from redis import Redis

redis_client = Redis(host="localhost", port=6379, decode_responses=True)

def publish_to_redis(channel: str, message: str):
    redis_client.publish(channel, message)