import factory
from django.utils import timezone
from django.contrib.auth.models import User

from api.models import (
    WorkoutLog,
    ExerciseType,
    ExerciseLog,
    ExerciseSet,
    MeasurementType,
    Measurement,
)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        # factory.PostGenerationMethodCall gives deprecation warnings the line below fixes that
        # see https://factoryboy.readthedocs.io/en/stable/changelog.html#id4
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall("set_password", "password123")


class ExerciseTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExerciseType

    name = factory.Sequence(lambda n: f"Exercise {n}")


class ExerciseSetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExerciseSet

    reps = 5
    weight_kg = "60.00"
    rpe = 8
    rir = 2


class ExerciseLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExerciseLog

    exercise_type = factory.SubFactory(ExerciseTypeFactory)
    exercise_sets = factory.SubFactory(ExerciseSetFactory)


class WorkoutLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WorkoutLog

    user = factory.SubFactory(UserFactory)
    begintime = factory.LazyFunction(timezone.now)
    endtime = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(hours=1))
    exercise_logs = [factory.SubFactory(ExerciseLogFactory)]


class MeasurementTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = MeasurementType

    name = factory.Sequence(lambda n: f"Measurement {n}")
    unit = "kg"


class MeasurementFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Measurement

    user = factory.SubFactory(UserFactory)
    measurement_type = factory.SubFactory(MeasurementTypeFactory)
    value = "81.00"
    date = "2026-01-01"
