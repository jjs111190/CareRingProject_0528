# models.py
from sqlalchemy import Column, Integer, String
# ✅ 수정된 코드
from app.database import Base

class Medicine(Base):
    __tablename__ = 'medicines'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))  # ✅ 길이 지정
    date = Column(String(20)) 
    time = Column(String(20), nullable=False)   # ✅ 길이 명시
    title = Column(String(100), nullable=False) # ✅ 길이 명시