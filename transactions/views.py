from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Získá základní statistiky pro dashboard"""
        user = request.user
        
        # Celkové příjmy
        total_income = Transaction.objects.filter(
            user=user,
            type='INCOME'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Celkové výdaje
        total_expenses = Transaction.objects.filter(
            user=user,
            type='EXPENSE'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Zůstatek
        balance = total_income - total_expenses
        
        # Posledních 5 transakcí
        recent_transactions = Transaction.objects.filter(
            user=user
        ).order_by('-date')[:5]
        
        serializer = self.get_serializer(recent_transactions, many=True)
        
        return Response({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'balance': float(balance),
            'recent_transactions': serializer.data
        })

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Získá analytická data"""
        user = request.user
        time_range = request.query_params.get('time_range', '6m')
        
        # Výpočet data podle časového rozsahu
        if time_range == '1m':
            start_date = timezone.now() - timedelta(days=30)
        elif time_range == '3m':
            start_date = timezone.now() - timedelta(days=90)
        else:  # 6m
            start_date = timezone.now() - timedelta(days=180)
        
        # Celkové příjmy a výdaje v daném období
        total_income = Transaction.objects.filter(
            user=user,
            type='INCOME',
            date__gte=start_date
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_expenses = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            date__gte=start_date
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_savings = total_income - total_expenses
        
        # Data podle kategorií
        category_data = Transaction.objects.filter(
            user=user,
            type='EXPENSE',
            date__gte=start_date
        ).values('category__name').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Měsíční data
        monthly_data = []
        for i in range(6):
            month_start = timezone.now() - timedelta(days=30*(i+1))
            month_end = timezone.now() - timedelta(days=30*i)
            
            month_income = Transaction.objects.filter(
                user=user,
                type='INCOME',
                date__gte=month_start,
                date__lt=month_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            month_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=month_start,
                date__lt=month_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'income': float(month_income),
                'expenses': float(month_expenses),
                'savings': float(month_income - month_expenses)
            })
        
        return Response({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'total_savings': float(total_savings),
            'category_data': list(category_data),
            'monthly_data': monthly_data
        })
