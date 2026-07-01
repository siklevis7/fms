"""
seed_data.py — Populate the FMS Staff database with realistic mock data.
"""
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine, SessionLocal
from app.auth import hash_password
from app.models.employee import Employee, EmployeeRole
from app.models.aircraft import Aircraft, AircraftStatus
from app.models.airport import Airport
from app.models.route import Route
from app.models.flight import Flight, FlightStatus
from app.models.crew_assignment import CrewAssignment, DutyRole, AssignmentStatus
from app.models.unavailability import UnavailabilityPeriod
from app.models.document import EmployeeDocument, DocumentType

def seed():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Employee).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding employees...")
        employees = [
            Employee(employee_number="ADM-001", full_name="System Admin", email="admin@fams.local", hashed_password=hash_password("admin123"), role=EmployeeRole.ADMIN),
            Employee(employee_number="PER-001", full_name="HR Manager", email="hr@fams.local", hashed_password=hash_password("hr123"), role=EmployeeRole.PERSONNEL),
            Employee(employee_number="PLT-001", full_name="John Doe", email="john.doe@fams.local", hashed_password=hash_password("pilot123"), role=EmployeeRole.PILOT),
            Employee(employee_number="PLT-002", full_name="Jane Smith", email="jane.smith@fams.local", hashed_password=hash_password("pilot123"), role=EmployeeRole.PILOT),
            Employee(employee_number="CCW-001", full_name="Emily Davis", email="emily.davis@fams.local", hashed_password=hash_password("crew123"), role=EmployeeRole.CABIN_CREW),
            Employee(employee_number="MEC-001", full_name="Michael Brown", email="michael.brown@fams.local", hashed_password=hash_password("mech123"), role=EmployeeRole.MECHANIC),
        ]
        db.add_all(employees)
        db.commit()

        print("Seeding fleet...")
        fleet = [
            Aircraft(registration_number="N737FA", model="Boeing 737-800", manufacturer="Boeing", total_seats=162, status=AircraftStatus.ACTIVE),
            Aircraft(registration_number="D-AIFA", model="Airbus A380-800", manufacturer="Airbus", total_seats=555, status=AircraftStatus.ACTIVE),
        ]
        db.add_all(fleet)
        db.commit()

        print("Seeding airports & routes...")
        airports = [
            Airport(iata_code="JFK", icao_code="KJFK", name="JFK Int'l", city="New York", country="USA"),
            Airport(iata_code="LHR", icao_code="EGLL", name="Heathrow", city="London", country="UK"),
        ]
        db.add_all(airports)
        db.commit()

        routes = [
            Route(origin_code="JFK", destination_code="LHR", distance_km=5570.0, base_duration_minutes=420),
            Route(origin_code="LHR", destination_code="JFK", distance_km=5570.0, base_duration_minutes=450),
        ]
        db.add_all(routes)
        db.commit()

        print("Seeding flights...")
        now = datetime.now(timezone.utc)
        flights = [
            Flight(flight_number="FA101", aircraft_id=1, route_id=1, scheduled_departure=now + timedelta(hours=2), scheduled_arrival=now + timedelta(hours=9), status=FlightStatus.SCHEDULED),
            Flight(flight_number="FA102", aircraft_id=2, route_id=2, scheduled_departure=now + timedelta(days=1), scheduled_arrival=now + timedelta(days=1, hours=8), status=FlightStatus.SCHEDULED),
        ]
        db.add_all(flights)
        db.commit()

        print("Seeding assignments...")
        assignments = [
            CrewAssignment(flight_id=1, employee_id=2, duty_role=DutyRole.CAPTAIN, status=AssignmentStatus.CONFIRMED),
            CrewAssignment(flight_id=1, employee_id=4, duty_role=DutyRole.FLIGHT_ATTENDANT, status=AssignmentStatus.ASSIGNED),
            CrewAssignment(flight_id=1, employee_id=5, duty_role=DutyRole.LEAD_MECHANIC, status=AssignmentStatus.COMPLETED),
        ]
        db.add_all(assignments)
        db.commit()

        print("\n✅ Staff database seeded successfully!")
        print("Login with admin@fams.local / admin123")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
