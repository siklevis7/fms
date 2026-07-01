from sqlalchemy.orm import Session

from app.models.aircraft import Aircraft
from app.schemas.aircraft import AircraftCreate, AircraftUpdate


def get_aircraft(db: Session, aircraft_id: int) -> Aircraft | None:
    return db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()


def get_aircraft_by_registration(db: Session, registration_number: str) -> Aircraft | None:
    return db.query(Aircraft).filter(Aircraft.registration_number == registration_number.upper()).first()


def get_all_aircraft(db: Session, skip: int = 0, limit: int = 100) -> list[Aircraft]:
    return db.query(Aircraft).offset(skip).limit(limit).all()


def create_aircraft(db: Session, aircraft: AircraftCreate) -> Aircraft:
    data = aircraft.model_dump()
    data["registration_number"] = data["registration_number"].upper()
    db_aircraft = Aircraft(**data)
    db.add(db_aircraft)
    db.commit()
    db.refresh(db_aircraft)
    return db_aircraft


def update_aircraft(db: Session, aircraft_id: int, update: AircraftUpdate) -> Aircraft | None:
    db_aircraft = get_aircraft(db, aircraft_id)
    if not db_aircraft:
        return None
    update_data = update.model_dump(exclude_unset=True)
    if "registration_number" in update_data:
        update_data["registration_number"] = update_data["registration_number"].upper()
    for key, value in update_data.items():
        setattr(db_aircraft, key, value)
    db.commit()
    db.refresh(db_aircraft)
    return db_aircraft


def delete_aircraft(db: Session, aircraft_id: int) -> bool:
    db_aircraft = get_aircraft(db, aircraft_id)
    if not db_aircraft:
        return False
    db.delete(db_aircraft)
    db.commit()
    return True
