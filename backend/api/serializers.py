from django.db import transaction
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
from datetime import date


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "name", "birthdate", "bio", "height"]


class UserReadSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ["id", "username", "email", "user_profile"]
        read_only_fields = fields


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        write_only_fields = fields

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)

        UserProfile.objects.create(
            user=user,
            birthdate=date(year=2000, month=1, day=1),
            height=180,
            name="John Doe",
            bio="Bio",
        )

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)  # Handles Hashing

        instance.save()
        return instance


class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ["id", "name", "muscle_group", "custom_type"]
        read_only_fields = fields


class ExerciseSetSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ExerciseSet
        fields = ["id", "reps", "weight_kg", "rir"]


class ExerciseLogWriteSerializer(serializers.ModelSerializer):
    exercise_sets = ExerciseSetSerializer(many=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ExerciseLog
        fields = ["id", "exercise_sets", "exercise_type"]


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

    @transaction.atomic
    def create(self, validated_data):
        exercises_data = validated_data.pop("exercise_logs")
        workout_log = WorkoutLog.objects.create(**validated_data)

        for exercise_data in exercises_data:
            sets_data = exercise_data.pop("exercise_sets")
            exercise_data.pop("id", None)
            exercise_log = ExerciseLog.objects.create(
                workout_log=workout_log, **exercise_data
            )

            for set_data in sets_data:
                set_data.pop("id", None)
                ExerciseSet.objects.create(exercise_log=exercise_log, **set_data)

        return workout_log

    @transaction.atomic
    def update(self, instance, validated_data):
        exercises_data = validated_data.pop("exercise_logs", [])

        # Update WorkoutLog values first
        instance.begintime = validated_data.get("begintime", instance.begintime)
        instance.endtime = validated_data.get("endtime", instance.endtime)
        instance.save()

        # 1. Handle Deletions (Same as before)
        incoming_exercise_ids = [
            item.get("id") for item in exercises_data if item.get("id") is not None
        ]
        existing_exercise_ids = [item.id for item in instance.exercise_logs.all()]

        instance.exercise_logs.exclude(id__in=incoming_exercise_ids).delete()

        # 2. Handle Create / Update
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop("exercise_sets", [])
            exercise_id = exercise_data.get("id", None)

            if exercise_id in existing_exercise_ids:
                ExerciseLog.objects.filter(id=exercise_id, workout_log=instance).update(
                    **exercise_data
                )

                current_log_id = exercise_id
            else:
                exercise_data.pop("id", None)
                new_log = ExerciseLog.objects.create(
                    workout_log=instance, **exercise_data
                )
                current_log_id = new_log.id

            incoming_set_ids = [
                item.get("id") for item in sets_data if item.get("id") is not None
            ]

            existing_set_ids = [
                item.id
                for item in ExerciseSet.objects.filter(exercise_log_id=current_log_id)
            ]

            ExerciseSet.objects.filter(exercise_log_id=current_log_id).exclude(
                id__in=incoming_set_ids
            ).delete()

            for set_data in sets_data:
                set_id = set_data.get("id", None)
                if set_id in existing_set_ids:
                    ExerciseSet.objects.filter(
                        id=set_id, exercise_log_id=current_log_id
                    ).update(**set_data)
                else:
                    set_data.pop("id", None)
                    ExerciseSet.objects.create(
                        exercise_log_id=current_log_id, **set_data
                    )

        return instance

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
