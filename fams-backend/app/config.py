from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "FAMS – Flight & Aviation Staff Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite:///./fams.db"

    # JWT settings
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour work shift

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
