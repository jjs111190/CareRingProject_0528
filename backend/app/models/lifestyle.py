# app/models/lifestyle.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Lifestyle(Base):
    __tablename__ = "lifestyle"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medical_history = Column(String(255), nullable=False)
    health_goals = Column(String(255), nullable=False)
    diet_tracking = Column(String(255), nullable=False)
    sleep_habits = Column(String(255), nullable=False)
    smoking_alcohol = Column(String(255), nullable=False)