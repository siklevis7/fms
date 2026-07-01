def test_login_success(client, test_admin):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.local", "password": "admin123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client, test_admin):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.local", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_me(client, admin_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.local"
    assert response.json()["role"] == "Admin"


def test_unauthorized_access(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
