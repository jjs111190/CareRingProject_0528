from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ProfileCustomization(Base):
    __tablename__ = "profile_customizations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    background_url = Column(String(255), nullable=True)
    widgets_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="customization")