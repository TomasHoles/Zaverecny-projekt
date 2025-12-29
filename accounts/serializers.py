"""
serializers.py - Serializery pro aplikaci Accounts

@author Tomáš Holes
@description Obsahuje implementaci serializace a deserializace dat pro:
    - Uživatele (registrace, login, profil)
    - Finanční účty (CRUD operace, souhrny)

@note Používá Django REST Framework serializery
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from .models import FinancialAccount

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pro registraci a úpravu uživatelů.
    
    Hashuje hesla při vytváření a úpravách.
    Obsahuje validaci pro:
    - Unikátní username
    - Shodu hesel (password a password2)
    - Sílu hesla (pomocí Django validátorů)
    """
    
    # Povinná pole pro registraci
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Toto uživatelské jméno je již zaregistrováno.")]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    # Volitelná pole - uživatel je nemusí vyplnit
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'password2', 'first_name', 'last_name', 
         'currency_preference', 'avatar', 'date_joined', 'is_active', 'email')
        read_only_fields = ('date_joined', 'is_active')

    def validate(self, attrs):
        """
        Validuje, že se hesla shodují.
        """
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Hesla se neshodují."})
        return attrs

    def create(self, validated_data):
        """
        Vytvoří nového uživatele s hashovaným heslem.
        """
        validated_data.pop('password2')  # Odstraníme password2 před vytvořením uživatele
        user = User.objects.create_user(**validated_data)
        return user
        
    def update(self, instance, validated_data):
        """
        Aktualizuje existujícího uživatele.
        Pokud je zadáno nové heslo, hashuje ho.
        """
        password = validated_data.pop('password', None)
        password2 = validated_data.pop('password2', None)
        
        # Aktualizujeme všechna pole kromě hesla
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Pokud je zadáno nové heslo, hashujeme ho
        if password and password2 and password == password2:
            instance.set_password(password)
        
        instance.save()
        return instance

class UserLoginSerializer(serializers.Serializer):
    """
    Serializer pro přihlášení uživatele.
    Obsahuje pouze username a password.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True)

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pro zobrazení profilu uživatele.
    Používá se pro vracení dat o uživateli po přihlášení/registraci.
    """
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'currency_preference', 
                 'avatar', 'date_joined', 'is_active', 'email')
        read_only_fields = ('username', 'date_joined', 'is_active')
    
    def get_avatar(self, obj):
        """Vrací úplnou URL avatara včetně domény."""
        if obj.avatar:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class FinancialAccountSerializer(serializers.ModelSerializer):
    """
    Serializer pro finanční účty.
    Obsahuje aktuální zůstatek jako computed field.
    """
    current_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    account_type_display = serializers.CharField(
        source='get_account_type_display', 
        read_only=True
    )
    
    class Meta:
        model = FinancialAccount
        fields = (
            'id', 'name', 'account_type', 'account_type_display',
            'initial_balance', 'current_balance', 'currency', 
            'color', 'icon', 'is_active', 'is_default',
            'include_in_total', 'description', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at', 'current_balance')
    
    def create(self, validated_data):
        """Vytvoří nový účet pro aktuálního uživatele."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FinancialAccountSummarySerializer(serializers.ModelSerializer):
    """
    Zkrácený serializer pro finanční účty - pro výběry a přehledy.
    """
    current_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = FinancialAccount
        fields = ('id', 'name', 'account_type', 'color', 'icon', 'current_balance', 'is_default')