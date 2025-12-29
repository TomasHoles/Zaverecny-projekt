"""
serializers.py - Serializery pro aplikaci Transactions

@author Tomáš Holes
@description Obsahuje serializery pro:
    - Transakce (vytváření, výpis, validace)
    - Kategorie (vytváření, validace)
    - Opakující se transakce
"""
from rest_framework import serializers
from .models import Category, Transaction, RecurringTransaction, RecurringTransactionHistory
from accounts.models import FinancialAccount

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'category_type']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AccountSimpleSerializer(serializers.ModelSerializer):
    """Jednoduchý serializer pro účet - jen pro zobrazení v transakcích"""
    class Meta:
        model = FinancialAccount
        fields = ['id', 'name', 'color', 'icon', 'account_type']


class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    account = AccountSimpleSerializer(read_only=True, allow_null=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=FinancialAccount.objects.all(),
        source='account',
        write_only=True,
        required=False,
        allow_null=True
    )
    to_account = AccountSimpleSerializer(read_only=True, allow_null=True)
    to_account_id = serializers.PrimaryKeyRelatedField(
        queryset=FinancialAccount.objects.all(),
        source='to_account',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'category', 'category_id',
                 'account', 'account_id', 'to_account', 'to_account_id',
                 'date', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrujeme kategorie a účty pouze pro aktuálního uživatele
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            self.fields['category_id'].queryset = Category.objects.filter(user=request.user)
            self.fields['account_id'].queryset = FinancialAccount.objects.filter(user=request.user, is_active=True)
            self.fields['to_account_id'].queryset = FinancialAccount.objects.filter(user=request.user, is_active=True)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        allow_null=True,
        required=False
    )
    next_due_date = serializers.DateField(required=False, allow_null=True)
    
    class Meta:
        model = RecurringTransaction
        fields = [
            'id', 'name', 'description', 'amount', 'type', 
            'category', 'category_id', 'frequency', 'start_date', 
            'end_date', 'next_due_date', 'status', 'auto_create',
            'notify_before_days', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrujeme kategorie pouze pro aktuálního uživatele
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            self.fields['category_id'].queryset = Category.objects.filter(user=request.user)
    
    def create(self, validated_data):
        # Nastavit next_due_date na start_date pokud není zadáno
        if 'next_due_date' not in validated_data or validated_data.get('next_due_date') is None:
            validated_data['next_due_date'] = validated_data.get('start_date')
        # User se předává z perform_create ve views
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Při aktualizaci zajistit, že next_due_date není None
        if 'next_due_date' in validated_data and validated_data['next_due_date'] is None:
            validated_data['next_due_date'] = validated_data.get('start_date', instance.start_date)
        return super().update(instance, validated_data)


class RecurringTransactionHistorySerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    
    class Meta:
        model = RecurringTransactionHistory
        fields = ['id', 'transaction', 'created_at', 'was_auto_created']
