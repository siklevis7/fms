from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.config import settings
from app.database import Base, engine
import app.models  # Ensures models are registered before create_all

from app.routers import auth, employees, aircraft, airports, flights, assignments, unavailability, documents

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=f"{settings.AIRLINE_NAME} — Staff Management System",
    version=settings.APP_VERSION,
    description=(
        "Internal staff management API for aviation personnel. "
        "Supports JWT authentication and Role-Based Access Control (RBAC)."
    ),
    contact={"name": f"{settings.AIRLINE_NAME} Admin Team"},
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"], # Restrict to safe origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(aircraft.router, prefix="/api/v1")
app.include_router(airports.router, prefix="/api/v1")

app.include_router(flights.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(unavailability.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")


@app.get("/api/v1/config", tags=["Config"], summary="Public airline branding config (no auth required)")
def get_public_config():
    """Returns airline branding and configuration for the frontend. No authentication required."""
    return {
        "airline_name": settings.AIRLINE_NAME,
        "airline_icao": settings.AIRLINE_ICAO,
        "airline_country": settings.AIRLINE_COUNTRY,
        "airline_primary_color": settings.AIRLINE_PRIMARY_COLOR,
        "app_version": settings.APP_VERSION,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "airline": settings.AIRLINE_NAME, "version": settings.APP_VERSION}


from sqlalchemy.exc import IntegrityError
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Database integrity error. A record with this unique value already exists."}
    )

# Mount the static frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")
