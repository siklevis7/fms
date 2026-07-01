from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.config import settings
from app.database import Base, engine
import app.models  # Ensures models are registered before create_all

from app.routers import auth, employees, aircraft, airports, flights, assignments, unavailability, documents

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Internal staff management API for aviation personnel. "
        "Supports JWT authentication and Role-Based Access Control (RBAC)."
    ),
    contact={"name": "FAMS AG Admin Team"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")
app.include_router(aircraft.router, prefix="/api/v1")
app.include_router(airports.router, prefix="/api/v1")

app.include_router(flights.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(unavailability.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}


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
