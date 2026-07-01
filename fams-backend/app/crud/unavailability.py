from sqlalchemy.orm import Session
from app.models.unavailability import UnavailabilityPeriod
from app.schemas.unavailability import UnavailabilityCreate

def get_unavailability(db: Session, skip: int = 0, limit: int = 100):
    return db.query(UnavailabilityPeriod).offset(skip).limit(limit).all()

def get_unavailability_by_employee(db: Session, employee_id: int):
    return db.query(UnavailabilityPeriod).filter(UnavailabilityPeriod.employee_id == employee_id).all()

def create_unavailability(db: Session, unavail: UnavailabilityCreate):
    db_unavail = UnavailabilityPeriod(**unavail.model_dump())
    db.add(db_unavail)
    db.commit()
    db.refresh(db_unavail)
    return db_unavail

def delete_unavailability(db: Session, unavail_id: int):
    db_unavail = db.query(UnavailabilityPeriod).filter(UnavailabilityPeriod.id == unavail_id).first()
    if db_unavail:
        db.delete(db_unavail)
        db.commit()
    return db_unavail
