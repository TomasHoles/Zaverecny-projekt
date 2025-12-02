from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from datetime import datetime, timedelta
from .models import Budget, BudgetCategory
from .serializers import BudgetSerializer, BudgetCategorySerializer
from .services import BudgetAlertService

class BudgetCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetCategorySerializer

    def get_queryset(self):
        return BudgetCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Přehled rozpočtů a jejich využití"""
        user = request.user
        
        # Získání všech aktivních rozpočtů uživatele
        budgets = Budget.objects.filter(user=user, is_active=True)
        
        budget_data = []
        total_budget = 0
        total_spent = 0
        
        for budget in budgets:
            # Výpočet utracené částky za aktuální měsíc
            current_month = datetime.now().replace(day=1)
            spent_amount = budget.get_spent_amount(current_month)
            
            budget_info = {
                'id': budget.id,
                'name': budget.name,
                'amount': float(budget.amount),
                'spent': float(spent_amount),
                'remaining': float(budget.amount - spent_amount),
                'percentage_used': (spent_amount / budget.amount * 100) if budget.amount > 0 else 0,
                'category': budget.category.name if budget.category else None,
                'category_icon': budget.category.icon if budget.category else 'wallet',
                'category_color': budget.category.color if budget.category else '#8b5cf6',
                'period': budget.period,
                'is_active': budget.is_active
            }
            
            budget_data.append(budget_info)
            total_budget += budget.amount
            total_spent += spent_amount
        
        return Response({
            'budgets': budget_data,
            'total_budget': float(total_budget),
            'total_spent': float(total_spent),
            'total_remaining': float(total_budget - total_spent),
            'overall_percentage': (total_spent / total_budget * 100) if total_budget > 0 else 0
        })
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Získá detailní status rozpočtu včetně alert informací"""
        budget = self.get_object()
        status_data = BudgetAlertService.get_budget_status(budget)
        
        return Response({
            'budget_id': budget.id,
            'name': budget.name,
            'amount': float(budget.amount),
            'category': budget.category.name if budget.category else None,
            **status_data
        })
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Vrací všechny rozpočty s jejich alert statusy"""
        user = request.user
        budgets = Budget.objects.filter(user=user, is_active=True)
        
        alerts = []
        for budget in budgets:
            status_data = BudgetAlertService.get_budget_status(budget)
            
            # Přidej pouze rozpočty, které mají warning nebo horší
            if status_data['status'] in ['warning', 'danger', 'exceeded']:
                alerts.append({
                    'budget_id': budget.id,
                    'name': budget.name,
                    'amount': float(budget.amount),
                    'category': budget.category.name if budget.category else None,
                    **status_data
                })
        
        return Response({
            'alerts': alerts,
            'count': len(alerts)
        })
    
    @action(detail=False, methods=['post'])
    def check_all_budgets(self, request):
        """Manuální kontrola všech rozpočtů a vytvoření notifikací"""
        user = request.user
        notifications = BudgetAlertService.check_budget_alerts(user)
        
        return Response({
            'message': f'Vytvořeno {len(notifications)} nových notifikací',
            'notifications': [
                {
                    'title': n.title,
                    'message': n.message,
                    'priority': n.priority
                } for n in notifications
            ]
        })
