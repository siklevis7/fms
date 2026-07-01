from pydantic import BaseModel, Field
from app.models.crew_assignment import DutyRole, AssignmentStatus
from app.schemas.employee import EmployeeBrief
from app.schemas.flight import FlightBrief


class AssignmentCreate(BaseModel):
    flight_id: int = Field(..., gt=0)
    employee_id: int = Field(..., gt=0)
    duty_role: DutyRole
    notes: str | None = None


class AssignmentUpdate(BaseModel):
    duty_role: DutyRole | None = None
    status: AssignmentStatus | None = None
    notes: str | None = None


class AssignmentResponse(BaseModel):
    id: int
    duty_role: DutyRole
    status: AssignmentStatus
    notes: str | None = None
    flight: FlightBrief
    employee: EmployeeBrief

    model_config = {"from_attributes": True}


class CrewManifestEntry(BaseModel):
    """Used inside a flight's crew list — shows employee + duty."""
    assignment_id: int
    duty_role: DutyRole
    status: AssignmentStatus
    employee: EmployeeBrief

    model_config = {"from_attributes": True}
