from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import airports as crud
from app.schemas.airport import AirportCreate, AirportUpdate, AirportResponse

router = APIRouter(prefix="/airports", tags=["Airports"])


@router.get("/", response_model=list[AirportResponse], summary="List all airports")
def list_airports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    return crud.get_airports(db, skip=skip, limit=limit)


@router.get("/{iata_code}", response_model=AirportResponse, summary="Get airport by IATA")
def get_airport(
    iata_code: str, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    airport = crud.get_airport(db, iata_code)
    if not airport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")
    return airport


@router.post("/", response_model=AirportResponse, status_code=status.HTTP_201_CREATED, summary="Create airport (Admin only)")
def create_airport(
    airport: AirportCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if crud.get_airport(db, airport.iata_code):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Airport already exists")
    return crud.create_airport(db, airport)


@router.patch("/{iata_code}", response_model=AirportResponse, summary="Update airport (Admin only)")
def update_airport(
    iata_code: str, 
    update: AirportUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    airport = crud.update_airport(db, iata_code, update)
    if not airport:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")
    return airport


@router.delete("/{iata_code}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete airport (Admin only)")
def delete_airport(
    iata_code: str, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if not crud.delete_airport(db, iata_code):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Airport not found")
