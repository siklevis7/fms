import enum
from sqlalchemy import Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class DutyRole(str, enum.Enum):
    CAPTAIN = "Captain"
    FIRST_OFFICER = "FirstOfficer"
    FLIGHT_ATTENDANT = "FlightAttendant"
    LEAD_MECHANIC = "LeadMechanic"
    MECHANIC = "Mechanic"


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "Assigned"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    REMOVED = "Removed"
    STANDBY = "Standby"


class CrewAssignment(Base):
    """Links an employee to a flight with a specific duty role."""

    __tablename__ = "crew_assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    duty_role = Column(Enum(DutyRole), nullable=False)
    status = Column(Enum(AssignmentStatus), nullable=False, default=AssignmentStatus.ASSIGNED)
    notes = Column(String(300), nullable=True)

    # Relationships
    flight = relationship("Flight", back_populates="crew_assignments")
    employee = relationship("Employee", back_populates="crew_assignments")
