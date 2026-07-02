from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_employee
from app.models.employee import Employee, EmployeeRole
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.crud import documents as crud_docs

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/compliance/expiring", response_model=List[DocumentResponse])
def get_expiring_documents(days_ahead: int = 90, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    if current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.PERSONNEL]:
        raise HTTPException(status_code=403, detail="Not authorized to view compliance dashboard")
    return crud_docs.get_expiring_documents(db, days_ahead)

@router.get("/{employee_id}", response_model=List[DocumentResponse])
def get_employee_documents(employee_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    if current_user.id != employee_id and current_user.role not in [EmployeeRole.ADMIN, EmployeeRole.PERSONNEL]:
        raise HTTPException(status_code=403, detail="Not authorized to view these documents")
    return crud_docs.get_documents_by_employee(db, employee_id)

@router.post("/", response_model=DocumentResponse)
def add_document(doc: DocumentCreate, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    if current_user.role in [EmployeeRole.ADMIN, EmployeeRole.PERSONNEL, EmployeeRole.MECHANIC]:
        raise HTTPException(status_code=403, detail="Only Pilots and Cabin Crew can manage documents")
    return crud_docs.create_document(db, current_user.id, doc)

@router.patch("/{doc_id}", response_model=DocumentResponse)
def edit_document(doc_id: int, doc_update: DocumentUpdate, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    db_doc = crud_docs.get_document(db, doc_id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.id != db_doc.employee_id and current_user.role != EmployeeRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud_docs.update_document(db, doc_id, doc_update)

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(doc_id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_employee)):
    db_doc = crud_docs.get_document(db, doc_id)
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if current_user.id != db_doc.employee_id and current_user.role != EmployeeRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    crud_docs.delete_document(db, doc_id)
