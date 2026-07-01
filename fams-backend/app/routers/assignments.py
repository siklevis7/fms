from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import assignments as crud
from app.crud import flights as flight_crud
from app.schemas.crew_assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse, CrewManifestEntry

router = APIRouter(prefix="/assignments", tags=["Assignments"])


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
    # Could validate flight and employee existence here
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


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove crew from flight (Admin only)")
def delete_assignment(
    assignment_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if not crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
