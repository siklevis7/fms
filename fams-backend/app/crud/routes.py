from sqlalchemy.orm import Session

from app.models.route import Route
from app.schemas.route import RouteCreate, RouteUpdate


def get_route(db: Session, route_id: int) -> Route | None:
    return db.query(Route).filter(Route.id == route_id).first()


def get_routes(db: Session, skip: int = 0, limit: int = 100) -> list[Route]:
    return db.query(Route).offset(skip).limit(limit).all()


def create_route(db: Session, route: RouteCreate) -> Route:
    data = route.model_dump()
    data["origin_code"] = data["origin_code"].upper()
    data["destination_code"] = data["destination_code"].upper()
    db_route = Route(**data)
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


def update_route(db: Session, route_id: int, update: RouteUpdate) -> Route | None:
    db_route = get_route(db, route_id)
    if not db_route:
        return None
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_route, key, value)
    db.commit()
    db.refresh(db_route)
    return db_route


def delete_route(db: Session, route_id: int) -> bool:
    db_route = get_route(db, route_id)
    if not db_route:
        return False
    db.delete(db_route)
    db.commit()
    return True
