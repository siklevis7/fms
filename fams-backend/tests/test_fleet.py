def test_admin_can_create_aircraft(client, admin_token):
    payload = {
        "registration_number": "N12345",
        "model": "737 MAX",
        "manufacturer": "Boeing",
        "total_seats": 180,
        "status": "Active"
    }
    response = client.post(
        "/api/v1/aircraft/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    assert response.json()["registration_number"] == "N12345"


def test_pilot_cannot_create_aircraft(client, pilot_token):
    payload = {
        "registration_number": "N99999",
        "model": "737 MAX",
        "manufacturer": "Boeing",
        "total_seats": 180,
        "status": "Active"
    }
    response = client.post(
        "/api/v1/aircraft/",
        json=payload,
        headers={"Authorization": f"Bearer {pilot_token}"}
    )
    assert response.status_code == 403
