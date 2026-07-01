from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import aircraft as crud
from app.schemas.aircraft import AircraftCreate, AircraftUpdate, AircraftResponse

router = APIRouter(prefix="/aircraft", tags=["Aircraft"])


@router.get("/", response_model=list[AircraftResponse], summary="List full fleet")
def list_aircraft(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    return crud.get_all_aircraft(db, skip=skip, limit=limit)


@router.get("/{aircraft_id}", response_model=AircraftResponse, summary="Get aircraft by ID")
def get_aircraft(
    aircraft_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    ac = crud.get_aircraft(db, aircraft_id)
    if not ac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    return ac


@router.post("/", response_model=AircraftResponse, status_code=status.HTTP_201_CREATED, summary="Add aircraft (Admin only)")
def create_aircraft(
    aircraft: AircraftCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if crud.get_aircraft_by_registration(db, aircraft.registration_number):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aircraft registration already exists")
    return crud.create_aircraft(db, aircraft)


@router.patch("/{aircraft_id}", response_model=AircraftResponse, summary="Update aircraft details/status (Admin only)")
def update_aircraft(
    aircraft_id: int, 
    update: AircraftUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    ac = crud.update_aircraft(db, aircraft_id, update)
    if not ac:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
    return ac


@router.delete("/{aircraft_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Retire/remove aircraft (Admin only)")
def delete_aircraft(
    aircraft_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if not crud.delete_aircraft(db, aircraft_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aircraft not found")
