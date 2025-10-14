from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pro registraci a úpravu uživatelů.
    Obsahuje validaci pro registraci pouze s username a heslem.
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
        read_only_fields = ('date_joined', 'is_active', 'currency_preference')

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
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'currency_preference', 
                 'avatar', 'date_joined', 'is_active', 'email')
        read_only_fields = ('username', 'date_joined', 'is_active')