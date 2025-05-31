# app/schemas/lifestyle.py
from pydantic import BaseModel, validator

class LifestyleRequest(BaseModel):
    medical_history: str
    health_goals: str
    diet_tracking: str
    sleep_habits: str
    smoking_alcohol: str

    @validator("*", pre=True)
    def no_null_or_blank(cls, v):
        if v is None or not str(v).strip():
            raise ValueError("Field cannot be null or empty")
        return v.strip()