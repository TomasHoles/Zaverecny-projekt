from django.db import models
from django.conf import settings
from transactions.models import Category

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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class BudgetCategory(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name_plural = 'Budget categories'
        unique_together = ['budget', 'category']
    
    def __str__(self):
        return f'{self.budget.name} - {self.category.name}'
