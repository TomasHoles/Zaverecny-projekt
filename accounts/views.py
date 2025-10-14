from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer, UserLoginSerializer, UserProfileSerializer
from .models import User
from rest_framework import serializers

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pro správu uživatelů.
    Poskytuje CRUD operace pro uživatele s různými oprávněními.
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Vrátí správný serializer podle akce.
        Pro registraci používá UserSerializer, jinak UserProfileSerializer.
        """
        if self.action == 'create':
            return UserSerializer
        return UserProfileSerializer
    
    def get_permissions(self):
        """
        Nastaví oprávnění podle akce.
        Registrace je povolena všem, ostatní akce vyžadují přihlášení.
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """
        Vytvoří nového uživatele (registrace).
        Vrací token a data uživatele po úspěšné registraci.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Create auth token
            auth_token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': auth_token.key,
                'user': UserProfileSerializer(user).data,
                'message': 'Registrace úspěšná!'
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Vrátí data aktuálně přihlášeného uživatele.
        """
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Aktualizuje profil aktuálně přihlášeného uživatele.
        """
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    """
    View pro přihlášení uživatele.
    Ověří přihlašovací údaje a vrátí token pro autentifikaci.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Přihlásí uživatele pomocí username a password.
        Vrací token a data uživatele při úspěšném přihlášení.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ověříme přihlašovací údaje
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if user:
            # Vytvoříme nebo získáme token pro uživatele
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data
            })
        
        return Response(
            {'error': 'Neplatné přihlašovací údaje'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class RegisterView(generics.GenericAPIView):
    """
    View pro registraci nového uživatele.
    Vytvoří uživatele pouze s username a heslem (bez emailu).
    """
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Zaregistruje nového uživatele.
        Vrací data uživatele po úspěšné registraci.
        """
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'message': 'Registrace úspěšná!'
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)