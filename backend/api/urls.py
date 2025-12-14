from django.urls import path
from . import views

urlpatterns = [
    path(
        "measurements/", views.MeasurementListCreate.as_view(), name="measurement-list"
    ),
    path(
        "measurement/delete/<int:pk>/",
        views.MeasurementDelete.as_view(),
        name="measurement-delete",
    ),
]
