"""
API Views for Weather-Aware Truck Routing.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from backend.routing_core.pipeline import run_truck_routing_pipeline

class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Spotter Weather-Aware Truck Routing API",
            "version": "1.0.0"
        })

class AnalyzeRouteView(APIView):
    """
    POST /api/routes/analyze/
    Accepts:
    - origin: str (e.g. "Chicago, IL")
    - destination: str (e.g. "Denver, CO")
    - departure_time: str ISO format (e.g. "2026-11-03T08:00:00Z")
    - load_weight: float (lbs)
    - sampling_interval_miles: float (10, 25, 50)
    """
    def post(self, request):
        data = request.data or {}
        origin = data.get("origin", "Chicago, IL")
        destination = data.get("destination", "Denver, CO")
        departure_time = data.get("departure_time")
        weather_mode = data.get("weather_mode", "live")
        
        try:
            load_weight = float(data.get("load_weight", 35000.0))
        except (ValueError, TypeError):
            load_weight = 35000.0

        try:
            sampling_interval = float(data.get("sampling_interval_miles", 25.0))
        except (ValueError, TypeError):
            sampling_interval = 25.0

        try:
            result = run_truck_routing_pipeline(
                origin_name=origin,
                destination_name=destination,
                departure_time_iso=departure_time,
                load_weight_lbs=load_weight,
                sampling_interval_miles=sampling_interval,
                weather_mode=weather_mode
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
