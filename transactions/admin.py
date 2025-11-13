from django.contrib import admin
from .models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'color', 'user']
    list_filter = ['user']
    search_fields = ['name', 'description']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'type', 'amount', 'category', 'user', 'created_at']
    list_filter = ['type', 'category', 'user', 'date']
    search_fields = ['description']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']
