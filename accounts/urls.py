from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Router pro automatické generování URL pro UserViewSet
router = DefaultRouter()
router.register('users', views.UserViewSet)

# URL konfigurace pro accounts aplikaci
urlpatterns = [
    # Automaticky generované URL pro UserViewSet (CRUD operace)
    path('', include(router.urls)),
    
    # JWT Authentication endpoints
    path('login/', views.LoginView.as_view(), name='login'),  # POST /api/accounts/login/
    path('register/', views.RegisterView.as_view(), name='register'),  # POST /api/accounts/register/
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # POST /api/accounts/token/refresh/
    
    # Password Reset endpoints
    path('password-reset/request/', views.request_password_reset, name='password-reset-request'),  # POST
    path('password-reset/verify/', views.verify_reset_token, name='password-reset-verify'),  # POST
    path('password-reset/reset/', views.reset_password, name='password-reset'),  # POST
    
    # Poznámka: Odstranili jsme cesty pro verifikaci emailu, protože nepoužíváme email registraci
]