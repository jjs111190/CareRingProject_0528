from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 🔐 JWT 설정
    JWT_SECRET_KEY: str = "super-secret-value-123"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    # 🛢️ 데이터베이스 설정
    db_host: str = "localhost"
    db_port: str = "3306"
    db_user: str = "root"
    db_password: str = "rootpw"
    db_name: str = "carering"

    # ✅ 기타 설정
    secret_key: str = "super-secret-value-123"

    class Config:
        env_file = ".env"  # 환경변수 파일 경로

settings = Settings()