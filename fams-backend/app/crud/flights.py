from sqlalchemy.orm import Session

from app.models.flight import Flight, FlightStatus
from app.schemas.flight import FlightCreate, FlightUpdate


def get_flight(db: Session, flight_id: int) -> Flight | None:
    return db.query(Flight).filter(Flight.id == flight_id).first()


def get_flight_by_number(db: Session, flight_number: str) -> Flight | None:
    return db.query(Flight).filter(Flight.flight_number == flight_number.upper()).first()


def get_flights(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: FlightStatus | None = None,
) -> list[Flight]:
    q = db.query(Flight)
    if status:
        q = q.filter(Flight.status == status)
    return q.offset(skip).limit(limit).all()


def create_flight(db: Session, flight: FlightCreate) -> Flight:
    data = flight.model_dump()
    data["flight_number"] = data["flight_number"].upper()
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
    db_flight.status = FlightStatus.CANCELLED
    # The new requirements say "Employee-only system". 
    # Crew assignments might be left as-is for records, or marked as 'Removed'
    # Let's keep the assignments but they belong to a CANCELLED flight.
    db.commit()
    db.refresh(db_flight)
    return db_flight
