"""
conftest.py — Shared pytest fixtures for FAMS backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.auth import hash_password
from app import models  # Ensures all ORM models are registered without shadowing `app`
from app.models.employee import Employee, EmployeeRole

TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def test_admin(db_session):
    admin = Employee(
        employee_number="ADM-TEST",
        full_name="Test Admin",
        email="admin@test.local",
        hashed_password=hash_password("admin123"),
        role=EmployeeRole.ADMIN
    )
    db_session.add(admin)
    db_session.commit()
    return admin

@pytest.fixture
def test_pilot(db_session):
    pilot = Employee(
        employee_number="PLT-TEST",
        full_name="Test Pilot",
        email="pilot@test.local",
        hashed_password=hash_password("pilot123"),
        role=EmployeeRole.PILOT
    )
    db_session.add(pilot)
    db_session.commit()
    return pilot

@pytest.fixture
def admin_token(client, test_admin):
    response = client.post("/api/v1/auth/login", data={"username": test_admin.email, "password": "admin123"})
    return response.json()["access_token"]

@pytest.fixture
def pilot_token(client, test_pilot):
    response = client.post("/api/v1/auth/login", data={"username": test_pilot.email, "password": "pilot123"})
    return response.json()["access_token"]
