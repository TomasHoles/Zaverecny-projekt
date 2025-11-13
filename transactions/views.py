from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv
import json
from .models import Transaction, Category, RecurringTransaction, RecurringTransactionHistory
from .serializers import TransactionSerializer, CategorySerializer, RecurringTransactionSerializer, RecurringTransactionHistorySerializer
from notifications.models import Notification

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_defaults(self, request):
        """Vytvoří výchozí kategorie pro uživatele"""
        user = request.user
        
        default_categories = [
            {'name': 'Jídlo a nápoje', 'icon': '🍔', 'color': '#FF6B6B', 'description': 'Nákupy potravin, restaurace', 'category_type': 'EXPENSE'},
            {'name': 'Doprava', 'icon': '🚗', 'color': '#4ECDC4', 'description': 'MHD, benzín, taxi', 'category_type': 'EXPENSE'},
            {'name': 'Bydlení', 'icon': '🏠', 'color': '#45B7D1', 'description': 'Nájem, energie, opravy', 'category_type': 'EXPENSE'},
            {'name': 'Zábava', 'icon': '🎮', 'color': '#F7DC6F', 'description': 'Kino, sport, hobby', 'category_type': 'EXPENSE'},
            {'name': 'Oblečení', 'icon': '👕', 'color': '#BB8FCE', 'description': 'Oblečení a obuv', 'category_type': 'EXPENSE'},
            {'name': 'Zdraví', 'icon': '💊', 'color': '#85C1E2', 'description': 'Léky, lékař, fitness', 'category_type': 'EXPENSE'},
            {'name': 'Vzdělání', 'icon': '📚', 'color': '#52B788', 'description': 'Kurzy, knihy, škola', 'category_type': 'EXPENSE'},
            {'name': 'Ostatní výdaje', 'icon': '💸', 'color': '#95A5A6', 'description': 'Ostatní výdaje', 'category_type': 'EXPENSE'},
            {'name': 'Mzda', 'icon': '💰', 'color': '#2ECC71', 'description': 'Pravidelný příjem z práce', 'category_type': 'INCOME'},
            {'name': 'Investice', 'icon': '📈', 'color': '#3498DB', 'description': 'Výnosy z investic', 'category_type': 'INCOME'},
            {'name': 'Dary', 'icon': '🎁', 'color': '#E74C3C', 'description': 'Dárky od rodiny a přátel', 'category_type': 'INCOME'},
            {'name': 'Ostatní příjmy', 'icon': '💵', 'color': '#16A085', 'description': 'Ostatní příjmy', 'category_type': 'INCOME'},
        ]
        
        created_count = 0
        for cat_data in default_categories:
            category, created = Category.objects.get_or_create(
                user=user,
                name=cat_data['name'],
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'description': cat_data['description'],
                    'category_type': cat_data['category_type']
                }
            )
            if created:
                created_count += 1
        
        return Response({
            'message': f'Vytvořeno {created_count} nových kategorií',
            'total_categories': Category.objects.filter(user=user).count()
        }, status=status.HTTP_201_CREATED)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        """
        Vrací transakce uživatele s podporou filtrování a vyhledávání.
        
        Query parametry:
        - search: vyhledávání v popisu transakce
        - type: filtr podle typu (INCOME, EXPENSE, TRANSFER)
        - category: filtr podle ID kategorie
        - date_from: datum od (YYYY-MM-DD)
        - date_to: datum do (YYYY-MM-DD)
        - ordering: řazení (-date, date, -amount, amount)
        """
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Vyhledávání v popisu
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )
        
        # Filtr podle typu transakce
        transaction_type = self.request.query_params.get('type', None)
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        
        # Filtr podle kategorie
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filtr podle data (od)
        date_from = self.request.query_params.get('date_from', None)
        if date_from:
            try:
                queryset = queryset.filter(date__gte=date_from)
            except ValueError:
                pass  # Ignorovat neplatné datum
        
        # Filtr podle data (do)
        date_to = self.request.query_params.get('date_to', None)
        if date_to:
            try:
                queryset = queryset.filter(date__lte=date_to)
            except ValueError:
                pass  # Ignorovat neplatné datum
        
        # Řazení
        ordering = self.request.query_params.get('ordering', '-date')
        allowed_orderings = ['date', '-date', 'amount', '-amount', 'created_at', '-created_at']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering, '-created_at')
        else:
            queryset = queryset.order_by('-date', '-created_at')
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Získá základní statistiky pro dashboard"""
        try:
            user = request.user
            now = timezone.now()
            current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
            
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
            
            # Top 3 výdajové kategorie (aktuální měsíc)
            top_categories = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=current_month_start
            ).values(
                'category__name',
                'category__icon',
                'category__color'
            ).annotate(
                total=Sum('amount')
            ).order_by('-total')[:3]
            
            # Celkové výdaje aktuálního měsíce pro výpočet procent
            current_month_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=current_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Formátování top kategorií s procenty
            top_expense_categories = []
            for cat in top_categories:
                total = float(cat['total']) if cat['total'] else 0
                percentage = (total / float(current_month_expenses) * 100) if current_month_expenses > 0 else 0
                top_expense_categories.append({
                    'name': cat['category__name'] or 'Bez kategorie',
                    'icon': cat['category__icon'] or 'wallet',
                    'color': cat['category__color'] or '#3B82F6',
                    'total': total,
                    'percentage': percentage
                })
            
            # Aktuální měsíc úspory
            current_month_income = Transaction.objects.filter(
                user=user,
                type='INCOME',
                date__gte=current_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            current_month_savings = float(current_month_income) - float(current_month_expenses)
            
            # Předchozí měsíc úspory
            previous_month_income = Transaction.objects.filter(
                user=user,
                type='INCOME',
                date__gte=previous_month_start,
                date__lt=current_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            previous_month_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=previous_month_start,
                date__lt=current_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            previous_month_savings = float(previous_month_income) - float(previous_month_expenses)
            
            # Výpočet změny v procentech
            if previous_month_savings != 0:
                savings_change = ((current_month_savings - previous_month_savings) / abs(previous_month_savings)) * 100
            elif current_month_savings != 0:
                savings_change = 100.0  # Nové úspory
            else:
                savings_change = 0.0
            
            serializer = self.get_serializer(recent_transactions, many=True)
            
            return Response({
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'balance': float(balance),
                'recent_transactions': serializer.data,
                'top_expense_categories': top_expense_categories,
                'current_month_savings': current_month_savings,
                'savings_change': savings_change
            })
        except Exception as e:
            print(f"Error in dashboard_stats: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e),
                'total_income': 0,
                'total_expenses': 0,
                'balance': 0,
                'recent_transactions': [],
                'top_expense_categories': [],
                'current_month_savings': 0,
                'savings_change': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export transakcí do CSV"""
        # Získat parametry filtru
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = self.get_queryset()
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Vytvoření CSV response
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="transakce_{timezone.now().strftime("%Y%m%d")}.csv"'
        response.write('\ufeff')  # UTF-8 BOM pro Excel
        
        writer = csv.writer(response)
        writer.writerow(['Datum', 'Popis', 'Kategorie', 'Typ', 'Částka'])
        
        for transaction in queryset:
            writer.writerow([
                transaction.date.strftime('%Y-%m-%d'),
                transaction.description,
                transaction.category.name if transaction.category else 'Bez kategorie',
                'Příjem' if transaction.type == 'INCOME' else 'Výdaj',
                float(transaction.amount)
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def export_json(self, request):
        """Export transakcí do JSON"""
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = self.get_queryset()
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        data = []
        for transaction in queryset:
            data.append({
                'id': transaction.id,
                'date': transaction.date.strftime('%Y-%m-%d'),
                'description': transaction.description,
                'category': transaction.category.name if transaction.category else None,
                'type': transaction.type,
                'amount': float(transaction.amount)
            })
        
        response = HttpResponse(json.dumps(data, indent=2, ensure_ascii=False), content_type='application/json; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="transakce_{timezone.now().strftime("%Y%m%d")}.json"'
        
        return response


class RecurringTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pro správu opakujících se transakcí
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RecurringTransactionSerializer
    
    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_transaction(self, request, pk=None):
        """Vytvoří transakci z opakující se platby"""
        recurring = self.get_object()
        
        # Vytvoř transakci
        transaction = Transaction.objects.create(
            user=request.user,
            amount=recurring.amount,
            type=recurring.type,
            category=recurring.category,
            date=recurring.next_due_date,
            description=f"{recurring.name} - {recurring.description}"
        )
        
        # Zaznamenej do historie
        RecurringTransactionHistory.objects.create(
            recurring_transaction=recurring,
            transaction=transaction,
            was_auto_created=False
        )
        
        # Aktualizuj next_due_date
        recurring.next_due_date = recurring.calculate_next_due_date()
        
        # Zkontroluj, zda není čas ukončit
        if recurring.end_date and recurring.next_due_date > recurring.end_date:
            recurring.status = 'COMPLETED'
        
        recurring.save()
        
        return Response({
            'transaction': TransactionSerializer(transaction).data,
            'recurring': self.get_serializer(recurring).data
        })
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Vrátí nadcházející opakující se transakce (do 7 dnů)"""
        today = timezone.now().date()
        week_later = today + timedelta(days=7)
        
        upcoming = self.get_queryset().filter(
            status='ACTIVE',
            next_due_date__lte=week_later,
            next_due_date__gte=today
        ).order_by('next_due_date')
        
        return Response(self.get_serializer(upcoming, many=True).data)
    
    @action(detail=False, methods=['get'])
    def due_today(self, request):
        """Vrátí transakce splatné dnes"""
        today = timezone.now().date()
        
        due = self.get_queryset().filter(
            status='ACTIVE',
            next_due_date=today
        )
        
        return Response(self.get_serializer(due, many=True).data)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Přepne status mezi ACTIVE a PAUSED"""
        recurring = self.get_object()
        
        if recurring.status == 'ACTIVE':
            recurring.status = 'PAUSED'
        elif recurring.status == 'PAUSED':
            recurring.status = 'ACTIVE'
        
        recurring.save()
        
        return Response(self.get_serializer(recurring).data)

