import enum
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class EmployeeRole(str, enum.Enum):
    ADMIN = "Admin"
    PERSONNEL = "Personnel"
    PILOT = "Pilot"
    CABIN_CREW = "CabinCrew"
    MECHANIC = "Mechanic"


class Employee(Base):
    """An aviation staff member with system login credentials."""

    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_number = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(30), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(EmployeeRole), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    crew_assignments = relationship("CrewAssignment", back_populates="employee")
    unavailability_periods = relationship("UnavailabilityPeriod", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")
