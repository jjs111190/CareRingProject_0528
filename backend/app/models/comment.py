from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String(500), nullable=False)  # 최대 500자 제한

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # 자동 생성 시간
    likes = Column(Integer, default=0)
    # 관계 설정
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    likes = relationship("CommentLike", back_populates="comment") 
    # 닉네임 접근용 하이브리드 속성
    @hybrid_property
    def user_name(self):
        return self.user.nickname if self.user else None