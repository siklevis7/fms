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
    
    start_7d = now - timedelta(days=7)
    start_14d = now - timedelta(days=14)
    start_28d = now - timedelta(days=28)
    start_365d = now - timedelta(days=365)
    
    assignments = db.query(CrewAssignment).join(Flight).filter(
        CrewAssignment.employee_id == employee_id,
        Flight.status.in_([
            FlightStatus.FINISHED,
            FlightStatus.DEPARTED,
            FlightStatus.AIRBORNE,
            FlightStatus.EN_ROUTE,
            FlightStatus.APPROACH,
            FlightStatus.LANDED,
            FlightStatus.GATE_ARRIVED,
        ])
    ).all()
    
    flight_hours = {"last_28d": 0.0, "last_365d": 0.0}
    duty_hours = {"last_7d": 0.0, "last_14d": 0.0, "last_28d": 0.0}
    
    for a in assignments:
        flight = a.flight
        
        # Flight Time (OFF to ON)
        off = flight.off_time or flight.scheduled_departure
        on = flight.on_time or flight.scheduled_arrival
        if off and on:
            if off.tzinfo is None: off = off.replace(tzinfo=timezone.utc)
            if on.tzinfo is None: on = on.replace(tzinfo=timezone.utc)
            
            dur_flight = max(0, (on - off).total_seconds() / 3600.0)
            if on >= start_28d: flight_hours["last_28d"] += dur_flight
            if on >= start_365d: flight_hours["last_365d"] += dur_flight
            
        # Duty / Block Time (OUT to IN)
        out_t = flight.out_time or flight.scheduled_departure
        in_t = flight.in_time or flight.scheduled_arrival
        if out_t and in_t:
            if out_t.tzinfo is None: out_t = out_t.replace(tzinfo=timezone.utc)
            if in_t.tzinfo is None: in_t = in_t.replace(tzinfo=timezone.utc)
            
            dur_duty = max(0, (in_t - out_t).total_seconds() / 3600.0)
            if in_t >= start_7d: duty_hours["last_7d"] += dur_duty
            if in_t >= start_14d: duty_hours["last_14d"] += dur_duty
            if in_t >= start_28d: duty_hours["last_28d"] += dur_duty

    # EASA Limits
    limits = {
        "flight_28d": 100.0,
        "flight_365d": 900.0,
        "duty_7d": 60.0,
        "duty_14d": 110.0,
        "duty_28d": 190.0
    }
    
    return {
        "flight_hours": {k: round(v, 1) for k, v in flight_hours.items()},
        "duty_hours": {k: round(v, 1) for k, v in duty_hours.items()},
        "limits": limits,
        "compliance": {
            "flight_28d_ok": flight_hours["last_28d"] <= limits["flight_28d"],
            "flight_365d_ok": flight_hours["last_365d"] <= limits["flight_365d"],
            "duty_7d_ok": duty_hours["last_7d"] <= limits["duty_7d"],
            "duty_14d_ok": duty_hours["last_14d"] <= limits["duty_14d"],
            "duty_28d_ok": duty_hours["last_28d"] <= limits["duty_28d"],
            "is_legal": (
                flight_hours["last_28d"] <= limits["flight_28d"] and 
                flight_hours["last_365d"] <= limits["flight_365d"] and 
                duty_hours["last_7d"] <= limits["duty_7d"] and 
                duty_hours["last_14d"] <= limits["duty_14d"] and 
                duty_hours["last_28d"] <= limits["duty_28d"]
            )
        }
    }



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
