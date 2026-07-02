from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── System ────────────────────────────────────────────────────────
    APP_NAME: str = "Aviation Staff Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Airline Branding (set these per deployment) ───────────────────
    # These values are served to the frontend via GET /api/v1/config
    # and drive all visible branding. Override in .env for each airline.
    AIRLINE_NAME: str = "Your Airline"
    AIRLINE_ICAO: str = "XXX"          # 2–3 letter ICAO airline designator
    AIRLINE_COUNTRY: str = "Unknown"
    AIRLINE_PRIMARY_COLOR: str = "#6366f1"   # hex, used for accent colour

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./fams.db"

    # ── JWT ───────────────────────────────────────────────────────────
    # IMPORTANT: override SECRET_KEY with a long random string in .env
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour work shift

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
