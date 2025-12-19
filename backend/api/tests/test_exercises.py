import pytest
from api.tests.factories import WorkoutLogFactory, ExerciseTypeFactory


@pytest.mark.django_db
def test_cannot_add_exercise_to_other_users_workout(auth_client):
    client, _ = auth_client

    other_workout = WorkoutLogFactory()
    exercise_type = ExerciseTypeFactory()

    response = client.post(
        f"/api/v1/workouts/{other_workout.id}/exercises/",
        {"exercise_type": exercise_type.id},
        format="json",
    )

    assert response.status_code == 404
