from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingUpdate


def get_booking(db: Session, booking_id: int) -> Booking | None:
    return db.query(Booking).filter(Booking.id == booking_id).first()


def get_bookings(db: Session, skip: int = 0, limit: int = 100) -> list[Booking]:
    return db.query(Booking).offset(skip).limit(limit).all()


def get_bookings_for_flight(db: Session, flight_id: int) -> list[Booking]:
    return db.query(Booking).filter(Booking.flight_id == flight_id).all()


def get_bookings_for_passenger(db: Session, email: str) -> list[Booking]:
    return db.query(Booking).filter(Booking.passenger_email == email).all()


def is_seat_taken(db: Session, flight_id: int, seat_number: str) -> bool:
    """Check if a seat is already booked on a specific flight."""
    return db.query(Booking).filter(
        Booking.flight_id == flight_id,
        Booking.seat_number == seat_number.upper(),
        Booking.status != BookingStatus.CANCELLED,
    ).first() is not None


def create_booking(db: Session, booking: BookingCreate) -> Booking:
    data = booking.model_dump()
    data["seat_number"] = data["seat_number"].upper()
    db_booking = Booking(**data)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


def update_booking(db: Session, booking_id: int, update: BookingUpdate) -> Booking | None:
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        return None
    update_data = update.model_dump(exclude_unset=True)
    if "seat_number" in update_data:
        update_data["seat_number"] = update_data["seat_number"].upper()
    for key, value in update_data.items():
        setattr(db_booking, key, value)
    db.commit()
    db.refresh(db_booking)
    return db_booking


def cancel_booking(db: Session, booking_id: int) -> Booking | None:
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        return None
    db_booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(db_booking)
    return db_booking
