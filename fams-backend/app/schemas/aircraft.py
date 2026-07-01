from pydantic import BaseModel, Field
from app.models.aircraft import AircraftStatus


class AircraftCreate(BaseModel):
    registration_number: str = Field(..., description="Tail number, e.g. D-AIFA")
    model: str = Field(..., description="e.g. Airbus A320-200")
    manufacturer: str = Field(..., description="e.g. Airbus")
    year_manufactured: int | None = Field(None, ge=1900, le=2100)
    total_seats: int = Field(..., gt=0)
    status: AircraftStatus = AircraftStatus.ACTIVE
    notes: str | None = None


class AircraftUpdate(BaseModel):
    registration_number: str | None = None
    model: str | None = None
    manufacturer: str | None = None
    year_manufactured: int | None = Field(None, ge=1900, le=2100)
    total_seats: int | None = Field(None, gt=0)
    status: AircraftStatus | None = None
    notes: str | None = None


class AircraftBrief(BaseModel):
    id: int
    registration_number: str
    model: str
    manufacturer: str
    status: AircraftStatus

    model_config = {"from_attributes": True}


class AircraftResponse(AircraftCreate):
    id: int

    model_config = {"from_attributes": True}
