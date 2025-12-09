from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, FinancialAccount

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Preferences', {'fields': ('currency_preference',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                   'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )


class FinancialAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'account_type', 'initial_balance', 'currency', 'is_active', 'is_default')
    list_filter = ('account_type', 'is_active', 'is_default', 'currency')
    search_fields = ('name', 'user__username', 'user__email')
    ordering = ('user', 'name')
    
    fieldsets = (
        (None, {'fields': ('user', 'name', 'account_type')}),
        ('Finance', {'fields': ('initial_balance', 'currency')}),
        ('Appearance', {'fields': ('color', 'icon')}),
        ('Settings', {'fields': ('is_active', 'is_default', 'include_in_total', 'description')}),
    )


admin.site.register(User, CustomUserAdmin)
admin.site.register(FinancialAccount, FinancialAccountAdmin)
