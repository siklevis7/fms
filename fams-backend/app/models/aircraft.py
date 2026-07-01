import enum
from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class AircraftStatus(str, enum.Enum):
    ACTIVE = "Active"
    MAINTENANCE = "Maintenance"
    RETIRED = "Retired"


class Aircraft(Base):
    """A physical aircraft in the company fleet."""

    __tablename__ = "aircraft"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    registration_number = Column(String(20), unique=True, nullable=False, index=True)
    model = Column(String(100), nullable=False)
    manufacturer = Column(String(100), nullable=False)
    year_manufactured = Column(Integer, nullable=True)
    total_seats = Column(Integer, nullable=False)
    status = Column(Enum(AircraftStatus), nullable=False, default=AircraftStatus.ACTIVE)
    notes = Column(String(500), nullable=True)  # e.g. maintenance notes

    # Relationships
    flights = relationship("Flight", back_populates="aircraft")
