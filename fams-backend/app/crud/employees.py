from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.employee import Employee
from app.models.flight import Flight, FlightStatus
from app.models.crew_assignment import CrewAssignment
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, ProfileUpdate
from datetime import datetime, timedelta, timezone


def get_employee(db: Session, employee_id: int) -> Employee | None:
    return db.query(Employee).filter(Employee.id == employee_id).first()


def get_employee_by_email(db: Session, email: str) -> Employee | None:
    return db.query(Employee).filter(Employee.email == email).first()


def get_employee_by_number(db: Session, employee_number: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_number == employee_number).first()


def get_employees(db: Session, skip: int = 0, limit: int = 100) -> list[Employee]:
    return db.query(Employee).offset(skip).limit(limit).all()


def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    hashed_pw = hash_password(employee.password)
    db_employee = Employee(
        employee_number=employee.employee_number,
        full_name=employee.full_name,
        email=employee.email,
        hashed_password=hashed_pw,
        role=employee.role,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


def update_employee(db: Session, employee_id: int, update: EmployeeUpdate) -> Employee | None:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_profile(db: Session, employee_id: int, update: ProfileUpdate) -> Employee | None:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = update.model_dump(exclude_unset=True)
    if "password" in update_data:
        db_employee.hashed_password = hash_password(update_data.pop("password"))
        
    for key, value in update_data.items():
        setattr(db_employee, key, value)
        
    db.commit()
    db.refresh(db_employee)
    return db_employee

def calculate_flight_hours(db: Session, employee_id: int) -> dict:
    now = datetime.now(timezone.utc)
    # Define start times for daily, weekly, monthly, yearly
    start_daily = now - timedelta(days=1)
    start_weekly = now - timedelta(days=7)
    start_monthly = now - timedelta(days=30)
    start_yearly = now - timedelta(days=365)
    
    assignments = db.query(CrewAssignment).join(Flight).filter(
        CrewAssignment.employee_id == employee_id,
        Flight.status.in_([
            FlightStatus.FINISHED,
            FlightStatus.DEPARTED,
            FlightStatus.LANDED,
        ])
    ).all()
    
    hours = {"daily": 0, "weekly": 0, "monthly": 0, "yearly": 0}
    
    for a in assignments:
        flight = a.flight
        # Use actual departure/arrival if available, else scheduled
        dep = flight.actual_departure or flight.scheduled_departure
        arr = flight.actual_arrival or flight.scheduled_arrival
        if not dep or not arr:
            continue
            
        # Ensure timezone-aware comparisons
        if dep.tzinfo is None:
            dep = dep.replace(tzinfo=timezone.utc)
        if arr.tzinfo is None:
            arr = arr.replace(tzinfo=timezone.utc)
            
        duration_hours = (arr - dep).total_seconds() / 3600.0
        
        if arr >= start_daily:
            hours["daily"] += duration_hours
        if arr >= start_weekly:
            hours["weekly"] += duration_hours
        if arr >= start_monthly:
            hours["monthly"] += duration_hours
        if arr >= start_yearly:
            hours["yearly"] += duration_hours
            
    # Round to 1 decimal place
    return {k: round(v, 1) for k, v in hours.items()}



def set_active_status(db: Session, employee_id: int, is_active: bool) -> Employee | None:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    db_employee.is_active = is_active
    db.commit()
    db.refresh(db_employee)
    return db_employee


def delete_employee(db: Session, employee_id: int) -> bool:
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return False
    db.delete(db_employee)
    db.commit()
    return True
