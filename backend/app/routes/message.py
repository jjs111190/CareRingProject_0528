from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import traceback
import json # Ensure json is imported for dumps

from app.database import get_db
from app.models import Message, User, Follow
from app.schemas.user import UserSchema, UserInfo # Ensure UserInfo is imported
from app.schemas.message import MessageUser, MessageSchema, MessageCreate, MessageResponse
from app.dependencies import get_current_user
from app.utils.redis import publish_to_redis

router = APIRouter(prefix="/messages", tags=["Messages"])

# ✅ 메시지 전송 가능한 사용자 목록 (내가 팔로우한 사용자만)
@router.get("/available-users/mutual")
def get_mutual_follow_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_users = db.query(User).filter(User.id != current_user.id).all()

    mutuals = []
    for user in all_users:
        is_following = db.query(Follow).filter_by(follower_id=current_user.id, following_id=user.id).first() is not None
        is_follower = db.query(Follow).filter_by(follower_id=user.id, following_id=current_user.id).first() is not None

        if is_following and is_follower:
            mutuals.append({
                "id": user.id,
                "nickname": user.nickname,
                "profile_image": user.profile_image,
                "is_following": True,
                "is_follower": True
            })

    return mutuals

# ✅ 대화중인 사용자 목록
@router.get("/users", response_model=List[MessageUser])
def get_message_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a list of users with whom the current user has active message conversations,
    along with the last message, time, and unread count.
    """
    messages = db.query(Message).options(
        joinedload(Message.sender),
        joinedload(Message.receiver)
    ).filter(
        (Message.sender_id == current_user.id) |
        (Message.receiver_id == current_user.id)
    ).order_by(Message.timestamp.desc()).all()

    seen_users = set()
    message_users = []

    for msg in messages:
        # Determine the other participant in the conversation
        target_user = msg.receiver if msg.sender_id == current_user.id else msg.sender

        if not target_user or target_user.id in seen_users:
            continue

        seen_users.add(target_user.id)

        # Count unread messages from this specific user to the current user
        unread_count = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.sender_id == target_user.id,
            Message.is_read == False
        ).count()

        message_users.append(MessageUser(
            user_id=target_user.id,
            username=target_user.nickname,
            profile_image=target_user.profile_image,
            last_message=msg.content,
            # Format timestamp for display
            time=msg.timestamp.strftime("%I:%M %p"),
            unread_count=unread_count
        ))

    return message_users

# ✅ 메시지 전송
@router.post("/send", response_model=MessageResponse)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends a new message from the current user to a specified receiver.
    Also publishes the message to Redis for real-time delivery via WebSocket.
    """
    try:
        # 1. Save message to database
        new_message = Message(
            sender_id=current_user.id,
            receiver_id=data.receiver_id,
            content=data.content,
            timestamp=datetime.utcnow(),
            is_read=False # New messages are initially unread
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)

        # 2. Prepare payload for Redis publication
        # sender, receiver 모두 자신의 room에 메시지를 받도록 room을 2개로 publish
        sender_room = f"user_{current_user.id}"
        receiver_room = f"user_{data.receiver_id}"
        message_payload = {
            "room": receiver_room, # 기존대로 receiver room
            "content": data.content,
            "sender_id": current_user.id,
            "receiver_id": data.receiver_id,
            "timestamp": new_message.timestamp.isoformat(),
            "message_id": new_message.id, # Include message ID
            "sender_nickname": current_user.nickname, # Include sender info for client display
            "sender_profile_image": current_user.profile_image,
        }
        # 3. Publish message to Redis (receiver)
        publish_to_redis("chat_channel", json.dumps(message_payload))
        # 4. Publish message to Redis (sender)
        sender_payload = dict(message_payload)
        sender_payload["room"] = sender_room
        publish_to_redis("chat_channel", json.dumps(sender_payload))
        print(f"✅ Message from {current_user.id} to {data.receiver_id} published to Redis (sender/receiver room)")

        # 4. Return the saved message response
        return MessageResponse(
            id=new_message.id,
            sender_id=new_message.sender_id,
            receiver_id=new_message.receiver_id,
            content=new_message.content,
            timestamp=new_message.timestamp,
            is_read=new_message.is_read
        )

    except Exception as e:
        db.rollback() # Rollback transaction on error
        traceback.print_exc() # Print full stack trace for debugging
        raise HTTPException(status_code=500, detail=f"메시지 저장 및 전송 실패: {str(e)}")

# ✅ 받은 메시지 조회 (특정 사용자로부터)
@router.get("/received/{user_id}", response_model=List[MessageSchema])
def get_received_messages(
    user_id: int, # This is the sender's ID (the user who sent messages to current_user)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves messages received by the current user from a specific sender.
    """
    messages = db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id
    ).order_by(Message.timestamp).all()
    return messages

# ✅ 보낸 메시지 조회 (특정 수신자에게)
@router.get("/sent/{receiver_id}", response_model=List[MessageSchema])
def get_sent_messages(
    receiver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves messages sent by the current user to a specific receiver.
    """
    messages = db.query(Message).filter(
        Message.sender_id == current_user.id,
        Message.receiver_id == receiver_id
    ).order_by(Message.timestamp).all()
    return messages

# ✅ 모든 대화 메시지 조회 (특정 상대방과의 대화)
@router.get("/chat/{other_user_id}", response_model=List[MessageSchema])
def get_conversation_messages(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all messages exchanged between the current user and another specific user,
    ordered by timestamp.
    """
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()
    return messages

# ✅ 읽음 처리
@router.patch("/read/{sender_id}")
def mark_messages_as_read(
    sender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks all unread messages from a specific sender to the current user as read.
    """
    updated_count = db.query(Message).filter(
        Message.sender_id == sender_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({Message.is_read: True}, synchronize_session="fetch") # Use "fetch" to ensure updates are flushed
    db.commit()
    return {"status": "success", "messages_marked_as_read": updated_count}

# ✅ 채팅 전체 삭제 (특정 상대방과의 모든 대화)
@router.delete("/{user_id}")
def delete_chat(
    user_id: int, # This is the ID of the other user in the chat
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes all messages between the current user and a specified other user.
    """
    deleted_count = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).delete(synchronize_session="fetch")
    db.commit()
    return {"status": "success", "messages_deleted": deleted_count}

# ✅ 메시지 ID 기반으로 단일 메시지 읽음 처리
@router.post("/{message_id}/read")
def mark_single_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.receiver_id == current_user.id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")

    message.is_read = True
    db.commit()
    return {"status": "success", "message_id": message_id}

# 메시지 삭제 API 라우트
@router.delete("/{message_id}")
async def delete_message(message_id: int, current_user: User = Depends(get_current_user)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message or message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    db.delete(message)
    db.commit()

    # 삭제 이벤트 WebSocket으로 브로드캐스트
    delete_payload = {
        "type": "delete",
        "message_id": message_id,
    }
    await broadcast_to_users(json.dumps(delete_payload))  # 사용자에게 브로드캐스트 함수 호출

    return {"detail": "삭제 완료"}