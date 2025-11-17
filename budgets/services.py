"""
Budget Alert Service
Automaticky kontroluje rozpočty a vytváří notifikace při překročení prahových hodnot
"""
from django.db.models import Sum
from datetime import datetime
from .models import Budget
from notifications.models import Notification


class BudgetAlertService:
    """Service pro kontrolu rozpočtů a vytváření upozornění"""
    
    # Prahové hodnoty pro upozornění
    THRESHOLDS = [
        {'percentage': 80, 'severity': 'warning', 'icon': 'warning'},
        {'percentage': 90, 'severity': 'high', 'icon': 'warning'},
        {'percentage': 100, 'severity': 'critical', 'icon': 'close'},
    ]
    
    @staticmethod
    def check_budget_alerts(user, transaction=None):
        """
        Kontroluje všechny aktivní rozpočty uživatele a vytváří notifikace
        
        Args:
            user: User instance
            transaction: Nově vytvořená transakce (optional, pro optimalizaci)
        
        Returns:
            List of created notifications
        """
        from transactions.models import Transaction
        
        created_notifications = []
        
        # Získání všech aktivních rozpočtů
        budgets = Budget.objects.filter(user=user, is_active=True)
        
        for budget in budgets:
            # Získání transakcí pro tento rozpočet
            transactions = Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__range=[budget.start_date, budget.end_date]
            )
            
            # Filtr podle kategorie, pokud je definována
            if budget.category:
                transactions = transactions.filter(category=budget.category)
            
            # Výpočet utracené částky
            spent = transactions.aggregate(total=Sum('amount'))['total'] or 0
            spent = float(spent)
            budget_amount = float(budget.amount)
            
            if budget_amount == 0:
                continue
            
            # Výpočet procenta využití
            percentage_used = (spent / budget_amount) * 100
            
            # Kontrola každé prahové hodnoty
            for threshold in BudgetAlertService.THRESHOLDS:
                threshold_percentage = threshold['percentage']
                
                # Pokud jsme právě překročili prahovou hodnotu
                if percentage_used >= threshold_percentage:
                    # Kontrola, zda už notifikace pro tuto úroveň existuje
                    existing_notification = Notification.objects.filter(
                        user=user,
                        type='BUDGET_ALERT',
                        related_id=budget.id,
                        message__contains=f"{threshold_percentage}%"
                    ).exists()
                    
                    # Vytvoř notifikaci pouze pokud ještě neexistuje
                    if not existing_notification:
                        notification = BudgetAlertService._create_budget_notification(
                            user=user,
                            budget=budget,
                            spent=spent,
                            percentage=percentage_used,
                            threshold=threshold
                        )
                        created_notifications.append(notification)
        
        return created_notifications
    
    @staticmethod
    def _create_budget_notification(user, budget, spent, percentage, threshold):
        """Vytvoří notifikaci o překročení rozpočtu"""
        
        threshold_percentage = threshold['percentage']
        icon = threshold['icon']
        severity = threshold['severity']
        
        # Výběr správné zprávy podle severity
        if severity == 'warning':
            message = f"{icon} Rozpočet '{budget.name}' dosáhl {threshold_percentage}% využití"
        elif severity == 'high':
            message = f"{icon} POZOR: Rozpočet '{budget.name}' je téměř vyčerpán ({threshold_percentage}%)"
        else:  # critical
            message = f"{icon} PŘEKROČEN: Rozpočet '{budget.name}' byl překročen!"
        
        # Přidání detailů
        category_info = f" (Kategorie: {budget.category.name})" if budget.category else ""
        details = f"Utraceno: {spent:.2f} z {budget.amount:.2f} CZK{category_info}"
        
        notification = Notification.objects.create(
            user=user,
            type='BUDGET_ALERT',
            title=f"Upozornění na rozpočet",
            message=f"{message}\n{details}",
            priority=severity.upper(),
            related_id=budget.id
        )
        
        return notification
    
    @staticmethod
    def get_budget_status(budget):
        """
        Vrací aktuální status rozpočtu
        
        Returns:
            dict: {
                'spent': float,
                'remaining': float,
                'percentage': float,
                'status': 'safe'|'warning'|'danger'|'exceeded'
            }
        """
        from transactions.models import Transaction
        
        transactions = Transaction.objects.filter(
            user=budget.user,
            type='EXPENSE',
            date__range=[budget.start_date, budget.end_date]
        )
        
        if budget.category:
            transactions = transactions.filter(category=budget.category)
        
        spent = float(transactions.aggregate(total=Sum('amount'))['total'] or 0)
        budget_amount = float(budget.amount)
        remaining = budget_amount - spent
        percentage = (spent / budget_amount * 100) if budget_amount > 0 else 0
        
        # Určení statusu
        if percentage >= 100:
            status = 'exceeded'
        elif percentage >= 90:
            status = 'danger'
        elif percentage >= 80:
            status = 'warning'
        else:
            status = 'safe'
        
        return {
            'spent': spent,
            'remaining': remaining,
            'percentage': percentage,
            'status': status
        }
    
    @staticmethod
    def clear_budget_notifications(user, budget_id):
        """Smaže všechny notifikace pro daný rozpočet"""
        Notification.objects.filter(
            user=user,
            type='BUDGET_ALERT',
            related_id=budget_id
        ).delete()
