from django.contrib.auth.models import User
from rest_framework import serializers
from .models import MeasurementType, Measurement, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["name", "birthdate", "bio", "created", "modified", "user"]
        extra_kwargs = {"user": {"read_only": True}}


class MeasurementTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasurementType
        fields = ["name", "unit", "created"]
        read_only_fields = fields


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ["measurement_type", "user", "value", "created"]
        extra_kwargs = {"user": {"read_only": True}}
