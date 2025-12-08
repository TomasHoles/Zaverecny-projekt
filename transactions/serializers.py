from rest_framework import serializers
from .models import Category, Transaction, RecurringTransaction, RecurringTransactionHistory

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'category_type']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class TransactionSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True, allow_null=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'category', 'category_id',
                 'date', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Filtrujeme kategorie pouze pro aktuálního uživatele
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            self.fields['category_id'].queryset = Category.objects.filter(user=request.user)

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
