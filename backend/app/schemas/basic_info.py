# schemas/basic_info.py
from pydantic import BaseModel

class BasicInfoRequest(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD 문자열로 처리
    gender: str       # "male", "female", "other"
    height: float
    weight: float