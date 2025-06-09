from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.widget_layout import WidgetLayout
from app.schemas.widget_layout import SaveLayoutRequest

router = APIRouter()

@router.post("/profile/layout/save")
def save_layout(request: SaveLayoutRequest, db: Session = Depends(get_db)):
    existing = db.query(WidgetLayout).filter_by(user_id=request.user_id).first()
    if existing:
        existing.layout_json = [section.dict() for section in request.layout]
    else:
        new_layout = WidgetLayout(
            user_id=request.user_id,
            layout_json=[section.dict() for section in request.layout]
        )
        db.add(new_layout)
    db.commit()
    return {"status": "ok"}

@router.get("/profile/layout/{user_id}")
def get_layout(user_id: int, db: Session = Depends(get_db)):
    layout = db.query(WidgetLayout).filter_by(user_id=user_id).first()
    if not layout:
        return {"layout": []}
    return {"layout": layout.layout_json}