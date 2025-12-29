"""
views.py - ViewSety pro aplikaci Analytics

@author Tomáš Holes
@description Obsahuje logiku pro pokročilou analytiku a insights:
    - Přehledy (overview) s dynamickou granularitou (denní/týdenní/měsíční)
    - Heatmapy aktivity
    - Analýza vzorů utrácení (spending patterns)
    - Automatické insights (detekce neobvyklých výdajů, rady)
    - Finanční zdraví (scoring system)
"""
from django.shortcuts import render
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict
import calendar

from transactions.models import Transaction, Category
from budgets.models import Budget
from goals.models import FinancialGoal
from .serializers import (
    AnalyticsSerializer, 
    SpendingPatternSerializer,
    FinancialInsightSerializer,
    TrendAnalysisSerializer,
    CategoryBreakdownSerializer
)


class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet pro pokročilou analytiku a insights.
    Nepoužívá standardní model queryset, ale agreguje data z transakcí.
    """
    permission_classes = [IsAuthenticated]

    def _get_date_range(self, time_range):
        """Vypočítá datum range podle time_range parametru"""
        end_date = timezone.now().date()
        
        range_map = {
            '1m': 30,
            '3m': 90,
            '6m': 180,
            '1y': 365,
            'all': None
        }
        
        days = range_map.get(time_range, 180)  # default 6 měsíců
        
        if days:
            start_date = end_date - timedelta(days=days)
        else:
            # Pro 'all' vezmi nejstarší transakci
            oldest = Transaction.objects.filter(user=self.request.user).order_by('date').first()
            start_date = oldest.date if oldest else end_date - timedelta(days=365)
        
        return start_date, end_date

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Základní analytický přehled s grafy a statistikami
        """
        time_range = request.query_params.get('time_range', '6m')
        start_date, end_date = self._get_date_range(time_range)
        
        # Filtr transakcí pro daného uživatele a období
        transactions = Transaction.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        )
        
        # Celkové příjmy a výdaje
        income_total = transactions.filter(type='INCOME').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        expense_total = transactions.filter(type='EXPENSE').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        savings_total = income_total - expense_total
        
        # Data podle kategorií
        category_data = transactions.filter(
            type='EXPENSE',
            category__isnull=False
        ).values(
            'category__name', 'category__icon', 'category__color'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Měsíční data - dynamická granularita podle období
        monthly_data = []
        
        # Zjisti počet dní v období
        days_diff = (end_date - start_date).days + 1
        
        if days_diff <= 60:  # Do 2 měsíců - denní granularita (30-60 sloupců)
            temp_date = start_date
            while temp_date <= end_date:
                day_income = transactions.filter(
                    type='INCOME',
                    date=temp_date
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                day_expenses = transactions.filter(
                    type='EXPENSE',
                    date=temp_date
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                monthly_data.append({
                    'month': temp_date.strftime('%d.%m'),
                    'month_name': temp_date.strftime('%d. %B'),
                    'income': float(day_income),
                    'expenses': float(day_expenses),
                    'savings': float(day_income - day_expenses)
                })
                
                temp_date += timedelta(days=1)
                
        elif days_diff <= 180:  # 3-6 měsíců - týdenní granularita (12-25 týdnů)
            temp_date = start_date
            week_num = 1
            while temp_date <= end_date:
                week_end = min(temp_date + timedelta(days=6), end_date)
                
                week_income = transactions.filter(
                    type='INCOME',
                    date__range=[temp_date, week_end]
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                week_expenses = transactions.filter(
                    type='EXPENSE',
                    date__range=[temp_date, week_end]
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                monthly_data.append({
                    'month': f'T{week_num}',
                    'month_name': f'Týden {week_num} ({temp_date.strftime("%d.%m")} - {week_end.strftime("%d.%m")})',
                    'income': float(week_income),
                    'expenses': float(week_expenses),
                    'savings': float(week_income - week_expenses)
                })
                
                temp_date = week_end + timedelta(days=1)
                week_num += 1
                
        else:  # Více než 6 měsíců - měsíční granularita (12+ měsíců)
            current_date = start_date
            while current_date <= end_date:
                month_start = current_date.replace(day=1)
                last_day = calendar.monthrange(current_date.year, current_date.month)[1]
                month_end = current_date.replace(day=last_day)
                
                month_income = transactions.filter(
                    type='INCOME',
                    date__range=[month_start, month_end]
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                month_expenses = transactions.filter(
                    type='EXPENSE',
                    date__range=[month_start, month_end]
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
                
                monthly_data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'month_name': month_start.strftime('%B %Y'),
                    'income': float(month_income),
                    'expenses': float(month_expenses),
                    'savings': float(month_income - month_expenses)
                })
                
                # Přejdi na další měsíc
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
        
        # Transakce pro vizualizace
        transactions_list = list(transactions.values(
            'date', 'amount', 'type', 'category__name'
        ).order_by('-date'))
        
        # Převod na JSON serializovatelný formát
        transactions_data = [
            {
                'date': t['date'].isoformat(),
                'amount': float(t['amount']),
                'type': t['type'],
                'category': t['category__name']
            }
            for t in transactions_list
        ]
        
        analytics_data = {
            'total_income': float(income_total),
            'total_expenses': float(expense_total),
            'total_savings': float(savings_total),
            'category_data': [
                {
                    'category__name': item['category__name'],
                    'category__icon': item['category__icon'],
                    'category__color': item['category__color'],
                    'total': float(item['total'])
                }
                for item in category_data
            ],
            'monthly_data': monthly_data,
            'transactions': transactions_data
        }
        
        return Response(analytics_data)

    @action(detail=False, methods=['get'])
    def heatmap(self, request):
        """
        Denní data pro heatmap kalendář - zobrazuje aktivitu za posledních N měsíců
        """
        months = int(request.query_params.get('months', 3))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 31)  # Přibližně N měsíců
        
        # Získat všechny transakce za období
        transactions = Transaction.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        )
        
        # Agregovat podle dní
        daily_data = {}
        
        # Inicializovat všechny dny v rozsahu
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.isoformat()
            daily_data[date_str] = {
                'date': date_str,
                'income': 0,
                'expenses': 0,
                'transaction_count': 0,
                'balance': 0
            }
            current_date += timedelta(days=1)
        
        # Naplnit daty z transakcí
        for tx in transactions:
            date_str = tx.date.isoformat()
            if date_str in daily_data:
                if tx.type == 'INCOME':
                    daily_data[date_str]['income'] += float(tx.amount)
                elif tx.type == 'EXPENSE':
                    daily_data[date_str]['expenses'] += float(tx.amount)
                daily_data[date_str]['transaction_count'] += 1
        
        # Vypočítat bilanci pro každý den
        for date_str in daily_data:
            daily_data[date_str]['balance'] = (
                daily_data[date_str]['income'] - daily_data[date_str]['expenses']
            )
        
        # Převést na seznam seřazený podle data
        result = list(daily_data.values())
        result.sort(key=lambda x: x['date'])
        
        # Statistiky
        total_transactions = sum(d['transaction_count'] for d in result)
        active_days = sum(1 for d in result if d['transaction_count'] > 0)
        total_income = sum(d['income'] for d in result)
        total_expenses = sum(d['expenses'] for d in result)
        
        return Response({
            'daily_data': result,
            'stats': {
                'total_transactions': total_transactions,
                'active_days': active_days,
                'total_days': len(result),
                'total_income': total_income,
                'total_expenses': total_expenses,
                'balance': total_income - total_expenses
            }
        })

    @action(detail=False, methods=['get'])
    def spending_patterns(self, request):
        """
        Analýza vzorů utrácení - průměry, frekvence, trendy
        """
        time_range = request.query_params.get('time_range', '3m')
        start_date, end_date = self._get_date_range(time_range)
        
        transactions = Transaction.objects.filter(
            user=request.user,
            type='EXPENSE',
            date__range=[start_date, end_date],
            category__isnull=False
        )
        
        total_expenses = transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        patterns = []
        categories = transactions.values('category__name').distinct()
        
        for cat in categories:
            cat_name = cat['category__name']
            cat_transactions = transactions.filter(category__name=cat_name)
            
            cat_total = cat_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            cat_count = cat_transactions.count()
            cat_avg = cat_total / cat_count if cat_count > 0 else Decimal('0')
            
            # Vypočítej trend (porovnej první a druhou polovinu období)
            mid_date = start_date + (end_date - start_date) / 2
            first_half = cat_transactions.filter(date__lt=mid_date).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            second_half = cat_transactions.filter(date__gte=mid_date).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            if first_half > 0:
                change = ((second_half - first_half) / first_half) * 100
                if change > 10:
                    trend = 'increasing'
                elif change < -10:
                    trend = 'decreasing'
                else:
                    trend = 'stable'
            else:
                trend = 'new' if second_half > 0 else 'stable'
            
            percentage = (cat_total / total_expenses * 100) if total_expenses > 0 else Decimal('0')
            
            patterns.append({
                'category': cat_name,
                'average_amount': float(cat_avg),
                'frequency': cat_count,
                'trend': trend,
                'percentage_of_total': float(percentage)
            })
        
        # Seřaď podle celkové částky
        patterns.sort(key=lambda x: x['average_amount'] * x['frequency'], reverse=True)
        
        return Response(patterns)

    @action(detail=False, methods=['get'])
    def insights(self, request):
        """
        Automatické finanční insights a doporučení
        """
        insights = []
        time_range = request.query_params.get('time_range', '1m')
        start_date, end_date = self._get_date_range(time_range)
        
        transactions = Transaction.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        )
        
        # 1. Kontrola překročení rozpočtu
        active_budgets = Budget.objects.filter(
            user=request.user,
            is_active=True,
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        
        for budget in active_budgets:
            spent = budget.get_spent_amount(start_date, end_date)
            percentage = (spent / budget.amount * 100) if budget.amount > 0 else 0
            
            if percentage >= 100:
                # Nezobrazovat insight „Rozpočet překročen“ v analytice
                continue
            elif percentage >= 80:
                insights.append({
                    'type': 'warning',
                    'title': f'Pozor: {budget.name}',
                    'message': f'Využili jste {percentage:.0f}% rozpočtu',
                    'category': budget.category.name if budget.category else None,
                    'amount': float(budget.amount - spent),
                    'priority': 3
                })
        
        # 2. Neobvykle vysoké výdaje
        avg_daily = transactions.filter(type='EXPENSE').aggregate(
            avg=Avg('amount')
        )['avg'] or Decimal('0')
        
        high_expenses = transactions.filter(
            type='EXPENSE',
            amount__gte=avg_daily * 2
        ).order_by('-amount')[:3]
        
        for expense in high_expenses:
            insights.append({
                'type': 'info',
                'title': 'Neobvyklý výdaj detekován',
                'message': f'{expense.description or "Bez popisu"} - {float(expense.amount):.2f} Kč',
                'category': expense.category.name if expense.category else None,
                'amount': float(expense.amount),
                'priority': 2
            })
        
        # 3. Úspěšné úspory
        income_total = transactions.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        expense_total = transactions.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        savings = income_total - expense_total
        
        if savings > 0:
            savings_rate = (savings / income_total * 100) if income_total > 0 else 0
            if savings_rate >= 20:
                insights.append({
                    'type': 'achievement',
                    'title': 'Skvělá úspornost!',
                    'message': f'Ušetřili jste {savings_rate:.1f}% příjmů ({float(savings):.2f} Kč)',
                    'category': None,
                    'amount': float(savings),
                    'priority': 4
                })
        else:
            insights.append({
                'type': 'warning',
                'title': 'Záporná bilance',
                'message': f'Tento měsíc utrácíte více než vyděláváte ({float(abs(savings)):.2f} Kč)',
                'category': None,
                'amount': float(abs(savings)),
                'priority': 5
            })
        
        # 4. Doporučení na základě vzorů
        top_category = transactions.filter(
            type='EXPENSE',
            category__isnull=False
        ).values('category__name').annotate(
            total=Sum('amount')
        ).order_by('-total').first()
        
        if top_category:
            category_total = top_category['total']
            percentage = (category_total / expense_total * 100) if expense_total > 0 else 0
            
            if percentage > 30:
                insights.append({
                    'type': 'tip',
                    'title': f'Tip: Snižte výdaje v kategorii {top_category["category__name"]}',
                    'message': f'Tato kategorie tvoří {percentage:.1f}% vašich výdajů',
                    'category': top_category['category__name'],
                    'amount': float(category_total),
                    'priority': 3
                })
        
        # Seřaď podle priority
        insights.sort(key=lambda x: x['priority'], reverse=True)
        
        return Response(insights[:10])  # Vrať top 10 insights

    @action(detail=False, methods=['get'])
    def trends(self, request):
        """
        Analýza trendů - porovnání období
        """
        time_range = request.query_params.get('time_range', '3m')
        start_date, end_date = self._get_date_range(time_range)
        
        # Aktuální období
        current_transactions = Transaction.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        )
        
        # Předchozí období (stejná délka)
        period_length = (end_date - start_date).days
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_length)
        
        previous_transactions = Transaction.objects.filter(
            user=request.user,
            date__range=[prev_start, prev_end]
        )
        
        trends = []
        
        # Trend příjmů
        current_income = current_transactions.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        previous_income = previous_transactions.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        income_change = current_income - previous_income
        income_change_pct = (income_change / previous_income * 100) if previous_income > 0 else 0
        
        trends.append({
            'period': f'{start_date} - {end_date}',
            'metric': 'income',
            'trend': 'up' if income_change > 0 else 'down' if income_change < 0 else 'stable',
            'change_percentage': float(income_change_pct),
            'change_amount': float(income_change),
            'comparison_text': f'{"Nárůst" if income_change > 0 else "Pokles"} o {abs(float(income_change_pct)):.1f}% oproti předchozímu období'
        })
        
        # Trend výdajů
        current_expenses = current_transactions.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        previous_expenses = previous_transactions.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        expense_change = current_expenses - previous_expenses
        expense_change_pct = (expense_change / previous_expenses * 100) if previous_expenses > 0 else 0
        
        trends.append({
            'period': f'{start_date} - {end_date}',
            'metric': 'expenses',
            'trend': 'up' if expense_change > 0 else 'down' if expense_change < 0 else 'stable',
            'change_percentage': float(expense_change_pct),
            'change_amount': float(expense_change),
            'comparison_text': f'{"Nárůst" if expense_change > 0 else "Pokles"} o {abs(float(expense_change_pct)):.1f}% oproti předchozímu období'
        })
        
        # Trend úspor
        current_savings = current_income - current_expenses
        previous_savings = previous_income - previous_expenses
        savings_change = current_savings - previous_savings
        savings_change_pct = (savings_change / previous_savings * 100) if previous_savings != 0 else 0
        
        trends.append({
            'period': f'{start_date} - {end_date}',
            'metric': 'savings',
            'trend': 'up' if savings_change > 0 else 'down' if savings_change < 0 else 'stable',
            'change_percentage': float(savings_change_pct),
            'change_amount': float(savings_change),
            'comparison_text': f'{"Lepší" if savings_change > 0 else "Horší"} bilance o {abs(float(savings_change)):.2f} Kč'
        })
        
        return Response(trends)

    @action(detail=False, methods=['get'])
    def category_breakdown(self, request):
        """
        Detailní rozpis kategorií s trendy
        """
        time_range = request.query_params.get('time_range', '3m')
        start_date, end_date = self._get_date_range(time_range)
        
        transactions = Transaction.objects.filter(
            user=request.user,
            type='EXPENSE',
            date__range=[start_date, end_date],
            category__isnull=False
        )
        
        total_expenses = transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        breakdown = transactions.values(
            'category__name', 'category__icon', 'category__color'
        ).annotate(
            total_amount=Sum('amount'),
            transaction_count=Count('id'),
            average_transaction=Avg('amount')
        ).order_by('-total_amount')
        
        result = []
        for item in breakdown:
            percentage = (item['total_amount'] / total_expenses * 100) if total_expenses > 0 else 0
            
            # Vypočítej trend
            mid_date = start_date + (end_date - start_date) / 2
            first_half = transactions.filter(
                category__name=item['category__name'],
                date__lt=mid_date
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            second_half = transactions.filter(
                category__name=item['category__name'],
                date__gte=mid_date
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            if first_half > 0:
                change = ((second_half - first_half) / first_half) * 100
                trend = 'increasing' if change > 10 else 'decreasing' if change < -10 else 'stable'
            else:
                trend = 'new'
            
            result.append({
                'category_name': item['category__name'],
                'category_icon': item['category__icon'],
                'category_color': item['category__color'],
                'total_amount': float(item['total_amount']),
                'transaction_count': item['transaction_count'],
                'percentage': float(percentage),
                'average_transaction': float(item['average_transaction']),
                'trend': trend
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def income_breakdown(self, request):
        """
        Detailní rozpis kategorií příjmů
        """
        time_range = request.query_params.get('time_range', '1m')
        start_date, end_date = self._get_date_range(time_range)
        
        transactions = Transaction.objects.filter(
            user=request.user,
            type='INCOME',
            date__range=[start_date, end_date],
            category__isnull=False
        )
        
        total_income = transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        breakdown = transactions.values(
            'category__name', 'category__icon', 'category__color'
        ).annotate(
            total_amount=Sum('amount'),
            transaction_count=Count('id')
        ).order_by('-total_amount')
        
        result = []
        for item in breakdown:
            percentage = (item['total_amount'] / total_income * 100) if total_income > 0 else 0
            
            result.append({
                'category_name': item['category__name'],
                'category_icon': item['category__icon'],
                'category_color': item['category__color'],
                'total_amount': float(item['total_amount']),
                'transaction_count': item['transaction_count'],
                'percentage': float(percentage)
            })
        
        return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financial_health_score(request):
    """
    Vypočítá celkové skóre finančního zdraví (0-100)
    """
    user = request.user
    score = 0
    details = {}
    
    # 1. Savings rate (max 30 bodů)
    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    recent_transactions = Transaction.objects.filter(
        user=user,
        date__gte=thirty_days_ago
    )
    
    income = recent_transactions.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    expenses = recent_transactions.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    if income > 0:
        savings_rate = ((income - expenses) / income) * 100
        savings_score = min(30, max(0, savings_rate * 1.5))  # 20% savings = 30 bodů
        score += savings_score
        details['savings_rate'] = {
            'score': float(savings_score),
            'value': float(savings_rate),
            'message': f'Úspornost: {savings_rate:.1f}%'
        }
    
    # 2. Budget adherence (max 25 bodů)
    active_budgets = Budget.objects.filter(user=user, is_active=True)
    if active_budgets.exists():
        budget_scores = []
        for budget in active_budgets:
            spent = budget.get_spent_amount()
            if budget.amount > 0:
                usage = (spent / budget.amount) * 100
                # Ideální je 70-90% využití
                if 70 <= usage <= 90:
                    budget_scores.append(25)
                elif usage < 70:
                    budget_scores.append(20)
                elif usage <= 100:
                    budget_scores.append(15)
                else:
                    budget_scores.append(5)
        
        budget_score = sum(budget_scores) / len(budget_scores) if budget_scores else 0
        score += budget_score
        details['budget_adherence'] = {
            'score': float(budget_score),
            'message': f'{len(active_budgets)} aktivních rozpočtů'
        }
    
    # 3. Financial goals progress (max 25 bodů)
    active_goals = FinancialGoal.objects.filter(user=user, status='ACTIVE')
    if active_goals.exists():
        goal_progress = []
        for goal in active_goals:
            goal_progress.append(goal.progress_percentage)
        
        avg_progress = sum(goal_progress) / len(goal_progress)
        goal_score = (avg_progress / 100) * 25
        score += goal_score
        details['goals_progress'] = {
            'score': float(goal_score),
            'value': float(avg_progress),
            'message': f'{len(active_goals)} aktivních cílů, průměrný pokrok {avg_progress:.1f}%'
        }
    
    # 4. Financial consistency (max 20 bodů)
    # Konzistence v transakcích (pravidelnost)
    transaction_count = recent_transactions.count()
    if transaction_count >= 10:
        consistency_score = min(20, transaction_count / 2)
        score += consistency_score
        details['consistency'] = {
            'score': float(consistency_score),
            'message': f'{transaction_count} transakcí za poslední měsíc'
        }
    
    return Response({
        'score': round(float(score), 1),
        'max_score': 100,
        'rating': 'Výborné' if score >= 80 else 'Dobré' if score >= 60 else 'Průměrné' if score >= 40 else 'Vyžaduje zlepšení',
        'details': details,
        'recommendations': _get_recommendations(score, details)
    })


def _get_recommendations(score, details):
    """Generuj doporučení na základě skóre"""
    recommendations = []
    
    if 'savings_rate' in details and details['savings_rate']['value'] < 10:
        recommendations.append('Zvyšte míru úspor alespoň na 10% příjmů')
    
    if 'goals_progress' not in details:
        recommendations.append('Vytvořte si finanční cíle pro lepší motivaci')
    
    if 'budget_adherence' not in details:
        recommendations.append('Nastavte si měsíční rozpočty pro kontrolu výdajů')
    
    if score < 60:
        recommendations.append('Pravidelně sledujte své finance a aktualizujte transakce')
    
    return recommendations
