from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        medical_expiry=user.medical_expiry
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_resources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Resource).offset(skip).limit(limit).all()

def create_resource(db: Session, resource: schemas.ResourceCreate):
    db_resource = models.Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def create_booking(db: Session, booking: schemas.BookingCreate):
    # Check for overlapping bookings for the resource
    overlapping = db.query(models.Booking).filter(
        models.Booking.resource_id == booking.resource_id,
        models.Booking.start_time < booking.end_time,
        models.Booking.end_time > booking.start_time
    ).first()
    
    if overlapping:
        raise ValueError(f"Resource is already booked from {overlapping.start_time} to {overlapping.end_time}")
        
    db_booking = models.Booking(**booking.model_dump())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_bookings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Booking).offset(skip).limit(limit).all()
