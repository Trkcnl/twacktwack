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


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class WorkoutLogReadSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutLog
        fields = ["id", "begintime", "endtime", "created", "duration_seconds"]

    def get_duration_seconds(self, obj):
        return (obj.endtime - obj.begintime).total_seconds()


class WorkoutLogWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutLog
        fields = ["begintime", "endtime"]

    def validate(self, data):
        if data["endtime"] <= data["begintime"]:
            raise serializers.ValidationError("End time must be after begin time.")
        return data


class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ["id", "name"]
        read_only_fields = fields


class ExerciseLogReadSerializer(serializers.ModelSerializer):
    exercise_type = ExerciseTypeSerializer(read_only=True)

    class Meta:
        model = ExerciseLog
        fields = ["id", "exercise_type"]


class ExerciseLogWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseLog
        fields = ["exercise_type"]


class ExerciseSetReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseSet
        fields = ["id", "reps", "weight_kg", "rpe", "rir"]


class ExerciseSetWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseSet
        fields = ["reps", "weight_kg", "rpe", "rir"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["name", "birthdate", "bio", "created", "modified", "user"]
        extra_kwargs = {"user": {"read_only": True}}


class MeasurementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementType
        fields = ["id", "name", "unit"]
        read_only_fields = fields


class MeasurementReadSerializer(serializers.ModelSerializer):
    measurement_type = MeasurementTypeSerializer(read_only=True)

    class Meta:
        model = Measurement
        fields = ["id", "measurement_type", "value", "created"]


class MeasurementWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ["measurement_type", "value"]
