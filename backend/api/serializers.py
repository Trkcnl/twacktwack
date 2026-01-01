from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    MeasurementType,
    Measurement,
    WorkoutLog,
    ExerciseType,
    ExerciseSet,
    ExerciseLog,
    UserProfile,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["name", "birthdate", "bio", "created", "modified"]


class UserReadSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer

    class Meta:
        model = User
        fields = ["id", "username", "user_profile"]
        read_only_fields = fields


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        write_only_fields = fields

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ["id", "name"]
        read_only_fields = fields


class ExerciseSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseSet
        fields = ["id", "reps", "weight_kg", "rpe", "rir"]
        read_only_fields = ["id"]


class ExerciseLogWriteSerializer(serializers.ModelSerializer):
    exercise_sets = ExerciseSetSerializer(many=True)

    class Meta:
        model = ExerciseLog
        fields = ["id", "exercise_sets", "exercise_type"]
        read_only_fields = ["id"]


class ExerciseLogReadSerializer(serializers.ModelSerializer):
    exercise_type = ExerciseTypeSerializer()
    exercise_sets = ExerciseSetSerializer(many=True)

    class Meta:
        model = ExerciseLog
        fields = ["id", "exercise_type", "exercise_sets"]


class WorkoutLogWriteSerializer(serializers.ModelSerializer):
    exercise_logs = ExerciseLogWriteSerializer(many=True)

    class Meta:
        model = WorkoutLog
        fields = ["id", "begintime", "endtime", "exercise_logs"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        exercises_data = validated_data.pop("exercise_logs")

        workout_log = WorkoutLog.objects.create(**validated_data)

        for exercise_data in exercises_data:
            sets_data = exercise_data.pop("exercise_sets")

            exercise_log = ExerciseLog.objects.create(
                workout_log=workout_log, **exercise_data
            )

            for set_data in sets_data:
                ExerciseSet.objects.create(exercise_log=exercise_log, **set_data)

        return workout_log

    def validate(self, data):
        if data["endtime"] <= data["begintime"]:
            raise serializers.ValidationError("End time must be after begin time.")
        return data

    def to_representation(self, instance):
        serializer = WorkoutLogReadSerializer(instance)
        return serializer.data


class WorkoutLogReadSerializer(serializers.ModelSerializer):
    exercise_logs = ExerciseLogReadSerializer(many=True)

    class Meta:
        model = WorkoutLog
        fields = ["id", "begintime", "endtime", "exercise_logs"]


class MeasurementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementType
        fields = ["id", "name", "unit"]


class MeasurementReadSerializer(serializers.ModelSerializer):
    measurement_type = MeasurementTypeSerializer()

    class Meta:
        model = Measurement
        fields = ["id", "measurement_type", "value", "date"]


class MeasurementWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ["id", "date", "value", "measurement_type"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        serializer = MeasurementReadSerializer(instance)
        return serializer.data
