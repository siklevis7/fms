from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
import enum
from .database import Base
from datetime import datetime

class RoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    DISPATCHER = "Dispatcher"
    INSTRUCTOR = "Instructor"
    STUDENT = "Student"

class ResourceTypeEnum(str, enum.Enum):
    AIRCRAFT = "Aircraft"
    SIMULATOR = "Simulator"
    CLASSROOM = "Classroom"

class BookingStatusEnum(str, enum.Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.STUDENT)
    is_active = Column(Boolean, default=True)
    medical_expiry = Column(DateTime, nullable=True)
    
    # Relationships
    instructor_bookings = relationship("Booking", foreign_keys="Booking.instructor_id", back_populates="instructor")
    student_bookings = relationship("Booking", foreign_keys="Booking.student_id", back_populates="student")

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., C172-N12345
    type = Column(Enum(ResourceTypeEnum))
    status = Column(String, default="Active") # Active, Maintenance
    
    bookings = relationship("Booking", back_populates="resource")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.SCHEDULED)
    
    # Grading / Dispatch
    instructor_notes = Column(String, nullable=True)
    grade = Column(String, nullable=True) # e.g. Pass, Fail, Exceptional
    signature_hash = Column(String, nullable=True) # For electronic sign-off
    
    resource = relationship("Resource", back_populates="bookings")
    instructor = relationship("User", foreign_keys=[instructor_id], back_populates="instructor_bookings")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_bookings")
