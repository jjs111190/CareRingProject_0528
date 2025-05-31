from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Follow, User
from app.schemas.follow import FollowResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/follow", tags=["Follow"])

# ✅ 먼저 /me를 위에 둠
@router.get("/me", response_model=FollowResponse)
def get_my_follow_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    follower_count = db.query(Follow).filter(Follow.followed_id == current_user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == current_user.id).count()

    return FollowResponse(
        follower_count=follower_count,
        following_count=following_count,
        is_following=False  # 본인에 대한 is_following은 항상 False
    )

# ✅ 동적 라우트는 아래에 둠
@router.get("/{user_id}", response_model=FollowResponse)
def get_follow_data(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    follower_count = db.query(Follow).filter(Follow.followed_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    is_following = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user_id
    ).first() is not None

    return FollowResponse(
        follower_count=follower_count,
        following_count=following_count,
        is_following=is_following
    )

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
        Follow.followed_id == user_id
    ).first()

    if follow:
        db.delete(follow)
        db.commit()
        return {"message": "Unfollowed"}
    else:
        new_follow = Follow(follower_id=current_user.id, followed_id=user_id)
        db.add(new_follow)
        db.commit()
        return {"message": "Followed"}