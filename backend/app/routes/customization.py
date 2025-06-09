from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.profile_customization import ProfileCustomization
from app.dependencies import get_db, get_current_user
from app.schemas.customization import CustomizationSchema
import json

router = APIRouter()



@router.get("/users/{user_id}/customization", response_model=CustomizationSchema)
def get_customization(user_id: int, db: Session = Depends(get_db)):
    instance = db.query(ProfileCustomization).filter_by(user_id=user_id).first()
    if not instance:
        return CustomizationSchema(backgroundUrl=None, widgets=[])

    widgets = json.loads(instance.widgets_json or "[]")
    return CustomizationSchema(
        backgroundUrl=instance.background_url,
        widgets=widgets
    )

@router.put("/users/me/customization")
def save_customization(
    customization: CustomizationSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    instance = db.query(ProfileCustomization).filter_by(user_id=current_user.id).first()
    if not instance:
        instance = ProfileCustomization(user_id=current_user.id)
        db.add(instance)

    instance.background_url = customization.backgroundUrl
    instance.widgets_json = json.dumps([widget.dict() for widget in customization.widgets])  # ✅ 직렬화 핵심
    db.commit()
    return {"success": True}
