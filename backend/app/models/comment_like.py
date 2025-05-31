from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class CommentLike(Base):
    __tablename__ = "comment_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    comment_id = Column(Integer, ForeignKey("comments.id"))

    __table_args__ = (UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),)

    user = relationship("User", back_populates="comment_likes")
    comment = relationship("Comment", back_populates="likes")