"""
admin.py - Admin konfigurace pro modul rozpočtů

@author Tomáš Holes
@description Registrace modelů Budget a BudgetCategory v Django admin
"""
from django.contrib import admin
from .models import Budget, BudgetCategory


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    """Admin pro model Budget - správa rozpočtů"""
    list_display = ['name', 'user', 'amount', 'period', 'category', 'is_active', 'start_date', 'end_date']
    list_filter = ['period', 'is_active', 'category', 'created_at']
    search_fields = ['name', 'user__username', 'user__email']
    date_hierarchy = 'start_date'
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Základní informace', {
            'fields': ('name', 'user', 'amount', 'category')
        }),
        ('Období', {
            'fields': ('period', 'start_date', 'end_date')
        }),
        ('Stav', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BudgetCategory)
class BudgetCategoryAdmin(admin.ModelAdmin):
    """Admin pro model BudgetCategory - přiřazení kategorií k rozpočtům"""
    list_display = ['budget', 'category', 'allocated_amount']
    list_filter = ['budget', 'category']
    search_fields = ['budget__name', 'category__name']
    ordering = ['budget', 'category']
