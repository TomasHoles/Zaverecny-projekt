from django.db import models
from django.conf import settings

class Notification(models.Model):
    """
    Model pro notifikace uživatelů
    """
    NOTIFICATION_TYPES = [
        ('BUDGET_EXCEEDED', 'Překročení rozpočtu'),
        ('BUDGET_WARNING', 'Varování o rozpočtu'),
        ('RECURRING_DUE', 'Pravidelná platba'),
        ('GOAL_ACHIEVED', 'Dosažení cíle'),
        ('GOAL_PROGRESS', 'Pokrok v cíli'),
        ('MONTHLY_SUMMARY', 'Měsíční souhrn'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_budget = models.ForeignKey(
        'budgets.Budget',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    related_goal = models.ForeignKey(
        'goals.FinancialGoal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"
