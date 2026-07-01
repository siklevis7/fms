from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.auth import decode_access_token
from app.database import get_db
from app.models.employee import Employee, EmployeeRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Employee:
    """Dependency: validate JWT and return the logged-in employee."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    employee_id: int | None = payload.get("sub")
    if employee_id is None:
        raise credentials_exception

    employee = db.query(Employee).filter(Employee.id == int(employee_id)).first()
    if employee is None or not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found or deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return employee


def require_admin(current_employee: Employee = Depends(get_current_employee)) -> Employee:
    """Dependency: ensure the logged-in employee is an Admin."""
    if current_employee.role != EmployeeRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_employee
