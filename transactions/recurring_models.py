from django.db import models
from django.conf import settings
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

class RecurringTransaction(models.Model):
    """
    Model pro opakující se transakce (pravidelné platby)
    """
    FREQUENCY_CHOICES = [
        ('DAILY', 'Denně'),
        ('WEEKLY', 'Týdně'),
        ('BIWEEKLY', 'Každé 2 týdny'),
        ('MONTHLY', 'Měsíčně'),
        ('QUARTERLY', 'Čtvrtletně'),
        ('YEARLY', 'Ročně'),
    ]
    
    TRANSACTION_TYPES = [
        ('INCOME', 'Příjem'),
        ('EXPENSE', 'Výdaj'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Aktivní'),
        ('PAUSED', 'Pozastaveno'),
        ('COMPLETED', 'Dokončeno'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recurring_transactions'
    )
    name = models.CharField(max_length=200, verbose_name='Název')
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.ForeignKey(
        'transactions.Category',
        on_delete=models.SET_NULL,
        null=True,
        related_name='recurring_transactions'
    )
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    start_date = models.DateField(verbose_name='Datum začátku')
    end_date = models.DateField(null=True, blank=True, verbose_name='Datum konce')
    next_due_date = models.DateField(verbose_name='Další splatnost')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    auto_create = models.BooleanField(default=False, verbose_name='Automaticky vytvářet transakce')
    notify_before_days = models.IntegerField(default=3, verbose_name='Upozornit X dní předem')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['next_due_date']
        
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"
    
    def calculate_next_due_date(self):
        """Vypočítá další datum splatnosti"""
        current_date = self.next_due_date
        
        if self.frequency == 'DAILY':
            return current_date + timedelta(days=1)
        elif self.frequency == 'WEEKLY':
            return current_date + timedelta(weeks=1)
        elif self.frequency == 'BIWEEKLY':
            return current_date + timedelta(weeks=2)
        elif self.frequency == 'MONTHLY':
            # Posun o měsíc
            month = current_date.month + 1
            year = current_date.year
            if month > 12:
                month = 1
                year += 1
            try:
                return current_date.replace(year=year, month=month)
            except ValueError:
                # Pokud den neexistuje v novém měsíci (např. 31.1 -> 28.2)
                return current_date.replace(year=year, month=month, day=1) + timedelta(days=27)
        elif self.frequency == 'QUARTERLY':
            month = current_date.month + 3
            year = current_date.year
            while month > 12:
                month -= 12
                year += 1
            return current_date.replace(year=year, month=month)
        elif self.frequency == 'YEARLY':
            return current_date.replace(year=current_date.year + 1)
        
        return current_date
    
    def should_notify(self):
        """Zkontroluje, zda je čas upozornit uživatele"""
        today = timezone.now().date()
        notify_date = self.next_due_date - timedelta(days=self.notify_before_days)
        return today >= notify_date and self.status == 'ACTIVE'


class RecurringTransactionHistory(models.Model):
    """
    Historie vytvořených transakcí z opakující se platby
    """
    recurring_transaction = models.ForeignKey(
        RecurringTransaction,
        on_delete=models.CASCADE,
        related_name='history'
    )
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.CASCADE,
        related_name='recurring_source'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    was_auto_created = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Recurring transaction histories'
        
    def __str__(self):
        return f"{self.recurring_transaction.name} - {self.created_at.date()}"
