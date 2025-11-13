from rest_framework import serializers
from .models import FinancialGoal, GoalContribution
from django.utils import timezone


class GoalContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoalContribution
        fields = ['id', 'amount', 'date', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class FinancialGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    is_achieved = serializers.ReadOnlyField()
    contributions = GoalContributionSerializer(many=True, read_only=True)
    
    class Meta:
        model = FinancialGoal
        fields = [
            'id', 'name', 'description', 'goal_type', 'target_amount',
            'current_amount', 'target_date', 'status', 'icon', 'color',
            'created_at', 'updated_at', 'completed_at',
            'progress_percentage', 'remaining_amount', 'is_achieved',
            'contributions'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Automaticky nastavit completed_at když je cíl dosažen
        if validated_data.get('status') == 'COMPLETED' and not instance.completed_at:
            validated_data['completed_at'] = timezone.now()
        return super().update(instance, validated_data)
