from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)
    about = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    profile_image = Column(String(255), nullable=True)

    # ✅ 관계 설정
    basic_info = relationship("BasicInfo", back_populates="user", uselist=False)
    lifestyle = relationship("Lifestyle", backref="user", uselist=False)
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", foreign_keys='Message.sender_id', back_populates="sender")
    received_messages = relationship("Message", foreign_keys='Message.receiver_id', back_populates="receiver")
    # models.py 또는 user.py 안에서 User 모델 정의 내에 추가
    comment_likes = relationship("CommentLike", back_populates="user")
    # models/user.py (혹은 BaseUser 클래스 등)
    moods = relationship("Mood", back_populates="user")
    customization = relationship("ProfileCustomization", back_populates="user", uselist=False)