def test_admin_can_create_employee(client, admin_token):
    payload = {
        "employee_number": "EMP-NEW",
        "full_name": "New Emp",
        "email": "new@test.local",
        "password": "password123",
        "role": "CabinCrew"
    }
    response = client.post(
        "/api/v1/employees/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    assert response.json()["employee_number"] == "EMP-NEW"


def test_pilot_cannot_create_employee(client, pilot_token):
    payload = {
        "employee_number": "EMP-FAIL",
        "full_name": "Fail",
        "email": "fail@test.local",
        "password": "password123",
        "role": "CabinCrew"
    }
    response = client.post(
        "/api/v1/employees/",
        json=payload,
        headers={"Authorization": f"Bearer {pilot_token}"}
    )
    assert response.status_code == 403


def test_pilot_can_list_employees(client, pilot_token):
    response = client.get(
        "/api/v1/employees/",
        headers={"Authorization": f"Bearer {pilot_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0
