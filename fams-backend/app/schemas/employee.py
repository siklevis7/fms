from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models.employee import EmployeeRole


def _validate_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit")
    return v


class EmployeeCreate(BaseModel):
    employee_number: str = Field(..., min_length=2, max_length=20, description="Unique staff ID, e.g. PLT-001")
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., description="Login email")
    password: str = Field(..., min_length=8, description="Initial password (min 8 chars, must contain a digit)")
    role: EmployeeRole

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)

    @field_validator("employee_number")
    @classmethod
    def employee_number_upper(cls, v: str) -> str:
        return v.strip().upper()


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    email: str | None = None
    phone_number: str | None = Field(None, max_length=30)
    role: EmployeeRole | None = None

class ProfileUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    email: str | None = None
    phone_number: str | None = Field(None, max_length=30)
    password: str | None = Field(None, min_length=8)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str | None) -> str | None:
        if v is not None:
            return _validate_password(v)
        return v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        return _validate_password(v)


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
