from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "fams-super-secret-key-2026-secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

from . import models, schemas, crud
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FAMS.aero API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "FAMS API is running"}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

# --- Authentication ---
@app.post("/api/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Users ---
@app.get("/api/users/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_users(db, skip=skip, limit=limit)

@app.post("/api/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

# --- Resources ---
@app.get("/api/resources/", response_model=List[schemas.ResourceResponse])
def read_resources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_resources(db, skip=skip, limit=limit)

@app.post("/api/resources/", response_model=schemas.ResourceResponse)
def create_resource(resource: schemas.ResourceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.create_resource(db=db, resource=resource)

# --- Bookings ---
@app.get("/api/bookings/", response_model=List[schemas.BookingResponse])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_bookings(db, skip=skip, limit=limit)

class SignOffData(BaseModel):
    grade: str
    instructor_notes: str
    signature_hash: str

@app.patch("/api/bookings/{booking_id}/signoff")
def sign_off_booking(booking_id: int, data: SignOffData, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = models.BookingStatusEnum.COMPLETED
    booking.grade = data.grade
    booking.instructor_notes = data.instructor_notes
    booking.signature_hash = data.signature_hash
    db.commit()
    return {"status": "success"}

@app.post("/api/bookings/", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        return crud.create_booking(db=db, booking=booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
