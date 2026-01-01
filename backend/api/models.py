from humanize import naturaldelta

from datetime import date
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator


class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workouts")

    begintime = models.DateTimeField()
    endtime = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Workout day:{self.begintime.timestamp()} - Duration: {self.get_duration()}"

    def get_duration(self):
        return naturaldelta(self.endtime - self.begintime)

    class Meta:
        indexes = [
            models.Index(fields=["user", "created"]),
        ]


class ExerciseType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}"


class ExerciseLog(models.Model):
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.CASCADE)
    workout_log = models.ForeignKey(
        WorkoutLog, on_delete=models.CASCADE, related_name="exercise_logs"
    )

    def __str__(self):
        return f"{self.workout_log} - {self.exercise_type}"

    class Meta:
        indexes = [
            models.Index(fields=["workout_log"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["workout_log", "exercise_type"],
                name="unique_exercise_per_workout",
            )
        ]


class ExerciseSet(models.Model):
    exercise_log = models.ForeignKey(
        ExerciseLog, on_delete=models.CASCADE, related_name="exercise_sets"
    )

    reps = models.PositiveSmallIntegerField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2)
    rpe = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    rir = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)]
    )

    def __str__(self):
        return f"{self.reps} reps - {self.weight_kg} kgs"

    class Meta:
        indexes = [
            models.Index(fields=["exercise_log"]),
        ]


class UserProfile(models.Model):
    name = models.CharField(max_length=100)
    birthdate = models.DateField()
    height = models.PositiveSmallIntegerField()
    bio = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_profile"
    )

    def __str__(self):
        return f"{self.name} ({self.age()})"

    def age(self):
        return (date.today() - self.birthdate).days // 365


class MeasurementType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    unit = models.CharField(max_length=10)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}: ({self.unit})"


class Measurement(models.Model):
    value = models.DecimalField(max_digits=5, decimal_places=2)
    created = models.DateTimeField(auto_now_add=True)

    date = models.DateField()
    measurement_type = models.ForeignKey(MeasurementType, on_delete=models.CASCADE)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="measurements"
    )

    def __str__(self):
        return f"{self.user} - {self.measurement_type.name}: {self.value} {self.measurement_type.unit}"
