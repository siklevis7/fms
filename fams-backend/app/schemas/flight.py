from datetime import datetime
from typing import Optional
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
    # Legacy fields
    actual_departure: datetime | None = None
    actual_arrival: datetime | None = None
    # OOOI fields
    out_time: datetime | None = None
    off_time: datetime | None = None
    on_time: datetime | None = None
    in_time: datetime | None = None
    # Delay
    delay_code: str | None = Field(None, max_length=2, description="IATA 2-digit delay code")
    delay_minutes: int | None = Field(None, ge=0)
    remaining_fuel: float | None = None
    notes: str | None = None


class FlightComplete(BaseModel):
    """Used by crew/admin to close out a completed flight with OOOI actuals."""
    # OOOI timestamps
    out_time: datetime = Field(..., description="Actual pushback (OUT)")
    off_time: datetime = Field(..., description="Actual takeoff (OFF)")
    on_time: datetime  = Field(..., description="Actual landing (ON)")
    in_time: datetime  = Field(..., description="Actual gate arrival (IN)")
    # Aliases kept for backwards compatibility
    actual_departure: datetime | None = None  # overridden by out_time if not set
    actual_arrival: datetime | None = None    # overridden by in_time if not set
    remaining_fuel: float
    delay_code: str | None = Field(None, max_length=2, description="IATA 2-digit delay code (required if delayed)")
    delay_minutes: int | None = Field(None, ge=0)

    @model_validator(mode="after")
    def validate_oooi_sequence(self) -> "FlightComplete":
        times = [self.out_time, self.off_time, self.on_time, self.in_time]
        labels = ["OUT (pushback)", "OFF (takeoff)", "ON (landing)", "IN (gate arrival)"]
        for i in range(len(times) - 1):
            if times[i] and times[i + 1] and times[i + 1] <= times[i]:
                raise ValueError(f"{labels[i + 1]} must be after {labels[i]}")
        return self


class FlightBrief(BaseModel):
    """Compact view for embedding inside aircraft or assignment responses."""
    id: int
    flight_number: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    status: FlightStatus

    model_config = {"from_attributes": True}


class FlightResponse(BaseModel):
    """Full flight detail including aircraft and airport info."""
    id: int
    flight_number: str
    aircraft_id: int
    origin_airport_id: str
    destination_airport_id: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    # OOOI
    out_time: datetime | None = None
    off_time: datetime | None = None
    on_time: datetime | None = None
    in_time: datetime | None = None
    # Legacy
    actual_departure: datetime | None = None
    actual_arrival: datetime | None = None
    # Delay
    delay_code: str | None = None
    delay_minutes: int | None = None
    # Post-flight
    remaining_fuel: float | None = None
    status: FlightStatus
    notes: str | None = None
    aircraft: AircraftBrief
    origin_airport: AirportResponse
    destination_airport: AirportResponse

    model_config = {"from_attributes": True}
