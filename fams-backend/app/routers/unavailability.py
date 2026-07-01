from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_employee
from app.models.employee import Employee, EmployeeRole
from app.schemas.unavailability import UnavailabilityCreate, UnavailabilityResponse
from app.crud import unavailability as crud_unavail

router = APIRouter(prefix="/unavailability", tags=["Unavailability"])

@router.get("/", response_model=List[UnavailabilityResponse])
def get_all_unavailability(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    return crud_unavail.get_unavailability(db)

@router.post("/", response_model=UnavailabilityResponse)
def add_unavailability(unavail: UnavailabilityCreate, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.PERSONNEL]:
        raise HTTPException(status_code=403, detail="Only Admin or Personnel can add unavailability")
    return crud_unavail.create_unavailability(db, unavail)

@router.delete("/{unavail_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_unavailability(unavail_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.PERSONNEL]:
        raise HTTPException(status_code=403, detail="Only Admin or Personnel can remove unavailability")
    
    db_unavail = crud_unavail.delete_unavailability(db, unavail_id)
    if not db_unavail:
        raise HTTPException(status_code=404, detail="Unavailability not found")
