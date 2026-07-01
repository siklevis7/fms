from sqlalchemy.orm import Session

from app.models.crew_assignment import CrewAssignment
from app.schemas.crew_assignment import AssignmentCreate, AssignmentUpdate


def get_assignment(db: Session, assignment_id: int) -> CrewAssignment | None:
    return db.query(CrewAssignment).filter(CrewAssignment.id == assignment_id).first()


def get_assignments_for_flight(db: Session, flight_id: int) -> list[CrewAssignment]:
    return db.query(CrewAssignment).filter(CrewAssignment.flight_id == flight_id).all()


def get_assignments_for_employee(db: Session, employee_id: int) -> list[CrewAssignment]:
    return db.query(CrewAssignment).filter(CrewAssignment.employee_id == employee_id).all()


def create_assignment(db: Session, assignment: AssignmentCreate) -> CrewAssignment:
    db_assignment = CrewAssignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def update_assignment(db: Session, assignment_id: int, update: AssignmentUpdate) -> CrewAssignment | None:
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return None
    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def replace_assignment(db: Session, assignment_id: int, new_employee_id: int) -> CrewAssignment | None:
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return None
    from app.models.crew_assignment import AssignmentStatus
    db_assignment.employee_id = new_employee_id
    db_assignment.status = AssignmentStatus.ASSIGNED
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def delete_assignment(db: Session, assignment_id: int) -> bool:
    db_assignment = get_assignment(db, assignment_id)
    if not db_assignment:
        return False
    db.delete(db_assignment)
    db.commit()
    return True
