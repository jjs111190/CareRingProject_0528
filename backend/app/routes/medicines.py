from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import medicine
from app.models import medicines  # ✅ models.medicines 모듈 import

router = APIRouter()

# ✅ 약 추가
@router.post("/medicines", response_model=medicine.MedicineOut)
def create_medicine(med: medicine.MedicineCreate, db: Session = Depends(get_db)):
    db_med = medicines.Medicine(**med.dict())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

# ✅ 날짜별 약 조회 (기존 방식 유지)
@router.get("/medicines/{date}", response_model=List[medicine.MedicineOut])
def get_medicines_by_path_date(date: str, db: Session = Depends(get_db)):
    return db.query(medicines.Medicine).filter(medicines.Medicine.date == date).all()

# ✅ query string 기반 날짜 또는 월별 조회
@router.get("/medicines", response_model=List[medicine.MedicineOut])
def get_medicines(
    date: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    if date:
        return db.query(medicines.Medicine).filter(medicines.Medicine.date == date).all()
    elif year and month:
        start = f"{year}-{str(month).zfill(2)}-01"
        end_month = month + 1
        end_year = year
        if end_month > 12:
            end_month = 1
            end_year += 1
        end = f"{end_year}-{str(end_month).zfill(2)}-01"
        return db.query(medicines.Medicine).filter(
            medicines.Medicine.date >= start,
            medicines.Medicine.date < end
        ).all()
    return []