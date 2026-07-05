from datetime import datetime, timedelta
from app.database import SessionLocal
from app import crud, schemas, models

db = SessionLocal()
# Create admin if not exists
admin = crud.get_user_by_email(db, "admin@fams.aero")
if not admin:
    user_in = schemas.UserCreate(
        full_name="System Admin",
        email="admin@fams.aero",
        password="password123",
        role=models.RoleEnum.ADMIN,
        medical_expiry=None
    )
    admin = crud.create_user(db, user_in)
    print("Admin user created: admin@fams.aero")
else:
    print("Admin user already exists")

# Create an Instructor
instructor = crud.get_user_by_email(db, "instructor@fams.aero")
if not instructor:
    inst_in = schemas.UserCreate(full_name="Capt. John Smith", email="instructor@fams.aero", password="password123", role=models.RoleEnum.INSTRUCTOR)
    instructor = crud.create_user(db, inst_in)

# Create a Student
student = crud.get_user_by_email(db, "student@fams.aero")
if not student:
    stu_in = schemas.UserCreate(full_name="Jane Doe", email="student@fams.aero", password="password123", role=models.RoleEnum.STUDENT)
    student = crud.create_user(db, stu_in)

# Create Resources (Aircraft/Simulators)
resources = db.query(models.Resource).all()
if not resources:
    res1 = crud.create_resource(db, schemas.ResourceCreate(name="C172-N12345", type=models.ResourceTypeEnum.AIRCRAFT, status="Active"))
    res2 = crud.create_resource(db, schemas.ResourceCreate(name="C172-N98765", type=models.ResourceTypeEnum.AIRCRAFT, status="Active"))
    res3 = crud.create_resource(db, schemas.ResourceCreate(name="SIM-ALSIM", type=models.ResourceTypeEnum.SIMULATOR, status="Active"))
    print("Resources created.")
else:
    res1 = resources[0]

# Create Bookings
bookings = db.query(models.Booking).all()
if not bookings:
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    crud.create_booking(db, schemas.BookingCreate(
        resource_id=res1.id,
        instructor_id=instructor.id,
        student_id=student.id,
        start_time=now + timedelta(hours=1),
        end_time=now + timedelta(hours=3),
        status=models.BookingStatusEnum.SCHEDULED
    ))
    crud.create_booking(db, schemas.BookingCreate(
        resource_id=res1.id,
        instructor_id=instructor.id,
        student_id=student.id,
        start_time=now + timedelta(hours=4),
        end_time=now + timedelta(hours=6),
        status=models.BookingStatusEnum.SCHEDULED
    ))
    print("Bookings seeded.")

