from pydantic import BaseModel, Field, model_validator
from app.schemas.airport import AirportResponse


class RouteCreate(BaseModel):
    origin_code: str = Field(..., min_length=3, max_length=3)
    destination_code: str = Field(..., min_length=3, max_length=3)
    distance_km: float = Field(..., gt=0)
    base_duration_minutes: int = Field(..., gt=0)

    @model_validator(mode="after")
    def different_airports(self) -> "RouteCreate":
        if self.origin_code.upper() == self.destination_code.upper():
            raise ValueError("Origin and destination must differ")
        return self


class RouteUpdate(BaseModel):
    distance_km: float | None = Field(None, gt=0)
    base_duration_minutes: int | None = Field(None, gt=0)


class RouteResponse(RouteCreate):
    id: int
    origin_airport: AirportResponse
    destination_airport: AirportResponse

    model_config = {"from_attributes": True}
