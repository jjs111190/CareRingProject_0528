# app/schemas/favorite.py
from pydantic import BaseModel
from app import schemas



class FavoriteCreate(BaseModel):
    favorite_user_id: int
    post_id: int

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    favorite_user_id: int
    message: str

    class Config:
        orm_mode = True
