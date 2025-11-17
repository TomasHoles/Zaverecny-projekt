from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet, financial_health_score

router = DefaultRouter()
router.register(r'', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('health-score/', financial_health_score, name='financial-health-score'),
    path('', include(router.urls)),
]
