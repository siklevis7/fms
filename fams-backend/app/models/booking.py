import enum
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class BookingStatus(str, enum.Enum):
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    CHECKED_IN = "CheckedIn"


class Booking(Base):
    """Represents a passenger booking on a specific flight."""

    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_id = Column(Integer, ForeignKey("flights.id"), nullable=False)
    passenger_name = Column(String(150), nullable=False)
    passenger_email = Column(String(255), nullable=False, index=True)
    seat_number = Column(String(5), nullable=False)   # e.g. "12A"
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.CONFIRMED)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    flight = relationship("Flight", back_populates="bookings")
