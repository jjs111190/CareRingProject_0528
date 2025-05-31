# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# ✅ 실제 DB 주소 및 비밀번호에 맞게 수정
DATABASE_URL = "mysql+pymysql://root:rootpw@localhost:3306/carering"

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL, echo=True)

# 세션 생성기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스: 모든 모델의 부모 클래스
Base = declarative_base()

# ✅ Dependency로 사용할 DB 세션 주입 함수
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()