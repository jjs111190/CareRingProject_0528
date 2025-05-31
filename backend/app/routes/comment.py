from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List
import json

from app.database import get_db
from app.models import Comment, CommentLike, User
from app.schemas import CommentCreate, CommentResponse  # ✅ import
from app.models.user import User
from app.dependencies import get_current_user
import redis
import json

# Redis 클라이언트 설정 (파일 상단에 위치)
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def broadcast_to_go(user: str, message: str):
    payload = json.dumps({"user": user, "msg": message})
    redis_client.publish("chat_channel", payload)

router = APIRouter()

# WebSocket 연결 관리용 딕셔너리
active_connections: Dict[int, List[WebSocket]] = {}

# 클라이언트 연결 및 메시지 수신 처리
async def handle_comment_ws(websocket: WebSocket, post_id: int):
    await websocket.accept()
    if post_id not in active_connections:
        active_connections[post_id] = []
    active_connections[post_id].append(websocket)
    try:
        while True:
            await websocket.receive_text()  # 클라이언트 ping
    except WebSocketDisconnect:
        active_connections[post_id].remove(websocket)
        print(f"🔌 WebSocket disconnected: post_id={post_id}")

# 댓글 실시간 전송
async def notify_comment_clients(post_id: int, comment_data: dict):
    if post_id not in active_connections:
        return

    living_clients = []
    for ws in active_connections[post_id]:
        try:
            await ws.send_text(json.dumps(comment_data))
            living_clients.append(ws)
        except:
            pass  # 실패한 클라이언트 무시

    active_connections[post_id] = living_clients

# WebSocket 라우트
@router.websocket("/ws/comments/{post_id}")
async def websocket_comments(websocket: WebSocket, post_id: int):
    await handle_comment_ws(websocket, post_id)

# 댓글 작성 API
@router.post("/posts/{post_id}/comments")
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = Comment(
        content=comment.content,
        user_id=current_user.id,
        post_id=post_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    await notify_comment_clients(post_id, {
        "id": new_comment.id,
        "user_name": current_user.nickname,
        "user_profile_image": current_user.profile_image,
        "content": new_comment.content,
        "user_id": current_user.id,
        "created_at": str(new_comment.created_at)
    })

    return {"message": "Comment added"}

# 댓글 삭제 API
@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 댓글 존재 여부 확인
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # 2. 삭제 권한 확인
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this comment.")

    # 3. 댓글 좋아요 먼저 삭제
    db.query(CommentLike).filter(CommentLike.comment_id == comment_id).delete()

    # 4. 댓글 삭제
    db.delete(comment)
    db.commit()

    # 5. Redis 또는 Go 서버로 삭제 이벤트 브로드캐스트
    broadcast_to_go(current_user.nickname, f"deleted comment {comment_id}")

    return {"message": "Comment deleted"}

# ✅ 댓글 목록 조회 API
@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "user_id": comment.user_id,
            "user_name": comment.user.nickname,
            "user_profile_image": comment.user.profile_image,
            "content": comment.content,
            "created_at": comment.created_at.isoformat(),
        })
    return result

# FastAPI 예시 (추정 경로)
@router.post("/comments/{comment_id}/like")
def like_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 댓글 존재 확인
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

    # 2. 중복 좋아요 확인
    existing_like = db.query(CommentLike).filter_by(
        comment_id=comment_id, user_id=current_user.id
    ).first()
    if existing_like:
        raise HTTPException(status_code=400, detail="이미 좋아요를 누른 댓글입니다.")

    # 3. 좋아요 추가
    new_like = CommentLike(comment_id=comment_id, user_id=current_user.id)
    db.add(new_like)
    comment.likes = (comment.likes or 0) + 1
    db.commit()

    # ✅ Redis로 좋아요 브로드캐스트 전송
    broadcast_to_go(current_user.nickname, f"liked comment {comment_id}")

    return {"message": "좋아요 성공", "likes": comment.likes}

@router.delete("/comments/{comment_id}/like")
def unlike_comment(comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(CommentLike).filter_by(comment_id=comment_id, user_id=current_user.id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Not liked")

    db.delete(existing)

    comment = db.query(Comment).filter_by(id=comment_id).first()
    comment.likes -= 1

    db.commit()
    return {"message": "unliked"}