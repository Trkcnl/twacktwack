from humanize import naturaldelta, naturaldate

from datetime import date
from django.db import models
from django.db.models import Q, F
from django.db.models.functions import Now, Cast
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError


class WorkoutLog(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["user"], name="workoutlog_user_idx"),
            models.Index(fields=["created"], name="workoutlog_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(begintime__lt=F("endtime")),
                name="%(class)s_btime_before_endtime",
            ),
        ]

    begintime = models.DateTimeField()
    endtime = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workouts")

    @property
    def duration(self) -> str:
        return naturaldelta(self.endtime - self.begintime)

    def __str__(self):
        return f"Workout :{self.id} - Date: {naturaldate(self.begintime)} - Duration: {self.duration}"

    def clean(self):
        if self.begintime >= self.endtime:
            raise ValidationError("Begin time must be before end time.")


class ExerciseType(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["name"], name="exercise_type_name_idx"),
            models.Index(fields=["muscle_group"], name="exercise_type_mgroup_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "user"], name="%(class)sunique_user_exercise"
            )
        ]

    MUSCLE_GROUPS = {
        "CHEST": "Chest",
        "SHOULDER": "Shoulder",
        "TRICEPS": "Triceps",
        "BICEPS": "Biceps",
        "BACK": "Back",
        "QUAD": "Quad",
        "HAMSTRING": "Hamstring",
        "CALVE": "Calve",
        "GLUTE": "Glute",
    }

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    name = models.CharField(max_length=100, unique=True)
    muscle_group = models.CharField(max_length=100, choices=MUSCLE_GROUPS)
    created = models.DateTimeField(auto_now_add=True)
    custom_type = models.BooleanField()

    def __str__(self):
        return f"{self.muscle_group}: {self.name}"


class ExerciseLog(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["exercise_type"], name="exercise_log_etype_idx"),
            models.Index(fields=["workout_log"], name="exercise_log_wlog_idx"),
        ]

    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.CASCADE)
    workout_log = models.ForeignKey(
        WorkoutLog, on_delete=models.CASCADE, related_name="exercise_logs"
    )

    def __str__(self):
        return f"Workout Log: {self.workout_log} - {self.exercise_type}"


class ExerciseSet(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["exercise_log"], name="exercise_set_elog_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(reps__gte=0), name="%(class)s_reps_gte_0"
            ),
            models.CheckConstraint(
                condition=Q(weight_kg__gte=0), name="%(class)s_weight_kg_gte_0"
            ),
            models.CheckConstraint(condition=Q(rir__gte=0), name="%(class)s_rir_gte_0"),
        ]

    exercise_log = models.ForeignKey(
        ExerciseLog, on_delete=models.CASCADE, related_name="exercise_sets"
    )

    reps = models.PositiveSmallIntegerField(validators=[MaxValueValidator(100)])
    weight_kg = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(300)],
    )
    rir = models.PositiveSmallIntegerField(validators=[MaxValueValidator(6)])

    def __str__(self):
        return f"{self.reps} reps - {self.weight_kg} kgs"

    def clean(self):
        if self.reps < 0 or self.weight_kg < 0 or self.rir < 0:
            raise ValidationError(
                "Weight lifted, reps performed or RIR can not be less than 0"
            )


def validate_birthdate(value):
    if (date.today() - value).days // 365 < UserProfile.MIN_AGE:
        raise ValidationError(
            f"You must be older than {UserProfile.MIN_AGE} years old to use the application."
        )


class UserProfile(models.Model):
    MIN_AGE = 16

    class Meta:
        indexes = [
            models.Index(fields=["user"], name="user_profile_user_idx"),
            models.Index(fields=["created"], name="user_profile_created_idx"),
        ]
        constraints = [
            # models.CheckConstraint(condition=Q(birthdate__lte=Cast(Now(), output_field=models.DateField())), name="%(class)s_birthdate_not_in_future"),
            models.CheckConstraint(
                condition=Q(height__gte=0), name="%(class)s_height_gte_0"
            )
        ]

    name = models.CharField(max_length=100)
    birthdate = models.DateField(validators=[validate_birthdate])
    height = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(300)],
    )
    bio = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="user_profile"
    )

    @property
    def age(self):
        return (date.today() - self.birthdate).days // 365

    def __str__(self):
        return f"{self.name}: ({self.age})"

    def clean(self):
        if self.birthdate > date.today():
            raise ValidationError("Birthday can no be in the future.")

        if self.height < 0:
            raise ValidationError("Height can not be less than 0.")


class MeasurementType(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["name"], name="measurement_type_name_idx"),
        ]

    name = models.CharField(max_length=100, unique=True)
    unit = models.CharField(max_length=10)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}: ({self.unit})"


class Measurement(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["user"], name="measurement_user_idx"),
            models.Index(fields=["measurement_type"], name="measurement_mtype_idx"),
            models.Index(fields=["user", "measurement_type"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(date__lte=Cast(Now(), output_field=models.DateField())),
                name="%(class)s_date_not_in_future",
            ),
            models.CheckConstraint(
                condition=Q(value__gte=0), name="%(class)s_value_gte_0"
            ),
        ]

    created = models.DateTimeField(auto_now_add=True)
    value = models.DecimalField(max_digits=6, decimal_places=2)
    date = models.DateField()
    measurement_type = models.ForeignKey(MeasurementType, on_delete=models.CASCADE)

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="measurements"
    )

    def __str__(self):
        return f"{self.user} - {self.measurement_type.name}: {self.value} {self.measurement_type.unit}"

    def clean(self):
        if self.date > date.today():
            raise ValidationError({"date": "Date cannot be in the future."})

        if self.value < 0:
            raise ValidationError({"value": "Value cannot be less than 0."})
