import pytest
from django.urls import reverse
from api.models import WorkoutLog, ExerciseLog, ExerciseSet
from datetime import datetime, timedelta, timezone


@pytest.mark.django_db
def test_nested_workout_update_logic(
    api_client, user, bench_press, squat, assert_status
):
    """
    CRITICAL TEST: Verifies that the serializer correctly synchronizes
    nested data. We will:
    1. CREATE a workout with Bench Press (2 sets).
    2. UPDATE the workout:
       - DELETE the 2nd set of Bench Press.
       - UPDATE the 1st set of Bench Press (change weight).
       - CREATE a new exercise (Squat) with 1 new set.
    """

    # --- STEP 1: INITIAL SETUP (CREATE) ---
    workout = WorkoutLog.objects.create(
        user=user,
        begintime=datetime.now(tz=timezone.utc),
        endtime=datetime.now(tz=timezone.utc) + timedelta(hours=1),
    )

    # Create Bench Press Log
    bench_log = ExerciseLog.objects.create(
        workout_log=workout, exercise_type=bench_press
    )

    # Create 2 Sets
    set_1 = ExerciseSet.objects.create(
        exercise_log=bench_log, reps=10, weight_kg=100, rir=2
    )
    ExerciseSet.objects.create(exercise_log=bench_log, reps=8, weight_kg=100, rir=1)

    url = reverse("workouts-detail", args=[workout.id])

    # --- STEP 2: PREPARE THE UPDATE PAYLOAD ---
    payload = {
        "id": workout.id,
        "begintime": workout.begintime.isoformat(),
        "endtime": workout.endtime.isoformat(),
        "exercise_logs": [
            {
                # EXISTING LOG (Bench Press)
                "id": bench_log.id,
                "exercise_type": bench_press.id,
                "exercise_sets": [
                    {
                        # UPDATING Set 1 (100kg -> 105kg)
                        "id": set_1.id,
                        "reps": 10,
                        "weight_kg": 105.0,  # Changed
                        "rir": 2,
                    }
                    # DELETING Set 2 (Omitted from list implies deletion)
                ],
            },
            {
                # NEW LOG (Squat) - No ID means create new
                "exercise_type": squat.id,
                "exercise_sets": [
                    {
                        # NEW SET
                        "reps": 5,
                        "weight_kg": 140.0,
                        "rir": 3,
                    }
                ],
            },
        ],
    }

    # --- STEP 3: EXECUTE ---
    response = api_client.put(url, payload, format="json")

    # --- STEP 4: VERIFY ---
    assert_status(response, 200)

    workout.refresh_from_db()

    # 4.1 Check High Level Counts
    assert workout.exercise_logs.count() == 2, (
        "Exercise logs do not match"
    )  # Bench + Squat

    # 4.2 Verify Bench Press (Updated + Deleted)
    updated_bench_log = workout.exercise_logs.get(exercise_type=bench_press)
    assert updated_bench_log.exercise_sets.count() == 1, (
        "Exercise set is not deleted"
    )  # Was 2, now 1

    remaining_set = updated_bench_log.exercise_sets.first()
    assert remaining_set.id == set_1.id, "ID was changed"  # ID persisted
    assert remaining_set.weight_kg == 105.0, (
        "Value is not/wrongly updated"
    )  # Value updated

    # 4.3 Verify Squat (Created)
    squat_log = workout.exercise_logs.get(exercise_type=squat)
    assert squat_log.exercise_sets.count() == 1, "Exercise set is not created"
    assert squat_log.exercise_sets.first().weight_kg == 140.0, (
        "Exercise set value is not correct"
    )


@pytest.mark.django_db
def test_workout_validation_end_before_start(api_client, user, assert_status):
    """
    Test that the model/serializer validator catches logical errors.
    """
    url = reverse("workouts-list")

    now = datetime.now()

    payload = {
        "begintime": now.isoformat(),
        "endtime": (now - timedelta(hours=1)).isoformat(),  # END BEFORE START
        "exercise_logs": [],
    }

    response = api_client.post(url, payload, format="json")

    assert_status(response, 400)
    assert "non_field_errors" in response.data or "endtime" in response.data
