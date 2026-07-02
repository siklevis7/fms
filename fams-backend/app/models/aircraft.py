import enum
from sqlalchemy import Column, Enum, Integer, String, SmallInteger
from sqlalchemy.orm import relationship

from app.database import Base


class AircraftStatus(str, enum.Enum):
    ACTIVE      = "Active"
    MAINTENANCE = "Maintenance"   # Scheduled / planned maintenance
    AOG         = "AOG"           # Aircraft on Ground — unscheduled grounding
    MEL         = "MEL"           # Minimum Equipment List item — limited dispatch
    RETIRED     = "Retired"


class Aircraft(Base):
    """A physical aircraft in the company fleet."""

    __tablename__ = "aircraft"

    id                  = Column(Integer, primary_key=True, index=True, autoincrement=True)
    registration_number = Column(String(20), unique=True, nullable=False, index=True)
    model               = Column(String(100), nullable=False)
    manufacturer        = Column(String(100), nullable=False)
    year_manufactured   = Column(Integer, nullable=True)
    total_seats         = Column(Integer, nullable=False)
    status              = Column(Enum(AircraftStatus), nullable=False, default=AircraftStatus.ACTIVE)

    # Minimum turnaround time in minutes (default 30 min)
    min_turnaround_minutes = Column(SmallInteger, nullable=False, default=30)

    # Free-text maintenance / MEL notes visible to OCC
    notes = Column(String(500), nullable=True)

    # Relationships
    flights = relationship("Flight", back_populates="aircraft")
