from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Q, Count
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
import csv
import json
from .models import Transaction, Category, RecurringTransaction, RecurringTransactionHistory
from .serializers import TransactionSerializer, CategorySerializer, RecurringTransactionSerializer, RecurringTransactionHistorySerializer
from notifications.models import Notification
from budgets.services import BudgetAlertService

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
            {'name': 'Jídlo a nápoje', 'icon': 'food', 'color': '#FF6B6B', 'description': 'Nákupy potravin, restaurace', 'category_type': 'EXPENSE'},
            {'name': 'Doprava', 'icon': 'transport', 'color': '#4ECDC4', 'description': 'MHD, benzín, taxi', 'category_type': 'EXPENSE'},
            {'name': 'Bydlení', 'icon': 'home', 'color': '#45B7D1', 'description': 'Nájem, energie, opravy', 'category_type': 'EXPENSE'},
            {'name': 'Zábava', 'icon': 'entertainment', 'color': '#F7DC6F', 'description': 'Kino, sport, hobby', 'category_type': 'EXPENSE'},
            {'name': 'Oblečení', 'icon': 'shopping', 'color': '#BB8FCE', 'description': 'Oblečení a obuv', 'category_type': 'EXPENSE'},
            {'name': 'Zdraví', 'icon': 'health', 'color': '#85C1E2', 'description': 'Léky, lékař, fitness', 'category_type': 'EXPENSE'},
            {'name': 'Vzdělání', 'icon': 'education', 'color': '#52B788', 'description': 'Kurzy, knihy, škola', 'category_type': 'EXPENSE'},
            {'name': 'Ostatní výdaje', 'icon': 'money', 'color': '#95A5A6', 'description': 'Ostatní výdaje', 'category_type': 'EXPENSE'},
            {'name': 'Mzda', 'icon': 'money', 'color': '#2ECC71', 'description': 'Pravidelný příjem z práce', 'category_type': 'INCOME'},
            {'name': 'Investice', 'icon': 'trending-up', 'color': '#3498DB', 'description': 'Výnosy z investic', 'category_type': 'INCOME'},
            {'name': 'Dary', 'icon': 'gift', 'color': '#E74C3C', 'description': 'Dárky od rodiny a přátel', 'category_type': 'INCOME'},
            {'name': 'Ostatní příjmy', 'icon': 'dollar-sign', 'color': '#16A085', 'description': 'Ostatní příjmy', 'category_type': 'INCOME'},
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
        """Uložení transakce a kontrola budget alerts"""
        transaction = serializer.save(user=self.request.user)
        
        # Kontrola rozpočtů a vytvoření notifikací při překročení
        if transaction.type == 'EXPENSE':
            BudgetAlertService.check_budget_alerts(self.request.user, transaction)
    
    def perform_update(self, serializer):
        """Aktualizace transakce a kontrola budget alerts"""
        transaction = serializer.save()
        
        # Kontrola rozpočtů po úpravě transakce
        if transaction.type == 'EXPENSE':
            BudgetAlertService.check_budget_alerts(self.request.user, transaction)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Získá základní statistiky pro dashboard s rozšířenými KPI"""
        try:
            user = request.user
            now = timezone.now()
            current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
            last_7_days = now - timedelta(days=7)
            last_30_days = now - timedelta(days=30)
            
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
            
            # --- ROZŠÍŘENÉ KPI ---
            
            # 1. Průměrné denní výdaje (posledních 30 dní)
            last_30_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=last_30_days
            ).aggregate(total=Sum('amount'))['total'] or 0
            avg_daily_spending = float(last_30_expenses) / 30
            
            # Předchozích 30 dní pro porovnání
            prev_30_days_start = now - timedelta(days=60)
            prev_30_days_end = now - timedelta(days=30)
            prev_30_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=prev_30_days_start,
                date__lt=prev_30_days_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            prev_avg_daily = float(prev_30_expenses) / 30
            
            if prev_avg_daily > 0:
                daily_spending_change = ((avg_daily_spending - prev_avg_daily) / prev_avg_daily) * 100
            else:
                daily_spending_change = 0.0
            
            # 2. Savings Rate (% z příjmů)
            if current_month_income > 0:
                savings_rate = (current_month_savings / float(current_month_income)) * 100
            else:
                savings_rate = 0.0
            
            if previous_month_income > 0:
                prev_savings_rate = (previous_month_savings / float(previous_month_income)) * 100
            else:
                prev_savings_rate = 0.0
            
            savings_rate_change = savings_rate - prev_savings_rate
            
            # 3. Nejčastější kategorie (count transakcí)
            most_frequent_category = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__gte=current_month_start
            ).values('category__name', 'category__icon', 'category__color').annotate(
                count=Count('id')
            ).order_by('-count').first()
            
            # 4. Nadcházející opakující se platby (7 dní)
            from .models import RecurringTransaction
            upcoming_recurring = RecurringTransaction.objects.filter(
                user=user,
                status='ACTIVE',
                next_due_date__lte=now + timedelta(days=7)
            ).count()
            
            # 5. Sparkline data - posledních 7 dní výdajů
            sparkline_data = []
            for i in range(6, -1, -1):
                day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                day_expenses = Transaction.objects.filter(
                    user=user,
                    type='EXPENSE',
                    date__gte=day_start.date(),
                    date__lt=day_end.date()
                ).aggregate(total=Sum('amount'))['total'] or 0
                sparkline_data.append(float(day_expenses))
            
            # 6. Dnešní výdaje
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date=today_start.date()
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            yesterday_expenses = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date=(today_start - timedelta(days=1)).date()
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            if yesterday_expenses > 0:
                today_change = ((float(today_expenses) - float(yesterday_expenses)) / float(yesterday_expenses)) * 100
            else:
                today_change = 0.0
            
            serializer = self.get_serializer(recent_transactions, many=True)
            
            return Response({
                'total_income': float(total_income),
                'total_expenses': float(total_expenses),
                'balance': float(balance),
                'recent_transactions': serializer.data,
                'top_expense_categories': top_expense_categories,
                'current_month_savings': current_month_savings,
                'savings_change': savings_change,
                # Rozšířené KPI
                'avg_daily_spending': avg_daily_spending,
                'daily_spending_change': daily_spending_change,
                'savings_rate': savings_rate,
                'savings_rate_change': savings_rate_change,
                'most_frequent_category': {
                    'name': most_frequent_category['category__name'] if most_frequent_category else 'Žádná',
                    'icon': most_frequent_category['category__icon'] if most_frequent_category else 'money',
                    'color': most_frequent_category['category__color'] if most_frequent_category else '#3B82F6',
                    'count': most_frequent_category['count'] if most_frequent_category else 0
                },
                'upcoming_recurring_count': upcoming_recurring,
                'sparkline_data': sparkline_data,
                'today_expenses': float(today_expenses),
                'today_change': today_change
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
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """
        Import transakcí z CSV souboru
        
        Očekávaný formát CSV:
        Datum,Popis,Kategorie,Typ,Částka
        2024-01-15,Nákup v obchodě,Jídlo a nápoje,Výdaj,500
        2024-01-16,Výplata,Mzda,Příjem,25000
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Nebyl nahrán žádný soubor'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        # Kontrola formátu souboru
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'Soubor musí být ve formátu CSV'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Dekódování souboru (podpora různých encodings)
            try:
                decoded_file = csv_file.read().decode('utf-8')
            except UnicodeDecodeError:
                csv_file.seek(0)
                decoded_file = csv_file.read().decode('cp1250')  # Windows Czech encoding
            
            # Odstranění BOM pokud existuje
            if decoded_file.startswith('\ufeff'):
                decoded_file = decoded_file[1:]
            
            io_string = decoded_file.splitlines()
            reader = csv.DictReader(io_string)
            
            imported_count = 0
            skipped_count = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # start=2 protože řádek 1 je hlavička
                try:
                    # Validace povinných polí
                    if not all(key in row for key in ['Datum', 'Typ', 'Částka']):
                        errors.append(f'Řádek {row_num}: Chybí povinná pole')
                        skipped_count += 1
                        continue
                    
                    # Parsování data
                    date_str = row['Datum'].strip()
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            date = datetime.strptime(date_str, '%d.%m.%Y').date()
                        except ValueError:
                            errors.append(f'Řádek {row_num}: Neplatný formát data "{date_str}"')
                            skipped_count += 1
                            continue
                    
                    # Určení typu transakce
                    type_str = row['Typ'].strip().lower()
                    if type_str in ['příjem', 'income', 'příjmy']:
                        transaction_type = 'INCOME'
                    elif type_str in ['výdaj', 'expense', 'výdaje']:
                        transaction_type = 'EXPENSE'
                    else:
                        errors.append(f'Řádek {row_num}: Neplatný typ transakce "{row["Typ"]}"')
                        skipped_count += 1
                        continue
                    
                    # Parsování částky
                    amount_str = row['Částka'].strip().replace(',', '.').replace(' ', '')
                    try:
                        amount = float(amount_str)
                        if amount <= 0:
                            raise ValueError('Částka musí být kladná')
                    except ValueError as e:
                        errors.append(f'Řádek {row_num}: Neplatná částka "{row["Částka"]}"')
                        skipped_count += 1
                        continue
                    
                    # Najít nebo vytvořit kategorii
                    category = None
                    if 'Kategorie' in row and row['Kategorie'].strip():
                        category_name = row['Kategorie'].strip()
                        category = Category.objects.filter(
                            user=request.user,
                            name__iexact=category_name
                        ).first()
                        
                        # Pokud kategorie neexistuje, vytvoř ji
                        if not category:
                            category = Category.objects.create(
                                user=request.user,
                                name=category_name,
                                category_type=transaction_type,
                                icon='money' if transaction_type == 'INCOME' else 'money',
                                color='#2ECC71' if transaction_type == 'INCOME' else '#E74C3C'
                            )
                    
                    # Popis
                    description = row.get('Popis', '').strip()
                    
                    # Vytvoření transakce
                    Transaction.objects.create(
                        user=request.user,
                        date=date,
                        type=transaction_type,
                        amount=amount,
                        category=category,
                        description=description
                    )
                    
                    imported_count += 1
                    
                except Exception as e:
                    errors.append(f'Řádek {row_num}: {str(e)}')
                    skipped_count += 1
            
            return Response({
                'message': f'Import dokončen',
                'imported': imported_count,
                'skipped': skipped_count,
                'errors': errors[:10]  # Vrátit max 10 chyb
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Chyba při zpracování souboru: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_demo_data(request):
    """Vygeneruje demo data pro uživatele včetně rozpočtů a cílů"""
    from decimal import Decimal
    from random import randint, choice
    from budgets.models import Budget
    from goals.models import FinancialGoal
    
    user = request.user
    
    # Kontrola, zda už uživatel nemá hodně transakcí
    existing_count = Transaction.objects.filter(user=user).count()
    if existing_count > 50:
        return Response(
            {'error': 'Již máte dostatek dat. Tato funkce je určena pro nové účty.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vytvoř výchozí kategorie, pokud neexistují
    categories = Category.objects.filter(user=user)
    if not categories.exists():
        CategoryViewSet().create_defaults(request)
        categories = Category.objects.filter(user=user)
    
    expense_categories = list(categories.filter(category_type='EXPENSE'))
    income_categories = list(categories.filter(category_type='INCOME'))
    
    if not expense_categories or not income_categories:
        return Response(
            {'error': 'Nejsou k dispozici kategorie pro generování dat.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generuj transakce za poslední 3 měsíce
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=90)
    
    transactions_created = 0
    current_date = start_date
    
    while current_date <= end_date:
        # Přidej náhodné výdaje (2-5 denně)
        num_expenses = randint(2, 5)
        for _ in range(num_expenses):
            category = choice(expense_categories)
            amount = Decimal(randint(50, 2000))
            
            Transaction.objects.create(
                user=user,
                type='EXPENSE',
                amount=amount,
                category=category,
                date=current_date,
                description=f'Demo výdaj - {category.name}'
            )
            transactions_created += 1
        
        # Přidej příjem každý 15. a poslední den v měsíci
        if current_date.day == 15 or current_date.day >= 28:
            category = choice(income_categories)
            amount = Decimal(randint(15000, 35000))
            
            Transaction.objects.create(
                user=user,
                type='INCOME',
                amount=amount,
                category=category,
                date=current_date,
                description=f'Demo příjem - {category.name}'
            )
            transactions_created += 1
        
        current_date += timedelta(days=1)
    
    # Vytvoř rozpočty pro některé výdajové kategorie
    budgets_created = 0
    budget_categories = expense_categories[:min(4, len(expense_categories))]  # Maximálně 4 rozpočty
    
    for category in budget_categories:
        if not Budget.objects.filter(user=user, category=category, is_active=True).exists():
            start = timezone.now().date()
            end = start + relativedelta(months=1) - timedelta(days=1)
            Budget.objects.create(
                user=user,
                category=category,
                amount=Decimal(randint(5000, 15000)),
                period='MONTHLY',
                start_date=start,
                end_date=end,
                is_active=True
            )
            budgets_created += 1
    
    # Vytvoř finanční cíle
    goals_created = 0
    demo_goals = [
        {
            'name': 'Nový telefon',
            'target_amount': Decimal('25000'),
            'current_amount': Decimal(randint(5000, 15000)),
            'icon': 'phone',
            'color': '#3B82F6'
        },
        {
            'name': 'Dovolená',
            'target_amount': Decimal('50000'),
            'current_amount': Decimal(randint(10000, 30000)),
            'icon': 'plane',
            'color': '#10B981'
        },
        {
            'name': 'Nouzový fond',
            'target_amount': Decimal('100000'),
            'current_amount': Decimal(randint(20000, 60000)),
            'icon': 'shield',
            'color': '#F59E0B'
        }
    ]
    
    for goal_data in demo_goals:
        target_date = timezone.now().date() + timedelta(days=randint(180, 365))
        
        FinancialGoal.objects.create(
            user=user,
            name=goal_data['name'],
            target_amount=goal_data['target_amount'],
            current_amount=goal_data['current_amount'],
            target_date=target_date,
            icon=goal_data['icon'],
            color=goal_data['color']
        )
        goals_created += 1
    
    # Vytvoř opakující se transakce
    recurring_created = 0
    today = timezone.now().date()
    demo_recurring = [
        {
            'name': 'Nájem',
            'amount': Decimal('12000'),
            'type': 'EXPENSE',
            'frequency': 'MONTHLY',
            'start_date': today.replace(day=1),
            'category': next((c for c in expense_categories if 'Bydlení' in c.name), expense_categories[0])
        },
        {
            'name': 'Internet a telefon',
            'amount': Decimal('800'),
            'type': 'EXPENSE',
            'frequency': 'MONTHLY',
            'start_date': today.replace(day=15) if today.day < 15 else today.replace(day=15) + relativedelta(months=1),
            'category': next((c for c in expense_categories if 'Ostatní' in c.name), expense_categories[0])
        },
        {
            'name': 'Měsíční příjem',
            'amount': Decimal('25000'),
            'type': 'INCOME',
            'frequency': 'MONTHLY',
            'start_date': today.replace(day=15) if today.day < 15 else today.replace(day=15) + relativedelta(months=1),
            'category': income_categories[0]
        },
    ]
    
    for recurring_data in demo_recurring:
        RecurringTransaction.objects.create(
            user=user,
            name=recurring_data['name'],
            amount=recurring_data['amount'],
            type=recurring_data['type'],
            category=recurring_data['category'],
            frequency=recurring_data['frequency'],
            start_date=recurring_data['start_date'],
            next_due_date=recurring_data['start_date'],
            status='ACTIVE',
            auto_create=False,
            notify_before_days=3,
            description=f'Demo opakující se transakce - {recurring_data["name"]}'
        )
        recurring_created += 1
    
    return Response({
        'message': f'Úspěšně vytvořeno {transactions_created} transakcí, {budgets_created} rozpočtů, {goals_created} cílů a {recurring_created} opakujících se transakcí!',
        'transactions': transactions_created,
        'budgets': budgets_created,
        'goals': goals_created,
        'recurring': recurring_created
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_all_data(request):
    """Smaže všechna data uživatele (transakce, rozpočty, cíle)"""
    from budgets.models import Budget
    from goals.models import FinancialGoal
    
    user = request.user
    
    # Smazání všech dat
    transactions_deleted = Transaction.objects.filter(user=user).count()
    Transaction.objects.filter(user=user).delete()
    
    recurring_deleted = RecurringTransaction.objects.filter(user=user).count()
    RecurringTransaction.objects.filter(user=user).delete()
    
    budgets_deleted = Budget.objects.filter(user=user).count()
    Budget.objects.filter(user=user).delete()
    
    goals_deleted = FinancialGoal.objects.filter(user=user).count()
    FinancialGoal.objects.filter(user=user).delete()
    
    return Response({
        'message': f'Úspěšně smazáno {transactions_deleted} transakcí, {recurring_deleted} opakujících se transakcí, {budgets_deleted} rozpočtů a {goals_deleted} cílů!',
        'transactions': transactions_deleted,
        'recurring': recurring_deleted,
        'budgets': budgets_deleted,
        'goals': goals_deleted
    })
