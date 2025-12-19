from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins
from .serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    MeasurementTypeSerializer,
    MeasurementReadSerializer,
    MeasurementWriteSerializer,
    WorkoutLogReadSerializer,
    WorkoutLogWriteSerializer,
    ExerciseLogReadSerializer,
    ExerciseLogWriteSerializer,
    ExerciseSetReadSerializer,
    ExerciseSetWriteSerializer,
    ExerciseTypeSerializer,
)
from .models import (
    MeasurementType,
    Measurement,
    UserProfile,
    WorkoutLog,
    ExerciseLog,
    ExerciseSet,
    ExerciseType,
)
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny


# USER
class UserRegisterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        user = self.request.user
        return UserProfile.objects.filter(user=user)

    def get_permissions(self):
        if self.action == "list":
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]


# MEASUREMENT


class MeasurementTypeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = MeasurementType.objects.order_by("name")
    serializer_class = MeasurementTypeSerializer
    permission_classes = [AllowAny]


class MeasurementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Measurement.objects.filter(user=self.request.user).select_related(
            "measurement_type"
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MeasurementWriteSerializer
        return MeasurementReadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# WORKOUT


class WorkoutLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutLog.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return WorkoutLogWriteSerializer
        return WorkoutLogReadSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# EXERCISE


class ExerciseTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExerciseType.objects.order_by("name")
    serializer_class = ExerciseTypeSerializer
    permission_classes = [AllowAny]


class ExerciseLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExerciseLog.objects.filter(workout_log__user=self.request.user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ExerciseLogWriteSerializer
        return ExerciseLogReadSerializer

    def perform_create(self, serializer):
        workout_id = self.kwargs["workout_pk"]
        workout = get_object_or_404(WorkoutLog, id=workout_id, user=self.request.user)

        serializer.save(workout_log=workout)


class ExerciseSetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExerciseSet.objects.filter(
            exercise_log__workout_log__user=self.request.user
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ExerciseSetWriteSerializer
        return ExerciseSetReadSerializer

    def perform_create(self, serializer):
        exercise = get_object_or_404(
            ExerciseLog,
            id=self.kwargs["exercise_pk"],
            workout_log__user=self.request.user,
        )
        serializer.save(exercise_log=exercise)
