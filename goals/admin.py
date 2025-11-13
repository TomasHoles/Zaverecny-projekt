from django.contrib import admin
from .models import FinancialGoal, GoalContribution


@admin.register(FinancialGoal)
class FinancialGoalAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'goal_type', 'target_amount', 'current_amount', 'progress_percentage', 'status']
    list_filter = ['status', 'goal_type', 'created_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['progress_percentage', 'remaining_amount', 'is_achieved']


@admin.register(GoalContribution)
class GoalContributionAdmin(admin.ModelAdmin):
    list_display = ['goal', 'amount', 'date', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['goal__name', 'note']
