from sqlalchemy.orm import Session
from app.models.document import EmployeeDocument
from app.schemas.document import DocumentCreate, DocumentUpdate

def get_documents_by_employee(db: Session, employee_id: int):
    return db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee_id).all()

def get_document(db: Session, doc_id: int):
    return db.query(EmployeeDocument).filter(EmployeeDocument.id == doc_id).first()

def create_document(db: Session, employee_id: int, doc: DocumentCreate):
    db_doc = EmployeeDocument(**doc.model_dump(), employee_id=employee_id)
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def update_document(db: Session, doc_id: int, doc: DocumentUpdate):
    db_doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == doc_id).first()
    if not db_doc:
        return None
    for key, value in doc.model_dump(exclude_unset=True).items():
        setattr(db_doc, key, value)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def delete_document(db: Session, doc_id: int):
    db_doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == doc_id).first()
    if db_doc:
        db.delete(db_doc)
        db.commit()
    return db_doc

def get_expiring_documents(db: Session, days_ahead: int = 90):
    from datetime import datetime, timedelta
    cutoff_date = datetime.now().date() + timedelta(days=days_ahead)
    return db.query(EmployeeDocument).filter(
        EmployeeDocument.expiry_date <= cutoff_date
    ).order_by(EmployeeDocument.expiry_date.asc()).all()
