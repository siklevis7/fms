from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship

from app.database import Base


class Airport(Base):
    """An airport that can serve as origin or destination of a flight."""

    __tablename__ = "airports"

    icao_code = Column(String(4), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    origin_flights = relationship("Flight", foreign_keys="Flight.origin_airport_id", back_populates="origin_airport")
    destination_flights = relationship("Flight", foreign_keys="Flight.destination_airport_id", back_populates="destination_airport")
