from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import (
    UserSerializer,
    MeasurementTypeSerializer,
    MeasurementSerializer,
)
from .models import MeasurementType, Measurement
from rest_framework.permissions import IsAuthenticated, AllowAny


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class MeasurementListTypeView(generics.ListAPIView):
    queryset = MeasurementType.objects.all()
    serializer_class = MeasurementTypeSerializer
    permission_classes = [AllowAny]


class MeasurementListCreate(generics.ListCreateAPIView):
    serializer_class = MeasurementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Measurement.objects.filter(user=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)


class MeasurementDelete(generics.DestroyAPIView):
    serializer_class = MeasurementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Measurement.objects.filter(user=user)
