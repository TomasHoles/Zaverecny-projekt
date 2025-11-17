from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer, UserLoginSerializer, UserProfileSerializer
from .models import User, PasswordResetToken
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
    View pro přihlášení uživatele s JWT tokenem.
    Ověří přihlašovací údaje a vrátí access a refresh token.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        """
        Přihlásí uživatele pomocí username a password.
        Vrací JWT tokeny a data uživatele při úspěšném přihlášení.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ověříme přihlašovací údaje
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if user:
            # Vytvoříme JWT tokeny
            refresh = RefreshToken.for_user(user)
            
            # Vytvoříme nebo získáme token pro backward compatibility
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'token': token.key,  # Kept for backward compatibility
                'user': UserProfileSerializer(user, context={'request': request}).data
            })
        
        return Response(
            {'error': 'Neplatné přihlašovací údaje'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class RegisterView(generics.GenericAPIView):
    """
    View pro registraci nového uživatele s validací hesla.
    Vytvoří uživatele pouze s username a heslem (bez emailu).
    """
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        """
        Zaregistruje nového uživatele s validací hesla.
        Vrací JWT tokeny a data uživatele po úspěšné registraci.
        """
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            
            # Validace hesla před vytvořením uživatele
            password = serializer.validated_data.get('password')
            username = serializer.validated_data.get('username')
            
            # Kontrola síly hesla
            try:
                validate_password(password, user=User(username=username))
            except DjangoValidationError as e:
                return Response({
                    'error': 'Heslo nesplňuje bezpečnostní požadavky',
                    'details': list(e.messages)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vytvoření uživatele
            user = serializer.save()
            
            # Vytvoření výchozích kategorií pro nového uživatele
            self.create_default_categories(user)
            
            # Vytvoření JWT tokenů
            refresh = RefreshToken.for_user(user)
            
            # Vytvoření Token pro backward compatibility
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'token': token.key,  # Kept for backward compatibility
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'message': 'Registrace úspěšná!'
            }, status=status.HTTP_201_CREATED)
            
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
    def create_default_categories(self, user):
        """Vytvoří výchozí kategorie pro nového uživatele"""
        from transactions.models import Category
        
        default_categories = [
            {'name': 'Jídlo a nápoje', 'icon': 'food', 'color': '#FF6B6B', 'description': 'Nákupy potravin, restaurace', 'category_type': 'EXPENSE'},
            {'name': 'Doprava', 'icon': 'transport', 'color': '#4ECDC4', 'description': 'MHD, benzín, taxi', 'category_type': 'EXPENSE'},
            {'name': 'Bydlení', 'icon': 'home', 'color': '#45B7D1', 'description': 'Nájem, energie, opravy', 'category_type': 'EXPENSE'},
            {'name': 'Zábava', 'icon': 'entertainment', 'color': '#F7DC6F', 'description': 'Kino, sport, hobby', 'category_type': 'EXPENSE'},
            {'name': 'Oblečení', 'icon': 'shopping', 'color': '#BB8FCE', 'description': 'Oblečení a obuv', 'category_type': 'EXPENSE'},
            {'name': 'Zdraví', 'icon': 'health', 'color': '#85C1E2', 'description': 'Léky, lékař, fitness', 'category_type': 'EXPENSE'},
            {'name': 'Vzdělání', 'icon': 'education', 'color': '#52B788', 'description': 'Kurzy, knihy, škola', 'category_type': 'EXPENSE'},
            {'name': 'Ostatní výdaje', 'icon': 'money', 'color': '#95A5A6', 'description': 'Ostatní výdaje', 'category_type': 'EXPENSE'},
            {'name': 'Mzda', 'icon': 'money', 'color': '#2ECC71', 'description': 'Pravidelný příjem z práce', 'category_type': 'INCOME'},
            {'name': 'Investice', 'icon': 'trending-up', 'color': '#3498DB', 'description': 'Výnosy z investic', 'category_type': 'INCOME'},
            {'name': 'Dary', 'icon': 'gift', 'color': '#E74C3C', 'description': 'Dárky od rodiny a přátel', 'category_type': 'INCOME'},
            {'name': 'Ostatní příjmy', 'icon': 'dollar-sign', 'color': '#16A085', 'description': 'Ostatní příjmy', 'category_type': 'INCOME'},
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


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """
    Vytvoří reset token pro uživatele na základě username.
    Vrátí token - v produkci by se poslal emailem, zde ho vrátíme přímo.
    """
    username = request.data.get('username')
    
    if not username:
        return Response(
            {'error': 'Username je povinný'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Z bezpečnostních důvodů neříkáme, že uživatel neexistuje
        return Response(
            {'message': 'Pokud uživatel existuje, byl odeslán reset token'},
            status=status.HTTP_200_OK
        )
    
    # Vytvoř reset token
    reset_token = PasswordResetToken.create_token(user)
    
    # V produkci by se token poslal emailem
    # Zde ho vrátíme přímo pro testování (v produkci SMAZAT!)
    return Response({
        'message': 'Reset token byl vytvořen',
        'token': reset_token.token,  # POUZE PRO DEVELOPMENT! V produkci smazat
        'username': username,
        'info': 'V produkci by byl token odeslán na email'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Resetuje heslo pomocí reset tokenu
    """
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    new_password2 = request.data.get('new_password2')
    
    if not all([token, new_password, new_password2]):
        return Response(
            {'error': 'Všechna pole jsou povinná'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if new_password != new_password2:
        return Response(
            {'error': 'Hesla se neshodují'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Neplatný reset token'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not reset_token.is_valid():
        return Response(
            {'error': 'Reset token vypršel nebo byl již použit'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validuj nové heslo
    try:
        validate_password(new_password, user=reset_token.user)
    except DjangoValidationError as e:
        return Response({
            'error': 'Heslo nesplňuje bezpečnostní požadavky',
            'details': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Nastav nové heslo
    reset_token.user.set_password(new_password)
    reset_token.user.save()
    
    # Označ token jako použitý
    reset_token.used = True
    reset_token.save()
    
    return Response({
        'message': 'Heslo bylo úspěšně změněno'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    Ověří platnost reset tokenu bez jeho použití
    """
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Token je povinný'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'valid': False, 'error': 'Neplatný token'},
            status=status.HTTP_200_OK
        )
    
    if reset_token.is_valid():
        return Response({
            'valid': True,
            'username': reset_token.user.username
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'valid': False,
            'error': 'Token vypršel nebo byl použit'
        }, status=status.HTTP_200_OK)