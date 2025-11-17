from rest_framework import serializers


class AnalyticsSerializer(serializers.Serializer):
    """
    Serializer pro analytická data
    """
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_savings = serializers.DecimalField(max_digits=12, decimal_places=2)
    category_data = serializers.ListField()
    monthly_data = serializers.ListField()


class SpendingPatternSerializer(serializers.Serializer):
    """
    Serializer pro vzory utrácení
    """
    category = serializers.CharField()
    average_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    frequency = serializers.IntegerField()
    trend = serializers.CharField()  # 'increasing', 'decreasing', 'stable'
    percentage_of_total = serializers.DecimalField(max_digits=5, decimal_places=2)


class FinancialInsightSerializer(serializers.Serializer):
    """
    Serializer pro finanční insights a doporučení
    """
    type = serializers.CharField()  # 'warning', 'tip', 'achievement', 'info'
    title = serializers.CharField()
    message = serializers.CharField()
    category = serializers.CharField(required=False, allow_null=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    priority = serializers.IntegerField()  # 1-5, 5 being highest


class TrendAnalysisSerializer(serializers.Serializer):
    """
    Serializer pro analýzu trendů
    """
    period = serializers.CharField()
    metric = serializers.CharField()  # 'income', 'expenses', 'savings'
    trend = serializers.CharField()  # 'up', 'down', 'stable'
    change_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    change_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    comparison_text = serializers.CharField()


class CategoryBreakdownSerializer(serializers.Serializer):
    """
    Serializer pro detailní rozpis kategorií
    """
    category_name = serializers.CharField()
    category_icon = serializers.CharField()
    category_color = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_transaction = serializers.DecimalField(max_digits=12, decimal_places=2)
    trend = serializers.CharField()
