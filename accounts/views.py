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
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'message': 'Registrace úspěšná!'
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Vrátí data aktuálně přihlášeného uživatele.
        """
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Aktualizuje profil aktuálně přihlášeného uživatele.
        """
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Změní heslo aktuálně přihlášeného uživatele.
        """
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')
        
        if not all([old_password, new_password, new_password2]):
            return Response(
                {'error': 'Všechna pole jsou povinná.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Staré heslo je nesprávné.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != new_password2:
            return Response(
                {'error': 'Nová hesla se neshodují.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validujeme nové heslo
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Heslo bylo úspěšně změněno.'})
    
    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """
        Nahraje avatar aktuálně přihlášeného uživatele.
        """
        user = request.user
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Nebyl nahrán žádný soubor.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Smažeme starý avatar pokud existuje
        if user.avatar:
            user.avatar.delete(save=False)
        
        user.avatar = request.FILES['avatar']
        user.save()
        
        # Vrátíme úplnou URL avatara
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)
        
        return Response({
            'message': 'Avatar byl úspěšně nahrán.',
            'avatar': avatar_url
        })


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
                'user': UserProfileSerializer(user, context={'request': request}).data
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
            
            # Vytvoření výchozích kategorií pro nového uživatele
            self.create_default_categories(user)
            
            return Response({
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'message': 'Registrace úspěšná!'
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
    def create_default_categories(self, user):
        """Vytvoří výchozí kategorie pro nového uživatele"""
        from transactions.models import Category
        
        default_categories = [
            {'name': 'Jídlo a nápoje', 'icon': '🍔', 'color': '#FF6B6B', 'description': 'Nákupy potravin, restaurace', 'category_type': 'EXPENSE'},
            {'name': 'Doprava', 'icon': '🚗', 'color': '#4ECDC4', 'description': 'MHD, benzín, taxi', 'category_type': 'EXPENSE'},
            {'name': 'Bydlení', 'icon': '🏠', 'color': '#45B7D1', 'description': 'Nájem, energie, opravy', 'category_type': 'EXPENSE'},
            {'name': 'Zábava', 'icon': '🎮', 'color': '#F7DC6F', 'description': 'Kino, sport, hobby', 'category_type': 'EXPENSE'},
            {'name': 'Oblečení', 'icon': '👕', 'color': '#BB8FCE', 'description': 'Oblečení a obuv', 'category_type': 'EXPENSE'},
            {'name': 'Zdraví', 'icon': '💊', 'color': '#85C1E2', 'description': 'Léky, lékař, fitness', 'category_type': 'EXPENSE'},
            {'name': 'Vzdělání', 'icon': '📚', 'color': '#52B788', 'description': 'Kurzy, knihy, škola', 'category_type': 'EXPENSE'},
            {'name': 'Ostatní výdaje', 'icon': '💸', 'color': '#95A5A6', 'description': 'Ostatní výdaje', 'category_type': 'EXPENSE'},
            {'name': 'Mzda', 'icon': '💰', 'color': '#2ECC71', 'description': 'Pravidelný příjem z práce', 'category_type': 'INCOME'},
            {'name': 'Investice', 'icon': '📈', 'color': '#3498DB', 'description': 'Výnosy z investic', 'category_type': 'INCOME'},
            {'name': 'Dary', 'icon': '🎁', 'color': '#E74C3C', 'description': 'Dárky od rodiny a přátel', 'category_type': 'INCOME'},
            {'name': 'Ostatní příjmy', 'icon': '💵', 'color': '#16A085', 'description': 'Ostatní příjmy', 'category_type': 'INCOME'},
        ]
        
        for cat_data in default_categories:
            Category.objects.create(
                user=user,
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color'],
                description=cat_data['description'],
                category_type=cat_data['category_type']
            )