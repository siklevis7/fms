import enum
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class FlightStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    BOARDING = "Boarding"
    DEPARTED = "Departed"
    DELAYED = "Delayed"
    LANDED = "Landed"
    CANCELLED = "Cancelled"
    FINISHED = "Finished"


class Flight(Base):
    """A scheduled flight instance operated by a specific aircraft between airports."""

    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_number = Column(String(10), unique=True, nullable=False, index=True)
    aircraft_id = Column(Integer, ForeignKey("aircraft.id"), nullable=False)
    
    origin_airport_id = Column(String(4), ForeignKey("airports.icao_code"), nullable=False)
    destination_airport_id = Column(String(4), ForeignKey("airports.icao_code"), nullable=False)

    scheduled_departure = Column(DateTime, nullable=False)
    scheduled_arrival = Column(DateTime, nullable=False)
    actual_departure = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)

    remaining_fuel = Column(Float, nullable=True)
    status = Column(Enum(FlightStatus), nullable=False, default=FlightStatus.SCHEDULED)
    notes = Column(String(500), nullable=True)

    # Relationships
    aircraft = relationship("Aircraft", back_populates="flights")
    origin_airport = relationship("Airport", foreign_keys=[origin_airport_id], back_populates="origin_flights")
    destination_airport = relationship("Airport", foreign_keys=[destination_airport_id], back_populates="destination_flights")
    crew_assignments = relationship("CrewAssignment", back_populates="flight", cascade="all, delete-orphan")
