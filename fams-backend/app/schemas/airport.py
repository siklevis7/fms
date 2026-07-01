from pydantic import BaseModel, Field


class AirportCreate(BaseModel):
    icao_code: str = Field(..., min_length=4, max_length=4)
    name: str
    city: str
    country: str
    latitude: float | None = None
    longitude: float | None = None


class AirportUpdate(BaseModel):
    icao_code: str | None = Field(None, min_length=4, max_length=4)
    name: str | None = None
    city: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AirportResponse(AirportCreate):
    model_config = {"from_attributes": True}
