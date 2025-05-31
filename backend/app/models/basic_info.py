from sqlalchemy import Column, String, Float, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BasicInfo(Base):
    __tablename__ = "basic_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    name = Column(String(100), nullable=True)
    birth_date = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    image_url = Column(String(200), nullable=True)

    user = relationship("User", back_populates="basic_info")