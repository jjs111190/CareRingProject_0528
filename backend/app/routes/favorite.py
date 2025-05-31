# app/routers/favorite.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app import models, schemas

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.post("/", response_model=schemas.FavoriteResponse)
def add_favorite(favorite: schemas.FavoriteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Favorite).filter_by(
        user_id=current_user.id, favorite_user_id=favorite.favorite_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")
    
    new_fav = models.Favorite(user_id=current_user.id, favorite_user_id=favorite.favorite_user_id)
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav

@router.delete("/{favorite_user_id}")
def remove_favorite(favorite_user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fav = db.query(models.Favorite).filter_by(
        user_id=current_user.id, favorite_user_id=favorite_user_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(fav)
    db.commit()
    return {"message": "Favorite removed"}