"""
models.py - Modely pro správu uživatelů aplikace Plutoa

@author Tomáš Holes
@description Obsahuje:
    - CustomUserManager: Vlastní správce pro vytváření uživatelů
    - User: Rozšířený uživatelský model s preferencemi měny
    - EmailVerificationToken: Token pro ověření emailové adresy
    - PasswordResetToken: Token pro reset hesla
    - FinancialAccount: Model pro finanční účty uživatele

@note Používá Django AbstractUser jako základ pro rozšíření
"""
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
import secrets
from datetime import timedelta

# Vlastní správce uživatelů pro naši custom User model
class CustomUserManager(BaseUserManager):
    """
    Správce uživatelů upravený pro naši custom User model.
    Umožňuje vytváření uživatelů pouze s username a heslem.
    """
    
    def create_user(self, username, password=None, **extra_fields):
        """
        Vytvoří běžného uživatele s povinným username a heslem.
        Ostatní pole jsou volitelná.
        """
        if not username:
            raise ValueError(_('Uživatelské jméno musí být zadáno'))
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        """
        Vytvoří superuživatele s administrátorskými právy.
        Superuživatelé jsou automaticky ověřeni.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)  # Superusers are verified by default

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(username, password, **extra_fields)

class User(AbstractUser):
    """
    Vlastní User model pro personal finance platform.
    Rozšiřuje Django AbstractUser o specifické funkce pro finanční aplikaci.
    
    Klíčové vlastnosti:
    - Registrace pouze s username a heslem (bez emailu)
    - Volitelná jména a příjmení
    - Automatická verifikace (bez email verifikace)
    - Podpora pro avatary a měnové preference
    """
    
    # Email je úplně volitelný - pouze pro případné budoucí použití
    email = models.EmailField(_('email address'), blank=True, null=True)
    
    # Povinné pole pro přihlášení
    username = models.CharField(_('username'), max_length=30, unique=True)
    
    # Volitelná jména - uživatel je nemusí vyplnit
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    
    # Automaticky nastavená pole
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)
    is_verified = models.BooleanField(_('verified'), default=True)  # Vždy True, protože nepoužíváme email verifikaci
    
    # Volitelná pole pro personalizaci
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    currency_preference = models.CharField(max_length=3, default='CZK')
    
    # Konfigurace modelu
    objects = CustomUserManager()
    USERNAME_FIELD = 'username'  # Pole pro přihlášení
    REQUIRED_FIELDS = []  # Žádné povinné pole kromě username

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def get_full_name(self):
        """Vrátí celé jméno uživatele nebo username pokud jméno není vyplněno."""
        if self.first_name and self.last_name:
            return f'{self.first_name} {self.last_name}'
        return self.username

    def __str__(self):
        """String reprezentace uživatele pro admin rozhraní."""
        return self.username


class PasswordResetToken(models.Model):
    """
    Model pro tokeny pro reset hesla
    Token je platný 1 hodinu od vytvoření
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reset token for {self.user.username}"
    
    def is_valid(self):
        """Zkontroluje, zda je token stále platný (1 hodina)"""
        if self.used:
            return False
        expiry_time = self.created_at + timedelta(hours=1)
        return timezone.now() < expiry_time
    
    @classmethod
    def create_token(cls, user):
        """Vytvoří nový reset token pro uživatele"""
        # Smaž staré nepoužité tokeny
        cls.objects.filter(user=user, used=False).delete()
        
        # Vytvoř nový token
        token = secrets.token_urlsafe(32)
        return cls.objects.create(user=user, token=token)


class FinancialAccount(models.Model):
    """
    Model pro finanční účty uživatele.
    Podporuje různé typy účtů: běžný účet, spořicí účet, hotovost, kreditní karta.
    """
    ACCOUNT_TYPES = [
        ('CHECKING', 'Běžný účet'),
        ('SAVINGS', 'Spořicí účet'),
        ('CASH', 'Hotovost'),
        ('CREDIT', 'Kreditní karta'),
        ('INVESTMENT', 'Investiční účet'),
        ('OTHER', 'Ostatní'),
    ]
    
    ACCOUNT_COLORS = [
        ('#3B82F6', 'Modrá'),
        ('#22C55E', 'Zelená'),
        ('#EAB308', 'Žlutá'),
        ('#EF4444', 'Červená'),
        ('#8B5CF6', 'Fialová'),
        ('#EC4899', 'Růžová'),
        ('#06B6D4', 'Tyrkysová'),
        ('#F97316', 'Oranžová'),
    ]
    
    ACCOUNT_ICONS = [
        ('wallet', 'Peněženka'),
        ('credit-card', 'Kreditní karta'),
        ('piggy-bank', 'Prasátko'),
        ('landmark', 'Banka'),
        ('banknote', 'Bankovky'),
        ('coins', 'Mince'),
        ('trending-up', 'Investice'),
        ('building', 'Instituce'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='financial_accounts'
    )
    name = models.CharField(max_length=100, verbose_name='Název účtu')
    account_type = models.CharField(
        max_length=20, 
        choices=ACCOUNT_TYPES, 
        default='CHECKING',
        verbose_name='Typ účtu'
    )
    initial_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        verbose_name='Počáteční zůstatek'
    )
    currency = models.CharField(max_length=3, default='CZK', verbose_name='Měna')
    color = models.CharField(max_length=7, default='#3B82F6', verbose_name='Barva')
    icon = models.CharField(max_length=50, default='wallet', verbose_name='Ikona')
    is_active = models.BooleanField(default=True, verbose_name='Aktivní')
    is_default = models.BooleanField(default=False, verbose_name='Výchozí účet')
    include_in_total = models.BooleanField(default=True, verbose_name='Zahrnout do celkového zůstatku')
    description = models.TextField(blank=True, verbose_name='Popis')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'name']
        verbose_name = 'Finanční účet'
        verbose_name_plural = 'Finanční účty'
    
    def __str__(self):
        return f"{self.name} ({self.get_account_type_display()})"
    
    def save(self, *args, **kwargs):
        # Pokud je tento účet nastaven jako výchozí, odstraň výchozí z ostatních
        if self.is_default:
            FinancialAccount.objects.filter(
                user=self.user, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
    
    @property
    def current_balance(self):
        """Vypočítá aktuální zůstatek účtu na základě transakcí"""
        from transactions.models import Transaction
        from django.db.models import Sum, Case, When, F, DecimalField
        from decimal import Decimal
        
        # Suma příjmů
        income = Transaction.objects.filter(
            user=self.user,
            account=self,
            type='INCOME'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Suma výdajů
        expenses = Transaction.objects.filter(
            user=self.user,
            account=self,
            type='EXPENSE'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Transfery - příchozí (tento účet je cílem)
        transfers_in = Transaction.objects.filter(
            user=self.user,
            to_account=self,
            type='TRANSFER'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Transfery - odchozí (tento účet je zdrojem)
        transfers_out = Transaction.objects.filter(
            user=self.user,
            account=self,
            type='TRANSFER'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        return self.initial_balance + income - expenses + transfers_in - transfers_out