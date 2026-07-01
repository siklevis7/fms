from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Route(Base):
    """A scheduled route between two airports."""

    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    origin_code = Column(String(3), ForeignKey("airports.iata_code"), nullable=False)
    destination_code = Column(String(3), ForeignKey("airports.iata_code"), nullable=False)
    distance_km = Column(Float, nullable=False)
    base_duration_minutes = Column(Integer, nullable=False)

    origin_airport = relationship("Airport", foreign_keys=[origin_code], back_populates="origin_routes")
    destination_airport = relationship("Airport", foreign_keys=[destination_code], back_populates="destination_routes")
    flights = relationship("Flight", back_populates="route")
