from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import create_access_token, verify_password
from app.database import get_db
from app.dependencies import get_current_employee
from app.models.employee import Employee
from app.crud import employees as crud
from app.schemas.employee import EmployeeResponse, PasswordChange
from app.auth import hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", summary="Login to get JWT token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    employee = crud.get_employee_by_email(db, form_data.username)
    if not employee:
        employee = crud.get_employee_by_number(db, form_data.username)
    if not employee or not verify_password(form_data.password, employee.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": str(employee.id), "role": employee.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=EmployeeResponse, summary="Get current logged-in employee profile")
def read_users_me(current_employee: Employee = Depends(get_current_employee)):
    return current_employee


@router.patch("/me/password", summary="Change own password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    if not verify_password(password_data.current_password, current_employee.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        
    current_employee.hashed_password = hash_password(password_data.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}
