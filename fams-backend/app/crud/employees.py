from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


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
