from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.models.flight import FlightStatus
from app.schemas.aircraft import AircraftBrief
from app.schemas.airport import AirportResponse


class FlightCreate(BaseModel):
    flight_number: str = Field(..., description="e.g. FA201")
    aircraft_id: int = Field(..., gt=0)
    origin_airport_id: str = Field(..., description="ICAO code of origin")
    destination_airport_id: str = Field(..., description="ICAO code of destination")
    scheduled_departure: datetime
    scheduled_arrival: datetime
    status: FlightStatus = FlightStatus.SCHEDULED
    notes: str | None = None

    @model_validator(mode="after")
    def arrival_after_departure(self) -> "FlightCreate":
        if self.scheduled_arrival <= self.scheduled_departure:
            raise ValueError("scheduled_arrival must be after scheduled_departure")
        return self


class FlightUpdate(BaseModel):
    status: FlightStatus | None = None
    scheduled_departure: datetime | None = None
    scheduled_arrival: datetime | None = None
    actual_departure: datetime | None = None
    actual_arrival: datetime | None = None
    remaining_fuel: float | None = None
    notes: str | None = None


class FlightComplete(BaseModel):
    actual_departure: datetime
    actual_arrival: datetime
    remaining_fuel: float


class FlightBrief(BaseModel):
    """Compact view for embedding inside aircraft or assignment responses."""
    id: int
    flight_number: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    status: FlightStatus

    model_config = {"from_attributes": True}


class FlightResponse(FlightCreate):
    """Full flight detail including aircraft and airport info."""
    id: int
    actual_departure: datetime | None = None
    actual_arrival: datetime | None = None
    remaining_fuel: float | None = None
    aircraft: AircraftBrief
    origin_airport: AirportResponse
    destination_airport: AirportResponse

    model_config = {"from_attributes": True}
