import pytest
from api.tests.factories import (
    WorkoutLogFactory,
    ExerciseTypeFactory,
    ExerciseLogFactory,
)


@pytest.mark.django_db
def test_add_set_to_exercise(auth_client):
    client, user = auth_client

    # Create a workout and an exercise
    workout = WorkoutLogFactory(user=user)
    exercise_type = ExerciseTypeFactory()
    exercise = ExerciseLogFactory(workout_log=workout, exercise_type=exercise_type)

    url = f"/api/v1/exercises/{exercise.id}/sets/"
    data = {
        "reps": 5,
        "weight_kg": "60.00",
        "rpe": 8,
        "rir": 2,
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 201
    assert exercise.sets.count() == 1
    set_instance = exercise.sets.first()
    assert set_instance.reps == 5
    assert str(set_instance.weight_kg) == "60.00"


@pytest.mark.django_db
def test_cannot_add_set_to_other_users_exercise(auth_client):
    client, user = auth_client

    # Exercise belongs to another user
    exercise = ExerciseLogFactory()  # user is different

    url = f"/api/v1/exercises/{exercise.id}/sets/"
    data = {
        "reps": 5,
        "weight_kg": "60.00",
        "rpe": 8,
        "rir": 2,
    }

    response = client.post(url, data, format="json")
    # Should return 404, because user cannot access another user's exercise
    assert response.status_code == 404


@pytest.mark.django_db
def test_invalid_set_data(auth_client):
    client, user = auth_client

    workout = WorkoutLogFactory(user=user)
    exercise = ExerciseLogFactory(
        workout_log=workout, exercise_type=ExerciseTypeFactory()
    )

    url = f"/api/v1/exercises/{exercise.id}/sets/"
    # Invalid rpe (>10)
    data = {
        "reps": 5,
        "weight_kg": "60.00",
        "rpe": 11,
        "rir": 2,
    }

    response = client.post(url, data, format="json")
    assert response.status_code == 400
    assert "rpe" in response.data
