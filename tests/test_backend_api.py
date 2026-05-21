def test_root_redirects_to_static_index(client):
    # Arrange
    request_path = "/"

    # Act
    response = client.get(request_path, follow_redirects=False)

    # Assert
    assert response.status_code in (307, 302)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_expected_shape(client):
    # Arrange
    request_path = "/activities"

    # Act
    response = client.get(request_path)
    payload = response.json()

    # Assert
    assert response.status_code == 200
    assert isinstance(payload, dict)
    assert "Chess Club" in payload
    assert "participants" in payload["Chess Club"]


def test_signup_success_adds_participant(client):
    # Arrange
    email = "new.student@mergington.edu"
    request_path = f"/activities/Chess Club/signup?email={email}"

    # Act
    response = client.post(request_path)
    activities = client.get("/activities").json()

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for Chess Club"
    assert email in activities["Chess Club"]["participants"]


def test_signup_duplicate_returns_400(client):
    # Arrange
    email = "michael@mergington.edu"
    request_path = f"/activities/Chess Club/signup?email={email}"

    # Act
    response = client.post(request_path)

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_unknown_activity_returns_404(client):
    # Arrange
    request_path = "/activities/Nonexistent Club/signup?email=test@mergington.edu"

    # Act
    response = client.post(request_path)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_success_removes_participant(client):
    # Arrange
    email = "michael@mergington.edu"
    request_path = f"/activities/Chess Club/signup?email={email}"

    # Act
    response = client.delete(request_path)
    activities = client.get("/activities").json()

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from Chess Club"
    assert email not in activities["Chess Club"]["participants"]


def test_unregister_unknown_activity_returns_404(client):
    # Arrange
    request_path = "/activities/Nonexistent Club/signup?email=test@mergington.edu"

    # Act
    response = client.delete(request_path)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_missing_participant_returns_404(client):
    # Arrange
    request_path = "/activities/Chess Club/signup?email=not.registered@mergington.edu"

    # Act
    response = client.delete(request_path)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"
