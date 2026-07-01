from datetime import datetime, timedelta

def setup_flight(client, admin_token, pilot_id):
    # Quick setup of aircraft, airport, route to make a flight
    client.post("/api/v1/aircraft/", json={
        "registration_number": "NTEST1", "model": "Test", "manufacturer": "Test", "total_seats": 100
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    client.post("/api/v1/airports/", json={
        "iata_code": "AAA", "icao_code": "KAAA", "name": "A", "city": "A", "country": "A"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    client.post("/api/v1/airports/", json={
        "iata_code": "BBB", "icao_code": "KBBB", "name": "B", "city": "B", "country": "B"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    route = client.post("/api/v1/routes/", json={
        "origin_code": "AAA", "destination_code": "BBB", "distance_km": 100, "base_duration_minutes": 60
    }, headers={"Authorization": f"Bearer {admin_token}"}).json()
    
    now = datetime.now()
    flight = client.post("/api/v1/flights/", json={
        "flight_number": "TEST1",
        "aircraft_id": 1,
        "route_id": route["id"],
        "scheduled_departure": (now + timedelta(hours=1)).isoformat(),
        "scheduled_arrival": (now + timedelta(hours=2)).isoformat(),
    }, headers={"Authorization": f"Bearer {admin_token}"}).json()
    
    return flight["id"]


def test_assign_crew_and_read_my_flights(client, admin_token, pilot_token, test_pilot):
    flight_id = setup_flight(client, admin_token, test_pilot.id)
    
    # Admin assigns pilot
    assign_payload = {
        "flight_id": flight_id,
        "employee_id": test_pilot.id,
        "duty_role": "Captain"
    }
    resp = client.post(
        "/api/v1/assignments/",
        json=assign_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 201
    
    # Pilot checks 'my flights'
    my_flights_resp = client.get(
        "/api/v1/flights/my",
        headers={"Authorization": f"Bearer {pilot_token}"}
    )
    assert my_flights_resp.status_code == 200
    flights = my_flights_resp.json()
    assert len(flights) == 1
    assert flights[0]["id"] == flight_id
