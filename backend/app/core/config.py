from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Pingbox"
    debug: bool = False

    # postgresql+asyncpg://user:pass@host:5432/dbname — use `postgres` as host in Docker
    database_url: str = "postgresql+asyncpg://pingbox:pingbox123@localhost:5432/pingbox"

    redis_url: str = "redis://localhost:6379"
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"

    secret_key: str = "supersecretkey123"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
