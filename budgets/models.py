"""
models.py - Model pro správu rozpočtů aplikace Plutoa

@author Tomáš Holes
@description Obsahuje:
    - Budget: Rozpočet s limitem, obdobím a volitelnou kategorií

@features
    - Automatický výpočet utracené částky (get_spent_amount)
    - Podpora měsíčních, ročních a vlastních období
    - Možnost přiřazení ke konkrétní kategorii
"""
from django.db import models
from django.conf import settings
from django.db.models import Sum
from transactions.models import Category
import datetime as dt

class Budget(models.Model):
    PERIOD_CHOICES = [
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
        ('CUSTOM', 'Custom')
    ]
    
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def get_spent_amount(self, start_date=None, end_date=None):
        """Výpočet utracené částky za dané období"""
        from transactions.models import Transaction
        
        if start_date is None:
            start_date = self.start_date
        if end_date is None:
            end_date = self.end_date
        
        # Filtr transakcí podle kategorie a data
        transactions = Transaction.objects.filter(
            user=self.user,
            type='EXPENSE',
            date__range=[start_date, end_date]
        )
        
        # Pokud má rozpočet přiřazenou kategorii, filtrujeme podle ní
        if self.category:
            transactions = transactions.filter(category=self.category)
        
        total_spent = transactions.aggregate(total=Sum('amount'))['total'] or 0
        return total_spent

class BudgetCategory(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name_plural = 'Budget categories'
        unique_together = ['budget', 'category']
    
    def __str__(self):
        return f'{self.budget.name} - {self.category.name}'
