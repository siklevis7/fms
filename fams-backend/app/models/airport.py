from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship

from app.database import Base


class Airport(Base):
    """An airport that can serve as origin or destination of a route."""

    __tablename__ = "airports"

    iata_code = Column(String(3), primary_key=True, index=True)
    icao_code = Column(String(4), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    origin_routes = relationship("Route", foreign_keys="Route.origin_code", back_populates="origin_airport")
    destination_routes = relationship("Route", foreign_keys="Route.destination_code", back_populates="destination_airport")
