from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_employee, require_admin
from app.crud import routes as crud
from app.schemas.route import RouteCreate, RouteUpdate, RouteResponse

router = APIRouter(prefix="/routes", tags=["Routes"])


@router.get("/", response_model=list[RouteResponse], summary="List all routes")
def list_routes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    return crud.get_routes(db, skip=skip, limit=limit)


@router.get("/{route_id}", response_model=RouteResponse, summary="Get route by ID")
def get_route(
    route_id: int, 
    db: Session = Depends(get_db),
    _=Depends(get_current_employee)
):
    route = crud.get_route(db, route_id)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


@router.post("/", response_model=RouteResponse, status_code=status.HTTP_201_CREATED, summary="Create route (Admin only)")
def create_route(
    route: RouteCreate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    # Could add validation for airport existence here using airport crud
    return crud.create_route(db, route)


@router.patch("/{route_id}", response_model=RouteResponse, summary="Update route (Admin only)")
def update_route(
    route_id: int, 
    update: RouteUpdate, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    route = crud.update_route(db, route_id, update)
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete route (Admin only)")
def delete_route(
    route_id: int, 
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    if not crud.delete_route(db, route_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
