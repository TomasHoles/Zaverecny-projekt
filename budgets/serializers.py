from rest_framework import serializers
from .models import Budget, BudgetCategory

class BudgetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetCategory
        fields = ['id', 'name', 'description', 'user']
        read_only_fields = ['user']

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'name', 'amount', 'start_date', 'end_date', 'category', 'user']
        read_only_fields = ['user']