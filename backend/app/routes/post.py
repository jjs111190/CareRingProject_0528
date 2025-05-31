from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, shutil

from app.database import get_db
from app.models import Post, Comment
from app.models.user import User
from app.models.basic_info import BasicInfo
from app.models.lifestyle import Lifestyle
from app.schemas.post import PostResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.user import UserResponse, UserUpdate, PasswordResetRequest
from app.auth.utils import hash_password
from app.dependencies import get_current_user
import redis
import json

# Redis 클라이언트
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Go 서버로 메시지 브로드캐스트
def broadcast_to_go(user: str, message: str):
    payload = json.dumps({"user": user, "msg": message})
    redis_client.publish("chat_channel", payload)

router = APIRouter()

# ------------------------
# 대표 사용자 검색/수정/삭제
# ------------------------

@router.get("/me", response_model=UserResponse)
def read_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_about(user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_update.about is not None:
        current_user.about = user_update.about
        db.commit()
        db.refresh(current_user)
    return current_user

@router.put("/reset-password")
def reset_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successful"}

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ------------------------
# 기본정보 / Lifestyle
# ------------------------

MEDIA_DIR = "media/profiles"
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.post("/basic-info")
def create_basic_info(
    name: str = Form(...),
    birth_date: str = Form(...),
    gender: str = Form(...),
    height: float = Form(...),
    weight: float = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    if existing_info:
        raise HTTPException(status_code=400, detail="Basic info already exists")

    image_url = None
    if profile_image:
        filename = f"{current_user.id}_{uuid.uuid4().hex}.jpg"
        save_path = os.path.join(MEDIA_DIR, filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        image_url = f"/media/profiles/{filename}"

    new_info = BasicInfo(
        user_id=current_user.id,
        name=name,
        birth_date=birth_date,
        gender=gender,
        height=height,
        weight=weight,
        image_url=image_url
    )
    db.add(new_info)
    db.commit()
    db.refresh(new_info)
    return {"message": "Basic info saved", "id": new_info.id, "image_url": image_url}

@router.get("/basic-info/me")
def get_my_basic_info(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    if not info:
        raise HTTPException(status_code=404, detail="No info found")
    return info

@router.get("/basic-info/{user_id}")
def get_basic_info_by_user(user_id: int, db: Session = Depends(get_db)):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == user_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Basic info not found")
    return info

@router.get("/lifestyle/{user_id}")
def get_lifestyle_by_user(user_id: int, db: Session = Depends(get_db)):
    lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == user_id).first()
    if not lifestyle:
        raise HTTPException(status_code=404, detail="Lifestyle info not found")
    return lifestyle

# ------------------------
# 게시글 (Post)
# ------------------------

POST_MEDIA_DIR = "media/posts"
os.makedirs(POST_MEDIA_DIR, exist_ok=True)

@router.post("/posts", response_model=PostResponse)
def create_post(
    phrase: str = Form(...),
    hashtags: Optional[str] = Form(None),  # 새로 추가된 해시태그 필드 (쉼표 구분 문자열)
    location: Optional[str] = Form(None),
    person_tag: Optional[str] = Form(None),
    disclosure: Optional[str] = Form("public"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_url = None
    if image:
        filename = f"{uuid.uuid4().hex}_{image.filename}"
        path = os.path.join(POST_MEDIA_DIR, filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/media/posts/{filename}"

    new_post = Post(
        user_id=current_user.id,
        phrase=phrase,
        hashtags=hashtags,
        image_url=image_url,
        location=location,
        person_tag=person_tag,
        disclosure=disclosure,
        likes=0,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("/posts", response_model=List[PostResponse])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    enriched_posts = []

    for post in posts:
        basic_info = db.query(BasicInfo).filter(BasicInfo.user_id == post.user_id).first()
        user_name = basic_info.name if basic_info else "Unknown"

        enriched_posts.append({
            "id": post.id,
            "user_id": post.user_id,
            "phrase": post.phrase,
            "hashtags": post.hashtags,
            "location": post.location,
            "person_tag": post.person_tag,
            "disclosure": post.disclosure,
            "image_url": post.image_url,
            "likes": post.likes,
            "comments": post.comments,
            "user_name": user_name
        })

    return enriched_posts

@router.get("/posts/me", response_model=List[PostResponse])
def get_my_posts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = db.query(Post).filter(Post.user_id == current_user.id).all()
    enriched_posts = []

    for post in posts:
        basic_info = db.query(BasicInfo).filter(BasicInfo.user_id == post.user_id).first()
        user_name = basic_info.name if basic_info else "Unknown"

        enriched_posts.append({
            "id": post.id,
            "user_id": post.user_id,
            "phrase": post.phrase,
            "hashtags": post.hashtags,
            "location": post.location,
            "person_tag": post.person_tag,
            "disclosure": post.disclosure,
            "image_url": post.image_url,
            "likes": post.likes,
            "comments": post.comments,
            "user_name": user_name
        })

    return enriched_posts

@router.get("/posts/user/{user_id}", response_model=List[PostResponse])
def get_posts_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == user_id).all()
    enriched_posts = []

    for post in posts:
        basic_info = db.query(BasicInfo).filter(BasicInfo.user_id == post.user_id).first()
        user_name = basic_info.name if basic_info else "Unknown"

        enriched_posts.append({
            "id": post.id,
            "user_id": post.user_id,
            "phrase": post.phrase,
            "hashtags": post.hashtags,
            "location": post.location,
            "person_tag": post.person_tag,
            "disclosure": post.disclosure,
            "image_url": post.image_url,
            "likes": post.likes,
            "comments": post.comments,
            "user_name": user_name
        })

    return enriched_posts

@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post_with_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    basic_info = db.query(BasicInfo).filter(BasicInfo.user_id == post.user_id).first()
    user_name = basic_info.name if basic_info else "Unknown"

    # post.comments에서 user.nickname 강제 로딩
    for comment in post.comments:
        _ = comment.user.nickname

    return {
        "id": post.id,
        "user_id": post.user_id,
        "phrase": post.phrase,
        "hashtags": post.hashtags,
        "location": post.location,
        "person_tag": post.person_tag,
        "disclosure": post.disclosure,
        "image_url": post.image_url,
        "likes": post.likes,
        "comments": post.comments,
        "user_name": user_name  # ✅ 여기에 명시적으로 포함
    }
@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this post.")

    # ✅ 이미지 파일이 있으면 삭제
    if post.image_url:
        # 예: "/media/posts/uuid_filename.jpg" → "./media/posts/uuid_filename.jpg"
        file_path = os.path.join(".", post.image_url.lstrip("/"))
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"🗑️ 이미지 삭제 완료: {file_path}")
            except Exception as e:
                print(f"❗ 이미지 삭제 실패: {file_path} - {e}")

    db.delete(post)
    db.commit()
    return {"message": "Post and associated image deleted"}

@router.patch("/posts/{post_id}/like")
def like_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.likes = (post.likes or 0) + 1
    db.commit()
    return {"message": "Liked post", "likes": post.likes}

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = Comment(
        content=comment.content,
        user_id=current_user.id,
        post_id=post_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # ✅ Redis를 통해 Go 서버로 브로드캐스트
    broadcast_to_go(current_user.nickname, comment.content)

    return CommentResponse(
        id=db_comment.id,
        content=db_comment.content,
        user_id=db_comment.user_id,
        user_nickname=current_user.nickname,
        user_name=current_user.nickname,
        user_profile_image=current_user.profile_image, 
        created_at=db_comment.created_at
    )
