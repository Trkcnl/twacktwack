import pytest
from api.tests.factories import MeasurementFactory, MeasurementTypeFactory


@pytest.mark.django_db
def test_create_measurement(auth_client):
    client, user = auth_client
    measurement_type = MeasurementTypeFactory()

    url = "/api/v1/measurements/"
    data = {
        "measurement_type": measurement_type.id,
        "value": "82.50",
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 201

    measurement = user.measurements.first()
    assert measurement.value == 82.50
    assert measurement.measurement_type == measurement_type


@pytest.mark.django_db
def test_user_only_sees_own_measurements(auth_client):
    client, user = auth_client

    # User's measurement
    MeasurementFactory(user=user, value="80.00")
    # Another user's measurement
    MeasurementFactory(value="90.00")  # different user

    url = "/api/v1/measurements/"
    response = client.get(url)
    assert response.status_code == 200
    # Only 1 measurement should be returned
    assert len(response.data) == 1
    assert str(response.data[0]["value"]) == "80.00"


@pytest.mark.django_db
@pytest.mark.xfail(reason="Validation is not implemented yet.")
def test_invalid_measurement_value(auth_client):
    client, user = auth_client
    measurement_type = MeasurementTypeFactory()

    url = "/api/v1/measurements/"
    # Invalid negative value
    data = {
        "measurement_type": measurement_type.id,
        "value": "-10.0",
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 400
    assert "value" in response.data
