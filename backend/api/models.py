from datetime import date
from django.db import models
from django.contrib.auth.models import User


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
    name = models.CharField(max_length=25, unique=True)
    unit = models.CharField(max_length=10)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name}: ({self.unit})"


class Measurement(models.Model):
    value = models.DecimalField(max_digits=5, decimal_places=2, editable=False)
    created = models.DateTimeField(auto_now_add=True)

    measurement_type = models.ForeignKey(MeasurementType, on_delete=models.CASCADE)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="measurements"
    )

    def __str__(self):
        return f"{self.User} - {self.measurement_type.name}: {self.value} {self.measurement_type.unit}"
