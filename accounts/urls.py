from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router pro automatické generování URL pro UserViewSet
router = DefaultRouter()
router.register('users', views.UserViewSet)

# URL konfigurace pro accounts aplikaci
urlpatterns = [
    # Automaticky generované URL pro UserViewSet (CRUD operace)
    path('', include(router.urls)),
    
    # Vlastní endpointy pro autentifikaci
    path('login/', views.LoginView.as_view(), name='login'),  # POST /api/accounts/login/
    path('register/', views.RegisterView.as_view(), name='register'),  # POST /api/accounts/register/
    
    # Poznámka: Odstranili jsme cesty pro verifikaci emailu, protože nepoužíváme email registraci
]