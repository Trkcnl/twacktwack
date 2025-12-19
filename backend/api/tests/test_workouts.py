import pytest
from django.utils import timezone
from api.models import WorkoutLog


@pytest.mark.django_db
def test_create_workout(auth_client):
    client, user = auth_client

    response = client.post(
        "/api/v1/workouts/",
        {
            "begintime": timezone.now(),
            "endtime": timezone.now() + timezone.timedelta(hours=1),
        },
        format="json",
    )

    assert response.status_code == 201
    assert WorkoutLog.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_invalid_workout_times(auth_client):
    client, _ = auth_client

    response = client.post(
        "/api/v1/workouts/",
        {
            "begintime": timezone.now(),
            "endtime": timezone.now() - timezone.timedelta(hours=1),
        },
        format="json",
    )

    assert response.status_code == 400
