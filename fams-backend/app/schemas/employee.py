from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.employee import EmployeeRole


class EmployeeCreate(BaseModel):
    employee_number: str = Field(..., description="Unique staff ID, e.g. EMP-001")
    full_name: str = Field(..., min_length=2)
    email: str = Field(..., description="Login email")
    password: str = Field(..., min_length=6, description="Initial password")
    role: EmployeeRole


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    role: EmployeeRole | None = None

class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    password: str | None = Field(None, min_length=6)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class EmployeeBrief(BaseModel):
    """Compact view — used inside assignment responses."""
    id: int
    employee_number: str
    full_name: str
    phone_number: str | None = None
    role: EmployeeRole
    is_active: bool

    model_config = {"from_attributes": True}


class EmployeeResponse(EmployeeBrief):
    """Full employee profile."""
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
