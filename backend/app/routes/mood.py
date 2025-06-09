from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import shutil
import uuid
import os

from app.database import get_db
from app.models.mood import Mood
from app.models.user import User
from app.models.basic_info import BasicInfo
from app.models.follow import Follow
from app.auth.dependencies import get_current_user

router = APIRouter()


# ✅ 무드 생성 API
@router.post("/mood")
def create_mood(
    emoji: str = Form(...),
    memo: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_url = None

    if image:
        filename = f"{uuid.uuid4().hex}_{image.filename}"
        save_path = f"static/uploads/{filename}"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/uploads/{filename}"

    new_mood = Mood(
        user_id=current_user.id,
        emoji=emoji,
        memo=memo,
        image=image_url
    )
    db.add(new_mood)
    db.commit()
    db.refresh(new_mood)

    return {"message": "Mood created"}


# ✅ 무드 스토리 가져오기 (팔로우한 유저 + 본인)
@router.get("/mood/stories")
def get_mood_stories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 내가 팔로우한 사람 목록
    followees = db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    followee_ids = [f.following_id for f in followees]

    # 나 포함
    user_ids = followee_ids + [current_user.id]

    # 각 user_id에 대해 가장 최신 무드만 가져오는 서브쿼리
    subquery = (
        db.query(Mood.user_id, Mood.emoji, Mood.memo, Mood.created_at)
        .filter(Mood.user_id.in_(user_ids))
        .order_by(Mood.user_id, desc(Mood.created_at))
        .distinct(Mood.user_id)
        .all()
    )

    # user_id 기준으로 최신 무드 매핑
    mood_map = {m.user_id: m for m in subquery}

    result = []
    for uid in user_ids:
        user = db.query(User).filter(User.id == uid).first()
        basic = db.query(BasicInfo).filter(BasicInfo.user_id == uid).first()
        mood = mood_map.get(uid)

        result.append({
            "id": uid,
            "nickname": user.nickname if user else "",
            "image_url": basic.image_url if basic else None,
            "recentMood": {
                "emoji": mood.emoji if mood else None,
                "phrase": mood.memo if mood else "",  # 🔥 여기를 phrase → memo 로 수정 완료
                "created_at": mood.created_at.isoformat() if mood and mood.created_at else None
            } if mood else None
        })

    return result