from django.urls import path
from .views import HealthCheckView, AnalyzeRouteView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("routes/analyze/", AnalyzeRouteView.as_view(), name="analyze_route"),
]
