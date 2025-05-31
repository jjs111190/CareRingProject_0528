from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, LargeBinary, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    image = Column(LargeBinary, nullable=True)
    # 작성자 정보
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="posts")  # 사용자 관계

    # 글/이미지/시간
    phrase = Column(String(500), nullable=True)               # 글 내용
    text = Column(String, nullable=True)                      # 호환성 유지
    hashtags = Column(String(500), nullable=True)             # 해시태그
    image_url = Column(String(1000), nullable=True)           # 이미지 URL
    image = Column(String, nullable=True)                     # 호환성 유지
    location = Column(String(255), nullable=True)             # 위치 정보
    person_tag = Column(String(255), nullable=True)           # 사람 태그
    disclosure = Column(String(50), nullable=True, default="public")  # 공개 범위
    likes = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 댓글 연결, 게시글 삭제 시 댓글도 함께 삭제
    comments = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    # 작성자 닉네임 속성
    @hybrid_property
    def user_name(self):
        return self.user.nickname if self.user else None