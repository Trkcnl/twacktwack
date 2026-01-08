import pytest
import json
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from api.models import ExerciseType


# 1. Create a reusable User fixture
@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="password")


# 2. Create an authenticated Client fixture
@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# 3. Create basic Exercise Types for the tests
@pytest.fixture
def bench_press(db):
    return ExerciseType.objects.create(
        name="Bench Press", muscle_group="CHEST", custom_type=False
    )


@pytest.fixture
def squat(db):
    return ExerciseType.objects.create(
        name="Squat", muscle_group="QUAD", custom_type=False
    )


@pytest.fixture
def assert_status():
    """
    A helper fixture to assert status codes with helpful error messages.
    """

    def _assert(response, expected_code):
        if response.status_code != expected_code:
            # Try to parse data, fallback to raw content if not JSON
            try:
                error_details = json.dumps(response.data, indent=2)
            except Exception:
                error_details = response.content.decode()

            pytest.fail(
                f"Expected status {expected_code}, but got {response.status_code}.\n"
                f"Response Body:\n{error_details}"
            )

    return _assert
