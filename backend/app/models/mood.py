from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Mood(Base):
    __tablename__ = "moods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    emoji = Column(String(10), nullable=False)  # 이모지 최대 4~5byte 정도면 충분
    memo = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)  # ✅ 길이 명시
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="moods")