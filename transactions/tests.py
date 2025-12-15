"""
tests.py - Unit testy pro modul transactions

@author Tomáš Holes
@description Testuje:
    - CRUD operace pro transakce
    - CRUD operace pro kategorie
    - Opakující se transakce
    - Filtry a statistiky
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from accounts.models import User, FinancialAccount
from .models import Category, Transaction, RecurringTransaction


class CategoryModelTests(TestCase):
    """Testy pro model Category"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
    
    def test_create_category(self):
        """Test vytvoření kategorie"""
        category = Category.objects.create(
            name='Jídlo',
            description='Výdaje na jídlo',
            icon='🍕',
            color='#FF5733',
            category_type='EXPENSE',
            user=self.user
        )
        self.assertEqual(category.name, 'Jídlo')
        self.assertEqual(category.category_type, 'EXPENSE')
    
    def test_category_str(self):
        """Test string reprezentace kategorie"""
        category = Category.objects.create(
            name='Doprava',
            user=self.user
        )
        self.assertEqual(str(category), 'Doprava')
    
    def test_unique_category_per_user(self):
        """Test unikátnosti kategorie pro uživatele"""
        Category.objects.create(name='Test', user=self.user)
        with self.assertRaises(Exception):
            Category.objects.create(name='Test', user=self.user)


class TransactionModelTests(TestCase):
    """Testy pro model Transaction"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
    
    def test_create_transaction(self):
        """Test vytvoření transakce"""
        transaction = Transaction.objects.create(
            amount=Decimal('150.50'),
            type='EXPENSE',
            category=self.category,
            date=date.today(),
            description='Oběd',
            user=self.user
        )
        self.assertEqual(transaction.amount, Decimal('150.50'))
        self.assertEqual(transaction.type, 'EXPENSE')
    
    def test_transaction_str(self):
        """Test string reprezentace transakce"""
        transaction = Transaction.objects.create(
            amount=Decimal('100'),
            type='INCOME',
            category=self.category,
            date=date.today(),
            user=self.user
        )
        self.assertIn('INCOME', str(transaction))
        self.assertIn('100', str(transaction))


class CategoryAPITests(APITestCase):
    """Testy pro API kategorií"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_category(self):
        """Test vytvoření kategorie přes API"""
        url = reverse('category-list')
        data = {
            'name': 'Zábava',
            'description': 'Výdaje na zábavu',
            'icon': '🎬',
            'color': '#3498db',
            'category_type': 'EXPENSE'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Zábava')
    
    def test_list_categories(self):
        """Test výpisu kategorií"""
        Category.objects.create(name='Jídlo', category_type='EXPENSE', user=self.user)
        Category.objects.create(name='Doprava', category_type='EXPENSE', user=self.user)
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_category(self):
        """Test aktualizace kategorie"""
        category = Category.objects.create(name='Test', user=self.user)
        url = reverse('category-detail', kwargs={'pk': category.pk})
        data = {'name': 'Aktualizováno', 'color': '#FF0000'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        category.refresh_from_db()
        self.assertEqual(category.name, 'Aktualizováno')
    
    def test_delete_category(self):
        """Test smazání kategorie"""
        category = Category.objects.create(name='Test', user=self.user)
        url = reverse('category-detail', kwargs={'pk': category.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk=category.pk).exists())
    
    def test_category_isolation(self):
        """Test že uživatel vidí pouze své kategorie"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        Category.objects.create(name='Cizí', user=other_user)
        Category.objects.create(name='Moje', user=self.user)
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Moje')


class TransactionAPITests(APITestCase):
    """Testy pro API transakcí"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_transaction(self):
        """Test vytvoření transakce přes API"""
        url = reverse('transaction-list')
        data = {
            'amount': '250.00',
            'type': 'EXPENSE',
            'category': self.category.pk,
            'date': str(date.today()),
            'description': 'Nákup'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), Decimal('250.00'))
    
    def test_list_transactions(self):
        """Test výpisu transakcí"""
        Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        Transaction.objects.create(
            amount=500, type='INCOME', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_transactions_by_type(self):
        """Test filtrování transakcí podle typu"""
        Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        Transaction.objects.create(
            amount=500, type='INCOME', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-list') + '?type=EXPENSE'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['type'], 'EXPENSE')
    
    def test_filter_transactions_by_date_range(self):
        """Test filtrování transakcí podle datumu"""
        Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today() - timedelta(days=30), user=self.user
        )
        Transaction.objects.create(
            amount=200, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-list') + f'?date_from={date.today()}'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_update_transaction(self):
        """Test aktualizace transakce"""
        transaction = Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-detail', kwargs={'pk': transaction.pk})
        data = {'amount': '200.00', 'description': 'Aktualizováno'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transaction.refresh_from_db()
        self.assertEqual(transaction.amount, Decimal('200.00'))
    
    def test_delete_transaction(self):
        """Test smazání transakce"""
        transaction = Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-detail', kwargs={'pk': transaction.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_transaction_isolation(self):
        """Test že uživatel vidí pouze své transakce"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        other_category = Category.objects.create(name='Test', user=other_user)
        Transaction.objects.create(
            amount=1000, type='INCOME', category=other_category,
            date=date.today(), user=other_user
        )
        Transaction.objects.create(
            amount=100, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(Decimal(response.data['results'][0]['amount']), Decimal('100'))
    
    def test_statistics_endpoint(self):
        """Test statistického endpointu"""
        Transaction.objects.create(
            amount=1000, type='INCOME', category=self.category,
            date=date.today(), user=self.user
        )
        Transaction.objects.create(
            amount=300, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        url = reverse('transaction-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_income', response.data)
        self.assertIn('total_expense', response.data)


class RecurringTransactionTests(APITestCase):
    """Testy pro opakující se transakce"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Předplatné',
            category_type='EXPENSE',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_recurring_transaction(self):
        """Test vytvoření opakující se transakce"""
        url = reverse('recurring-transaction-list')
        data = {
            'name': 'Netflix',
            'amount': '299',
            'type': 'EXPENSE',
            'frequency': 'MONTHLY',
            'category': self.category.pk,
            'start_date': str(date.today()),
            'description': 'Měsíční předplatné'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Netflix')
    
    def test_list_recurring_transactions(self):
        """Test výpisu opakujících se transakcí"""
        RecurringTransaction.objects.create(
            name='Netflix',
            amount=299,
            type='EXPENSE',
            frequency='MONTHLY',
            category=self.category,
            user=self.user,
            start_date=date.today()
        )
        url = reverse('recurring-transaction-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
