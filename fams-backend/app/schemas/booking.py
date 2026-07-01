from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.booking import BookingStatus


class BookingBase(BaseModel):
    flight_id: int = Field(..., gt=0)
    passenger_name: str = Field(..., min_length=2, description="Full name of the passenger")
    passenger_email: str = Field(..., description="Passenger contact email")
    seat_number: str = Field(..., description="Seat number (e.g. 12A)")


class BookingCreate(BookingBase):
    """Schema for creating a new booking."""
    pass


class BookingUpdate(BaseModel):
    """Schema for updating a booking (e.g. cancellation or check-in)."""
    status: BookingStatus | None = None
    seat_number: str | None = None


class BookingResponse(BookingBase):
    """Schema for booking data returned in API responses."""
    id: int
    status: BookingStatus
    created_at: datetime

    model_config = {"from_attributes": True}
