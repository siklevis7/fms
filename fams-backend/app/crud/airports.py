from sqlalchemy.orm import Session

from app.models.airport import Airport
from app.schemas.airport import AirportCreate, AirportUpdate


def get_airport(db: Session, iata_code: str) -> Airport | None:
    return db.query(Airport).filter(Airport.iata_code == iata_code.upper()).first()


def get_airports(db: Session, skip: int = 0, limit: int = 100) -> list[Airport]:
    return db.query(Airport).offset(skip).limit(limit).all()


def create_airport(db: Session, airport: AirportCreate) -> Airport:
    db_airport = Airport(**airport.model_dump())
    db_airport.iata_code = db_airport.iata_code.upper()
    db_airport.icao_code = db_airport.icao_code.upper()
    db.add(db_airport)
    db.commit()
    db.refresh(db_airport)
    return db_airport


def update_airport(db: Session, iata_code: str, update: AirportUpdate) -> Airport | None:
    db_airport = get_airport(db, iata_code)
    if not db_airport:
        return None
    update_data = update.model_dump(exclude_unset=True)
    if "icao_code" in update_data:
        update_data["icao_code"] = update_data["icao_code"].upper()
    for key, value in update_data.items():
        setattr(db_airport, key, value)
    db.commit()
    db.refresh(db_airport)
    return db_airport


def delete_airport(db: Session, iata_code: str) -> bool:
    db_airport = get_airport(db, iata_code)
    if not db_airport:
        return False
    db.delete(db_airport)
    db.commit()
    return True
