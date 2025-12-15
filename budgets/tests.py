"""
tests.py - Unit testy pro modul budgets

@author Tomáš Holes
@description Testuje:
    - CRUD operace pro rozpočty
    - Výpočet utracené částky
    - Upozornění na překročení rozpočtu
    - Filtrování podle období
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from accounts.models import User
from transactions.models import Category, Transaction
from .models import Budget, BudgetCategory


class BudgetModelTests(TestCase):
    """Testy pro model Budget"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
    
    def test_create_budget(self):
        """Test vytvoření rozpočtu"""
        budget = Budget.objects.create(
            name='Měsíční rozpočet',
            amount=Decimal('10000'),
            start_date=date.today().replace(day=1),
            end_date=date.today().replace(day=28),
            period='MONTHLY',
            user=self.user
        )
        self.assertEqual(budget.name, 'Měsíční rozpočet')
        self.assertEqual(budget.amount, Decimal('10000'))
        self.assertTrue(budget.is_active)
    
    def test_budget_str(self):
        """Test string reprezentace rozpočtu"""
        budget = Budget.objects.create(
            name='Test Budget',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        self.assertEqual(str(budget), 'Test Budget')
    
    def test_get_spent_amount_no_transactions(self):
        """Test výpočtu utracené částky bez transakcí"""
        budget = Budget.objects.create(
            name='Test',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        self.assertEqual(budget.get_spent_amount(), 0)
    
    def test_get_spent_amount_with_transactions(self):
        """Test výpočtu utracené částky s transakcemi"""
        budget = Budget.objects.create(
            name='Test',
            amount=5000,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() + timedelta(days=25),
            period='MONTHLY',
            user=self.user
        )
        Transaction.objects.create(
            amount=1000, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        Transaction.objects.create(
            amount=500, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        self.assertEqual(budget.get_spent_amount(), 1500)
    
    def test_get_spent_amount_with_category_filter(self):
        """Test výpočtu utracené částky s filtrováním podle kategorie"""
        other_category = Category.objects.create(
            name='Doprava',
            category_type='EXPENSE',
            user=self.user
        )
        budget = Budget.objects.create(
            name='Jídlo Budget',
            amount=3000,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() + timedelta(days=25),
            period='MONTHLY',
            category=self.category,
            user=self.user
        )
        # Transakce v kategorii rozpočtu
        Transaction.objects.create(
            amount=500, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        # Transakce v jiné kategorii - neměla by se počítat
        Transaction.objects.create(
            amount=1000, type='EXPENSE', category=other_category,
            date=date.today(), user=self.user
        )
        self.assertEqual(budget.get_spent_amount(), 500)
    
    def test_income_not_counted_as_expense(self):
        """Test že příjmy se nepočítají do výdajů rozpočtu"""
        budget = Budget.objects.create(
            name='Test',
            amount=5000,
            start_date=date.today() - timedelta(days=5),
            end_date=date.today() + timedelta(days=25),
            period='MONTHLY',
            user=self.user
        )
        Transaction.objects.create(
            amount=10000, type='INCOME', category=self.category,
            date=date.today(), user=self.user
        )
        Transaction.objects.create(
            amount=1000, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        self.assertEqual(budget.get_spent_amount(), 1000)


class BudgetAPITests(APITestCase):
    """Testy pro API rozpočtů"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_budget(self):
        """Test vytvoření rozpočtu přes API"""
        url = reverse('budget-list')
        data = {
            'name': 'Měsíční rozpočet',
            'amount': '15000',
            'start_date': str(date.today().replace(day=1)),
            'end_date': str(date.today().replace(day=28)),
            'period': 'MONTHLY'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Měsíční rozpočet')
    
    def test_list_budgets(self):
        """Test výpisu rozpočtů"""
        Budget.objects.create(
            name='Budget 1',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        Budget.objects.create(
            name='Budget 2',
            amount=10000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            period='YEARLY',
            user=self.user
        )
        url = reverse('budget-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_budget(self):
        """Test aktualizace rozpočtu"""
        budget = Budget.objects.create(
            name='Test',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        url = reverse('budget-detail', kwargs={'pk': budget.pk})
        data = {'amount': '7500'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        budget.refresh_from_db()
        self.assertEqual(budget.amount, Decimal('7500'))
    
    def test_delete_budget(self):
        """Test smazání rozpočtu"""
        budget = Budget.objects.create(
            name='Test',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        url = reverse('budget-detail', kwargs={'pk': budget.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_budget_isolation(self):
        """Test že uživatel vidí pouze své rozpočty"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        Budget.objects.create(
            name='Cizí',
            amount=10000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=other_user
        )
        Budget.objects.create(
            name='Můj',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        url = reverse('budget-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Můj')
    
    def test_budget_with_category(self):
        """Test rozpočtu přiřazeného ke kategorii"""
        url = reverse('budget-list')
        data = {
            'name': 'Jídlo Budget',
            'amount': '3000',
            'start_date': str(date.today()),
            'end_date': str(date.today() + timedelta(days=30)),
            'period': 'MONTHLY',
            'category': self.category.pk
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['category'], self.category.pk)
    
    def test_active_budgets_filter(self):
        """Test filtrování aktivních rozpočtů"""
        Budget.objects.create(
            name='Aktivní',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            is_active=True,
            user=self.user
        )
        Budget.objects.create(
            name='Neaktivní',
            amount=3000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            is_active=False,
            user=self.user
        )
        url = reverse('budget-list') + '?is_active=true'
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Aktivní')


class BudgetCategoryTests(TestCase):
    """Testy pro model BudgetCategory"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.budget = Budget.objects.create(
            name='Měsíční',
            amount=10000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
    
    def test_create_budget_category(self):
        """Test vytvoření přiřazení kategorie k rozpočtu"""
        bc = BudgetCategory.objects.create(
            budget=self.budget,
            category=self.category,
            allocated_amount=Decimal('3000')
        )
        self.assertEqual(bc.allocated_amount, Decimal('3000'))
    
    def test_budget_category_str(self):
        """Test string reprezentace"""
        bc = BudgetCategory.objects.create(
            budget=self.budget,
            category=self.category,
            allocated_amount=2000
        )
        self.assertIn(self.budget.name, str(bc))
        self.assertIn(self.category.name, str(bc))
