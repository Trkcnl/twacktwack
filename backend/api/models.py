from django.db import models
from django.contrib.auth.models import User


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
