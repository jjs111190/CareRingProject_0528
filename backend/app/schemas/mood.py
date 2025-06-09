# app/schemas/mood.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MoodCreate(BaseModel):
    emoji: str
    memo: Optional[str]

class MoodResponse(BaseModel):
    id: int
    emoji: str
    memo: Optional[str]
    image_url: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True