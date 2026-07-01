from pydantic import BaseModel, Field
from datetime import date, datetime
from app.models.document import DocumentType

class DocumentCreate(BaseModel):
    document_type: DocumentType
    reference_number: str | None = None
    issued_date: date
    expiry_date: date

class DocumentUpdate(BaseModel):
    reference_number: str | None = None
    issued_date: date | None = None
    expiry_date: date | None = None

class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    document_type: DocumentType
    reference_number: str | None
    issued_date: date
    expiry_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
