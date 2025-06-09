from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Follow, User
from app.schemas.follow import FollowResponse
from app.dependencies import get_current_user
import traceback

router = APIRouter(prefix="/follow", tags=["Follow"])

# ✅ 내 팔로우/팔로워 수
@router.get("/me", response_model=FollowResponse)
def get_my_follow_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"✅ current_user = {current_user.id} ({current_user.nickname})")

        follower_count = db.query(Follow).filter(Follow.following_id == current_user.id).count()
        following_count = db.query(Follow).filter(Follow.follower_id == current_user.id).count()

        return FollowResponse(
            follower_count=follower_count,
            following_count=following_count,
            is_following=False
        )

    except Exception:
        print("❌ Exception in /follow/me")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ✅ 특정 사용자 팔로우/팔로워 정보 + is_following
@router.get("/{user_id}", response_model=FollowResponse)
def get_follow_data(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        follower_count = db.query(Follow).filter(Follow.following_id == user_id).count()
        following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()

        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id
        ).first() is not None

        return FollowResponse(
            follower_count=follower_count,
            following_count=following_count,
            is_following=is_following
        )
    except Exception:
        print(f"❌ Error in /follow/{user_id}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ✅ 팔로우 토글
@router.post("/{user_id}", status_code=status.HTTP_200_OK)
def toggle_follow(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()

    if follow:
        db.delete(follow)
        db.commit()
        return {"message": "Unfollowed"}
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        db.commit()
        return {"message": "Followed"}