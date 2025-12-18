from humanize import naturaldelta

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator


class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workouts")

    begintime = models.DateTimeField()
    endtime = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Workout day:{self.begintime.date} - Duration: {self.get_duration()}"

    def get_duration(self):
        return naturaldelta(self.endtime - self.begintime)


class ExerciseType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}"


class ExerciseLog(models.Model):
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.CASCADE)
    workout_log = models.ForeignKey(
        WorkoutLog, on_delete=models.CASCADE, related_name="exercises"
    )

    def __str__(self):
        return f"{self.workout_log} - {self.exercise_type}"


class ExerciseSet(models.Model):
    exercise_log = models.ForeignKey(
        ExerciseLog, on_delete=models.CASCADE, related_name="sets"
    )

    reps = models.PositiveSmallIntegerField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    rpe = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )

    def __str__(self):
        return f"{self.reps} reps - {self.weight_kg} kgs"


class MeasurementType(models.Model):
    name = models.CharField(max_length=25, unique=True)
    unit = models.CharField(max_length=10)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}: ({self.unit})"


class Measurement(models.Model):
    measurement_type = models.ForeignKey(MeasurementType, on_delete=models.CASCADE)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="measurements"
    )
    value = models.DecimalField(max_digits=5, decimal_places=2, editable=False)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.User} - {self.measurement_type.name}: {self.value} {self.measurement_type.unit}"
