from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import shutil

from app.database import SessionLocal, get_db
from app.models.basic_info import BasicInfo
from app.models.lifestyle import Lifestyle
from app.models.user import User
from app.schemas.lifestyle import LifestyleRequest
from app.dependencies import get_current_user

router = APIRouter()

# ✅ 이미지 저장 경로 초기화
MEDIA_DIR = "media/profiles"
os.makedirs(MEDIA_DIR, exist_ok=True)

# ✅ 기본 정보 생성
@router.post("/basic-info")
async def create_basic_info(
    name: str = Form(...),
    birth_date: str = Form(...),
    gender: str = Form(...),
    height: float = Form(...),
    weight: float = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    if existing_info:
        raise HTTPException(status_code=400, detail="Basic info already exists")

    image_url = None

    if profile_image:
        filename = f"{current_user.id}_{uuid.uuid4().hex}.jpg"
        save_path = os.path.join(MEDIA_DIR, filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        image_url = f"/media/profiles/{filename}"

    new_info = BasicInfo(
        user_id=current_user.id,
        name=name,
        birth_date=birth_date,
        gender=gender,
        height=height,
        weight=weight,
        image_url=image_url
    )
    db.add(new_info)
    db.commit()
    db.refresh(new_info)

    return {
        "message": "Basic info saved",
        "id": new_info.id,
        "image_url": image_url
    }

# ✅ 내 기본 정보 조회
@router.get("/basic-info/me")
def get_my_basic_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    if not info:
        raise HTTPException(status_code=404, detail="No info found")

    return {
        "name": info.name,
        "birth_date": info.birth_date,
        "gender": info.gender,
        "height": info.height,
        "weight": info.weight,
        "image_url": info.image_url
    }

# ✅ 특정 사용자 기본 정보 조회
@router.get("/basic-info/{user_id}")
def get_basic_info(user_id: int, db: Session = Depends(get_db)):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == user_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Basic info not found")
    return info

# 🔸 라이프스타일 정보 저장 (중복 저장 방지)
@router.post("/lifestyle")
def save_lifestyle(
    data: LifestyleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Lifestyle).filter(Lifestyle.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Lifestyle info already exists")

    new_lifestyle = Lifestyle(
        user_id=current_user.id,
        medical_history=data.medical_history.strip(),
        health_goals=data.health_goals.strip(),
        diet_tracking=data.diet_tracking.strip(),
        sleep_habits=data.sleep_habits.strip(),
        smoking_alcohol=data.smoking_alcohol.strip(),
    )
    db.add(new_lifestyle)
    db.commit()
    db.refresh(new_lifestyle)
    return {"message": "Lifestyle info saved", "id": new_lifestyle.id}

# backend - /lifestyle/me
@router.get("/lifestyle/me")
def get_my_lifestyle(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    info = db.query(Lifestyle).filter(Lifestyle.user_id == current_user.id).first()

    if not info or any(
        not getattr(info, field, '') or not getattr(info, field, '').strip()
        for field in [
            "medical_history", "health_goals", "diet_tracking",
            "sleep_habits", "smoking_alcohol"
        ]
    ):
        raise HTTPException(status_code=404, detail="No lifestyle info found")

    return info
# 🔸 특정 사용자 라이프스타일 조회
@router.get("/lifestyle/{user_id}")
def get_lifestyle(user_id: int, db: Session = Depends(get_db)):
    lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == user_id).first()
    if not lifestyle:
        raise HTTPException(status_code=404, detail="Lifestyle not found")
    return lifestyle