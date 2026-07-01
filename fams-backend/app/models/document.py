import enum
from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class DocumentType(str, enum.Enum):
    FLIGHT_LICENSE = "FlightLicense"
    HEALTH_CERTIFICATE = "HealthCertificate"
    TYPE_RATING = "TypeRating"
    MEDICAL_CLASS_1 = "MedicalClass1"
    MEDICAL_CLASS_2 = "MedicalClass2"

class EmployeeDocument(Base):
    """Official documents and certifications tracked for pilots and cabin crew."""
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(Enum(DocumentType), nullable=False)
    reference_number = Column(String(100), nullable=True)
    issued_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    employee = relationship("Employee", back_populates="documents")
