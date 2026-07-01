from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud import bookings as crud
from app.crud import flights as flight_crud
from app.models.booking import BookingStatus
from app.models.flight import FlightStatus
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("/", response_model=list[BookingResponse], summary="List all bookings")
def list_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_bookings(db, skip=skip, limit=limit)


@router.get("/passenger/{email}", response_model=list[BookingResponse], summary="Get all bookings for a passenger by email")
def get_passenger_bookings(email: str, db: Session = Depends(get_db)):
    return crud.get_bookings_for_passenger(db, email)


@router.get("/flight/{flight_id}", response_model=list[BookingResponse], summary="Get all bookings for a flight")
def get_flight_bookings(flight_id: int, db: Session = Depends(get_db)):
    return crud.get_bookings_for_flight(db, flight_id)


@router.get("/{booking_id}", response_model=BookingResponse, summary="Get booking by ID")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = crud.get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking ID {booking_id} not found")
    return booking


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED, summary="Book a seat on a flight")
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # Ensure the flight exists and is bookable
    flight = flight_crud.get_flight(db, booking.flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Flight ID {booking.flight_id} not found")
    if flight.status == FlightStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book a cancelled flight")

    # Check seat availability
    available = flight_crud.get_available_seats(db, booking.flight_id)
    if available <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No available seats on this flight")

    # Check if the specific seat is already taken
    if crud.is_seat_taken(db, booking.flight_id, booking.seat_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Seat {booking.seat_number} is already taken on this flight",
        )
    return crud.create_booking(db, booking)


@router.patch("/{booking_id}", response_model=BookingResponse, summary="Update booking status or seat")
def update_booking(booking_id: int, update: BookingUpdate, db: Session = Depends(get_db)):
    # If changing seat, check availability first
    if update.seat_number:
        booking = crud.get_booking(db, booking_id)
        if booking and crud.is_seat_taken(db, booking.flight_id, update.seat_number):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Seat {update.seat_number} is already taken on this flight",
            )
    result = crud.update_booking(db, booking_id, update)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking ID {booking_id} not found")
    return result


@router.post("/{booking_id}/cancel", response_model=BookingResponse, summary="Cancel a booking")
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = crud.cancel_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking ID {booking_id} not found")
    return booking
