import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.basic_info import BasicInfo
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter()

# ✅ 이미지 저장 경로 초기화
MEDIA_DIR = "media/profiles"
os.makedirs(MEDIA_DIR, exist_ok=True)

@router.post("/basic-info")
async def create_or_update_basic_info(
    name: str = Form(...),
    birth_date: str = Form(...),
    gender: str = Form(...),
    height: float = Form(...),
    weight: float = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    image_url = info.image_url if info else None

    # ✅ 이미지 저장
    if profile_image:
        filename = f"{current_user.id}_{uuid.uuid4().hex}.jpg"
        save_path = os.path.join(MEDIA_DIR, filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        image_url = f"/media/profiles/{filename}"

    if info:
        # ✅ 기존 정보 업데이트
        info.name = name
        info.birth_date = birth_date
        info.gender = gender
        info.height = height
        info.weight = weight
        info.image_url = image_url
    else:
        # ✅ 새로 생성
        info = BasicInfo(
            user_id=current_user.id,
            name=name,
            birth_date=birth_date,
            gender=gender,
            height=height,
            weight=weight,
            image_url=image_url
        )
        db.add(info)

    db.commit()
    db.refresh(info)

    return {
        "message": "Basic info saved or updated",
        "id": info.id,
        "image_url": image_url
    }

@router.get("/basic-info/me")
def get_my_basic_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == current_user.id).first()
    if not info:
        # ✅ 기본 정보 자동 생성
        info = BasicInfo(
            user_id=current_user.id,
            name="",
            birth_date="",
            gender="",
            height=0,
            weight=0,
            image_url=None
        )
        db.add(info)
        db.commit()
        db.refresh(info)

    return {
        "name": info.name,
        "birth_date": info.birth_date,
        "gender": info.gender,
        "height": info.height,
        "weight": info.weight,
        "image_url": info.image_url
    }

@router.get("/basic-info/{user_id}")
def get_basic_info(user_id: int, db: Session = Depends(get_db)):
    info = db.query(BasicInfo).filter(BasicInfo.user_id == user_id).first()
    if not info:
        # ✅ 기본 정보 자동 생성 (다른 유저도 요청 가능하게 처리)
        info = BasicInfo(
            user_id=user_id,
            name="",
            birth_date="",
            gender="",
            height=0,
            weight=0,
            image_url=None
        )
        db.add(info)
        db.commit()
        db.refresh(info)

    return {
        "name": info.name,
        "birth_date": info.birth_date,
        "gender": info.gender,
        "height": info.height,
        "weight": info.weight,
        "image_url": info.image_url
    }