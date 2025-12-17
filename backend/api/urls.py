from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(
    r"userprofiles", viewset=views.UserProfileViewSet, basename="userprofile"
)

urlpatterns = [
    path(
        "measurements/", views.MeasurementListCreate.as_view(), name="measurement-list"
    ),
    path(
        "measurement/delete/<int:pk>/",
        views.MeasurementDelete.as_view(),
        name="measurement-delete",
    ),
    path("", include(router.urls)),
]
