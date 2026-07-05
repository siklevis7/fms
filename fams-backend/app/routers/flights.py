from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import flights as crud
from app.models.employee import Employee, EmployeeRole
from app.models.flight import FlightStatus
from app.schemas.flight import FlightCreate, FlightUpdate, FlightResponse, FlightComplete

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/", response_model=list[FlightResponse], summary="List all flights")
def list_flights(
    skip: int = 0,
    limit: int = 200,
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
    # Validate airports exist
    from app.crud.airports import get_airport
    if not get_airport(db, flight.origin_airport_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Origin airport '{flight.origin_airport_id}' not found")
    if not get_airport(db, flight.destination_airport_id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Destination airport '{flight.destination_airport_id}' not found")
    if flight.origin_airport_id.upper() == flight.destination_airport_id.upper():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Origin and destination airports must differ")
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
    # crud.cancel_flight raises HTTPException if not cancelable
    flight = crud.cancel_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    return flight


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

    # Permission: Admin or assigned crew member on this flight
    if current_employee.role != EmployeeRole.ADMIN:
        from app.crud.assignments import get_assignments_for_employee
        assignments = get_assignments_for_employee(db, current_employee.id)
        if not any(a.flight_id == flight_id for a in assignments):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to complete this flight")

    return crud.complete_flight(
        db,
        flight_id,
        out_time=completion.out_time,
        off_time=completion.off_time,
        on_time=completion.on_time,
        in_time=completion.in_time,
        remaining_fuel=completion.remaining_fuel,
        delay_code=completion.delay_code,
        delay_minutes=completion.delay_minutes
    )


@router.get("/{flight_id}/readiness", summary="Check flight readiness (minimum crew complement)")
def check_flight_readiness(
    flight_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    import math
    from app.models.crew_assignment import DutyRole, AssignmentStatus
    from app.crud.assignments import get_assignments_for_flight
    
    flight = crud.get_flight(db, flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
        
    aircraft = flight.aircraft
    if not aircraft:
        return {"ready": False, "reason": "No aircraft assigned"}
        
    assignments = get_assignments_for_flight(db, flight_id)
    active_assignments = [a for a in assignments if a.status != AssignmentStatus.REMOVED and a.status != AssignmentStatus.STANDBY]
    
    captains = sum(1 for a in active_assignments if a.duty_role == DutyRole.CAPTAIN)
    first_officers = sum(1 for a in active_assignments if a.duty_role == DutyRole.FIRST_OFFICER)
    flight_attendants = sum(1 for a in active_assignments if a.duty_role == DutyRole.FLIGHT_ATTENDANT)
    
    # Rules
    pilots_ready = captains >= 1 and (captains + first_officers) >= 2
    required_fa = math.ceil(aircraft.total_seats / 50.0)
    fa_ready = flight_attendants >= required_fa
    
    reasons = []
    if not pilots_ready:
        reasons.append(f"Need at least 1 Captain and 2 total pilots (have {captains} CPT, {first_officers} FO)")
    if not fa_ready:
        reasons.append(f"Need at least {required_fa} Flight Attendants for {aircraft.total_seats} seats (have {flight_attendants})")
        
    return {
        "ready": pilots_ready and fa_ready,
        "reasons": reasons,
        "crew_counts": {
            "captains": captains,
            "first_officers": first_officers,
            "flight_attendants": flight_attendants,
            "required_flight_attendants": required_fa
        }
    }
