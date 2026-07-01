from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import flights as crud
from app.models.employee import Employee
from app.models.flight import FlightStatus
from app.schemas.flight import FlightCreate, FlightUpdate, FlightResponse

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/", response_model=list[FlightResponse], summary="List all flights")
def list_flights(
    skip: int = 0, 
    limit: int = 100, 
    status_filter: FlightStatus | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    return crud.get_flights(db, skip=skip, limit=limit, status=status_filter)


@router.get("/my", response_model=list[FlightResponse], summary="Get flights I am assigned to")
def list_my_flights(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    from app.crud.assignments import get_assignments_for_employee
    assignments = get_assignments_for_employee(db, current_employee.id)
    return [a.flight for a in assignments]


@router.get("/{flight_id}", response_model=FlightResponse, summary="Get flight by ID")
def get_flight(
    flight_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    flight = crud.get_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    return flight


@router.post("/", response_model=FlightResponse, status_code=status.HTTP_201_CREATED, summary="Schedule flight (Admin only)")
def create_flight(
    flight: FlightCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if crud.get_flight_by_number(db, flight.flight_number):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Flight number already exists")
    return crud.create_flight(db, flight)


@router.patch("/{flight_id}", response_model=FlightResponse, summary="Update flight status/times (Admin only)")
def update_flight(
    flight_id: int, 
    update: FlightUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    flight = crud.update_flight(db, flight_id, update)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    return flight


@router.post("/{flight_id}/cancel", response_model=FlightResponse, summary="Cancel flight (Admin only)")
def cancel_flight(
    flight_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    flight = crud.cancel_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    return flight

from app.schemas.flight import FlightComplete
from app.models.employee import EmployeeRole

@router.post("/{flight_id}/complete", response_model=FlightResponse, summary="Complete a flight (Admin or Assigned Crew)")
def complete_flight(
    flight_id: int, 
    completion: FlightComplete, 
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    flight = crud.get_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
        
    # Permission check: Admin or assigned to this flight
    if current_employee.role != EmployeeRole.ADMIN:
        from app.crud.assignments import get_assignments_for_employee
        assignments = get_assignments_for_employee(db, current_employee.id)
        if not any(a.flight_id == flight_id for a in assignments):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to complete this flight")

    update_data = FlightUpdate(
        status=FlightStatus.FINISHED,
        actual_departure=completion.actual_departure,
        actual_arrival=completion.actual_arrival,
        remaining_fuel=completion.remaining_fuel
    )
    
    updated_flight = crud.update_flight(db, flight_id, update_data)
    return updated_flight

