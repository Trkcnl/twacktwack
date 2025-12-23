from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(
    "userprofiles", viewset=views.UserProfileViewSet, basename="userprofile"
)
router.register(
    "measurement-types", views.MeasurementTypeViewSet, basename="measurement-type"
)
router.register("measurements", views.MeasurementViewSet, basename="measurement")
router.register("workouts", views.WorkoutLogViewSet, basename="workout")
router.register("exercise-types", views.ExerciseTypeViewSet, basename="exercise-type")
router.register("auth/users", views.UserViewSet, basename="me")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "workouts/<int:workout_pk>/exercises/",
        views.ExerciseLogViewSet.as_view({"get": "list", "post": "create"}),
    ),
    path(
        "exercises/<int:exercise_pk>/sets/",
        views.ExerciseSetViewSet.as_view({"get": "list", "post": "create"}),
    ),
]
