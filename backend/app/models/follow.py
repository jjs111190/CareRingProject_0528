# app/models/follow.py

from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"))
    followed_id = Column(Integer, ForeignKey("users.id"))  # ← 여기 주목