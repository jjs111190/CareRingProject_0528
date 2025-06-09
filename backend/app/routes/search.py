from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.models.user import User
from app.models.post import Post

router = APIRouter()
@router.get("/search")
def search_all(query: str, db: Session = Depends(get_db)):
    keyword = f"%{query}%"

    users = db.query(User).filter(
        (User.id.ilike(keyword)) | (User.nickname.ilike(keyword))
    ).limit(20).all()

    posts = db.query(Post).filter(
        (Post.phrase.ilike(keyword)) | (Post.text.ilike(keyword))
    ).limit(20).all()

    return {
        "results": [
            *[
                {"id": u.id, "nickname": u.nickname, "type": "user"}
                for u in users
            ],
            *[
                {"id": p.id, "phrase": p.phrase, "type": "post"}
                for p in posts
            ]
        ]
    }