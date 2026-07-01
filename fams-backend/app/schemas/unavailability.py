from pydantic import BaseModel, Field
from datetime import date, datetime

class UnavailabilityCreate(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    reason: str | None = None

class UnavailabilityResponse(BaseModel):
    id: int
    employee_id: int
    start_date: date
    end_date: date
    reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
