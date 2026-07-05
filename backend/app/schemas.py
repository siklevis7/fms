from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from .models import RoleEnum, ResourceTypeEnum, BookingStatusEnum

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: RoleEnum = RoleEnum.STUDENT
    medical_expiry: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    name: str
    type: ResourceTypeEnum
    status: str = "Active"

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int

    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    resource_id: int
    instructor_id: Optional[int] = None
    student_id: Optional[int] = None
    start_time: datetime
    end_time: datetime

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: int
    status: BookingStatusEnum
    instructor_notes: Optional[str] = None
    grade: Optional[str] = None
    signature_hash: Optional[str] = None
    
    resource: ResourceResponse
    student: Optional[UserResponse] = None
    instructor: Optional[UserResponse] = None

    class Config:
        from_attributes = True
