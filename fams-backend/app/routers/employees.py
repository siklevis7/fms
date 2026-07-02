from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.models.employee import Employee
from app.crud import employees as crud
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, ProfileUpdate

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("/", response_model=list[EmployeeResponse], summary="List all employees (Admin only)")
def list_employees(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    return crud.get_employees(db, skip=skip, limit=limit)


@router.patch("/me/profile", response_model=EmployeeResponse, summary="Update own profile")
def update_own_profile(
    update: ProfileUpdate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_employee)
):
    employee = crud.update_profile(db, current_user.id, update)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse, summary="Get employee by ID")
def get_employee(
    employee_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    employee = crud.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.get("/{employee_id}/hours", summary="Get flight hours summary")
def get_flight_hours(
    employee_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    # Verify employee exists
    employee = crud.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return crud.calculate_flight_hours(db, employee_id)


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED, summary="Create a new employee (Admin only)")
def create_employee(
    employee: EmployeeCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if crud.get_employee_by_email(db, employee.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if crud.get_employee_by_number(db, employee.employee_number):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee number already exists")
    
    return crud.create_employee(db, employee)


@router.patch("/{employee_id}", response_model=EmployeeResponse, summary="Update employee info (Admin only)")
def update_employee(
    employee_id: int, 
    update: EmployeeUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    employee = crud.update_employee(db, employee_id, update)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.post("/{employee_id}/activate", response_model=EmployeeResponse, summary="Activate employee access (Admin only)")
def activate_employee(
    employee_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    employee = crud.set_active_status(db, employee_id, True)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.post("/{employee_id}/deactivate", response_model=EmployeeResponse, summary="Deactivate employee access (Admin only)")
def deactivate_employee(
    employee_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    employee = crud.set_active_status(db, employee_id, False)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete employee (Admin only)")
def delete_employee(
    employee_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    deleted = crud.delete_employee(db, employee_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
