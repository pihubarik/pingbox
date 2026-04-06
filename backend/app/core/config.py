from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://pingbox:pingbox123@localhost:5432/pingbox"
    REDIS_URL: str = "redis://localhost:6379"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    SECRET_KEY: str = "supersecretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()