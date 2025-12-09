"""
models.py - Model pro správu finančních cílů aplikace Plutoa

@author Tomáš Holes
@description Obsahuje:
    - FinancialGoal: Finanční cíl s cílovou částkou a datem
    - GoalContribution: Historie příspěvků k cíli

@features
    - Automatický výpočet procentuálního pokroku
    - Podpora různých typů cílů (úspory, splátky, investice...)
    - Stavy: aktivní, dokončeno, pozastaveno, zrušeno
"""
from django.db import models
from django.conf import settings
from decimal import Decimal

class FinancialGoal(models.Model):
    """
    Model pro finanční cíle uživatele
    """
    GOAL_TYPES = [
        ('SAVINGS', 'Úspory'),
        ('DEBT_PAYMENT', 'Splacení dluhu'),
        ('PURCHASE', 'Nákup'),
        ('EMERGENCY_FUND', 'Nouzový fond'),
        ('INVESTMENT', 'Investice'),
        ('OTHER', 'Jiné'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Aktivní'),
        ('COMPLETED', 'Dokončeno'),
        ('PAUSED', 'Pozastaveno'),
        ('CANCELLED', 'Zrušeno'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='financial_goals'
    )
    name = models.CharField(max_length=200, verbose_name='Název cíle')
    description = models.TextField(blank=True, verbose_name='Popis')
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES, default='SAVINGS')
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Cílová částka')
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Aktuální částka')
    target_date = models.DateField(null=True, blank=True, verbose_name='Cílové datum')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    icon = models.CharField(max_length=10, default='target')
    color = models.CharField(max_length=7, default='#FF4742')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    @property
    def progress_percentage(self):
        """Vrátí procento dosažení cíle"""
        if self.target_amount <= 0:
            return 0
        percentage = (self.current_amount / self.target_amount) * 100
        return min(percentage, 100)
    
    @property
    def remaining_amount(self):
        """Vrátí zbývající částku do cíle"""
        return max(self.target_amount - self.current_amount, 0)
    
    @property
    def is_achieved(self):
        """Zkontroluje, zda byl cíl dosažen"""
        return self.current_amount >= self.target_amount


class GoalContribution(models.Model):
    """
    Model pro příspěvky do cíle
    """
    goal = models.ForeignKey(
        FinancialGoal,
        on_delete=models.CASCADE,
        related_name='contributions'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.goal.name} - {self.amount}"
