from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.flight import Flight, FlightStatus
from app.schemas.flight import FlightCreate, FlightUpdate
from fastapi import HTTPException, status


def get_flight(db: Session, flight_id: int) -> Flight | None:
    return db.query(Flight).filter(Flight.id == flight_id).first()


def get_flight_by_number(db: Session, flight_number: str) -> Flight | None:
    return db.query(Flight).filter(Flight.flight_number == flight_number.upper()).first()


def get_flights(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    status: FlightStatus | None = None,
) -> list[Flight]:
    q = db.query(Flight)
    if status:
        q = q.filter(Flight.status == status)
    return q.order_by(Flight.scheduled_departure).offset(skip).limit(limit).all()


def create_flight(db: Session, flight: FlightCreate) -> Flight:
    data = flight.model_dump()
    data["flight_number"] = data["flight_number"].upper()
    
    # Check minimum turnaround time for this aircraft
    from app.crud.aircraft import get_aircraft
    aircraft = get_aircraft(db, flight.aircraft_id)
    if aircraft:
        # Find the previous flight for this aircraft that arrives before this one departs
        prev_flight = db.query(Flight).filter(
            Flight.aircraft_id == flight.aircraft_id,
            Flight.scheduled_arrival <= flight.scheduled_departure,
            Flight.status != FlightStatus.CANCELLED
        ).order_by(Flight.scheduled_arrival.desc()).first()
        
        if prev_flight:
            gap = (flight.scheduled_departure - prev_flight.scheduled_arrival).total_seconds() / 60
            if gap < aircraft.min_turnaround_minutes:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Turnaround time violation. Gap is {int(gap)} min, but aircraft minimum is {aircraft.min_turnaround_minutes} min."
                )

    db_flight = Flight(**data)
    db.add(db_flight)
    db.commit()
    db.refresh(db_flight)
    return db_flight


def update_flight(db: Session, flight_id: int, update: FlightUpdate) -> Flight | None:
    db_flight = get_flight(db, flight_id)
    if not db_flight:
        return None
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_flight, key, value)
    db.commit()
    db.refresh(db_flight)
    return db_flight


def cancel_flight(db: Session, flight_id: int) -> Flight | None:
    db_flight = get_flight(db, flight_id)
    if not db_flight:
        return None
    # Prevent cancelling flights that are already finished or in the air
    if db_flight.status in (FlightStatus.FINISHED, FlightStatus.DEPARTED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot cancel a flight with status '{db_flight.status.value}'"
        )
    db_flight.status = FlightStatus.CANCELLED
    db.commit()
    db.refresh(db_flight)
    return db_flight


def complete_flight(db: Session, flight_id: int, out_time: datetime, off_time: datetime, on_time: datetime, in_time: datetime, remaining_fuel: float, delay_code: str | None = None, delay_minutes: int | None = None) -> Flight | None:
    db_flight = get_flight(db, flight_id)
    if not db_flight:
        return None
    if db_flight.status == FlightStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot complete a cancelled flight")
    if db_flight.status == FlightStatus.FINISHED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Flight is already finished")

    db_flight.out_time = out_time
    db_flight.off_time = off_time
    db_flight.on_time = on_time
    db_flight.in_time = in_time
    db_flight.actual_departure = out_time
    db_flight.actual_arrival = in_time
    db_flight.remaining_fuel = remaining_fuel
    if delay_code:
        db_flight.delay_code = delay_code
        db_flight.delay_minutes = delay_minutes
    
    db_flight.status = FlightStatus.FINISHED
    db.commit()
    db.refresh(db_flight)
    return db_flight
