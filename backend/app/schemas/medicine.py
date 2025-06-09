from pydantic import BaseModel
from datetime import date, time

class MedicineCreate(BaseModel):
    date: date  # YYYY-MM-DD 형식으로 자동 파싱됨
    time: time  # HH:MM:SS 또는 HH:MM
    title: str

class MedicineOut(BaseModel):
    id: int
    date: date
    time: time
    title: str

    class Config:
        from_attributes = True  # Pydantic v2 이상에서는 orm_mode 대신 사용