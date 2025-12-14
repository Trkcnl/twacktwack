from django.contrib.auth.models import User
from rest_framework import serializers
from .models import MeasurementType, Measurement


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


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
