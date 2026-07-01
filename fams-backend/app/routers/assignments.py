from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import assignments as crud
from app.crud import flights as flight_crud
from app.crud.employees import calculate_flight_hours
from app.schemas.crew_assignment import AssignmentCreate, AssignmentUpdate, AssignmentReplace, AssignmentResponse, CrewManifestEntry
from app.models.crew_assignment import AssignmentStatus
from app.models.unavailability import UnavailabilityPeriod
from app.models.employee import EmployeeRole, Employee
from app.models.document import EmployeeDocument
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def check_employee_assignment(db: Session, employee_id: int, flight_id: int):
    flight = flight_crud.get_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
        
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Check unavailability
    f_date_start = flight.scheduled_departure.date()
    f_date_end = flight.scheduled_arrival.date()
    
    unavail = db.query(UnavailabilityPeriod).filter(
        UnavailabilityPeriod.employee_id == employee_id,
        UnavailabilityPeriod.start_date <= f_date_end,
        UnavailabilityPeriod.end_date >= f_date_start
    ).first()
    
    if unavail:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Employee is unavailable: {unavail.reason}")

    if emp.role in [EmployeeRole.PILOT, EmployeeRole.CABIN_CREW]:
        duration = (flight.scheduled_arrival - flight.scheduled_departure).total_seconds() / 3600.0
        hours = calculate_flight_hours(db, employee_id)
        
        max_d, max_w, max_m = 8, 30, 100
        max_y = 1000 if emp.role == EmployeeRole.PILOT else 900
        
        if hours["daily"] + duration > max_d:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Daily flight hour limit exceeded (Max {max_d}h)")
        if hours["weekly"] + duration > max_w:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Weekly flight hour limit exceeded (Max {max_w}h)")
        if hours["monthly"] + duration > max_m:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Monthly flight hour limit exceeded (Max {max_m}h)")
        if hours["yearly"] + duration > max_y:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Yearly flight hour limit exceeded (Max {max_y}h)")

        # Check for expired/expiring documents
        now = datetime.now(timezone.utc)
        docs = db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee_id).all()
        for d in docs:
            # expiry_date is a datetime, ensure it's timezone-aware for comparison, or if naive, compare with naive
            exp_date = d.expiry_date
            if exp_date.tzinfo is None:
                exp_date = exp_date.replace(tzinfo=timezone.utc)
            
            diff_days = (exp_date - now).days
            if diff_days <= 30:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Warning: Employee has a document ({d.document_type}) expiring soon or expired ({diff_days} days left). Cannot assign.")



@router.get("/flight/{flight_id}", response_model=list[CrewManifestEntry], summary="Crew manifest for a flight")
def get_flight_crew(
    flight_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    # Verify flight exists
    if not flight_crud.get_flight(db, flight_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    
    assignments = crud.get_assignments_for_flight(db, flight_id)
    # Map to CrewManifestEntry format
    return [
        CrewManifestEntry(
            assignment_id=a.id,
            duty_role=a.duty_role,
            status=a.status,
            employee=a.employee
        ) for a in assignments
    ]


@router.get("/{assignment_id}", response_model=AssignmentResponse, summary="Get assignment by ID (Admin only)")
def get_assignment(
    assignment_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    assignment = crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Assign crew to flight (Admin only)")
def create_assignment(
    assignment: AssignmentCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    check_employee_assignment(db, assignment.employee_id, assignment.flight_id)
    return crud.create_assignment(db, assignment)


@router.patch("/{assignment_id}", response_model=AssignmentResponse, summary="Update assignment (Admin only)")
def update_assignment(
    assignment_id: int, 
    update: AssignmentUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    assignment = crud.update_assignment(db, assignment_id, update)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment

@router.patch("/{assignment_id}/replace", response_model=AssignmentResponse, summary="Replace crew member (Admin only)")
def replace_assignment(
    assignment_id: int, 
    replace: AssignmentReplace, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    assignment = crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        
    check_employee_assignment(db, replace.new_employee_id, assignment.flight_id)
    
    assignment = crud.replace_assignment(db, assignment_id, replace.new_employee_id)
    return assignment

@router.post("/{assignment_id}/confirm", response_model=AssignmentResponse, summary="Confirm own assignment")
def confirm_assignment(
    assignment_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_employee)
):
    assignment = crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    
    if assignment.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only confirm your own assignments")
        
    update = AssignmentUpdate(status=AssignmentStatus.CONFIRMED)
    return crud.update_assignment(db, assignment_id, update)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove crew from flight (Admin only)")
def delete_assignment(
    assignment_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
