"""
tests.py - Unit testy pro modul analytics

@author Tomáš Holes
@description Testuje:
    - Analytický přehled (overview)
    - Financial Health Score
    - Trendy a patterns
    - Insights a doporučení
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from accounts.models import User
from transactions.models import Category, Transaction
from budgets.models import Budget
from goals.models import FinancialGoal


class AnalyticsOverviewTests(APITestCase):
    """Testy pro analytický přehled"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.income_category = Category.objects.create(
            name='Výplata',
            category_type='INCOME',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_overview_empty(self):
        """Test overview bez transakcí"""
        url = reverse('analytics-overview')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['total_income']), 0)
        self.assertEqual(float(response.data['total_expenses']), 0)
    
    def test_overview_with_transactions(self):
        """Test overview s transakcemi"""
        # Vytvoření transakcí v posledních dnech
        Transaction.objects.create(
            amount=30000, type='INCOME', category=self.income_category,
            date=date.today() - timedelta(days=5), user=self.user
        )
        Transaction.objects.create(
            amount=5000, type='EXPENSE', category=self.category,
            date=date.today() - timedelta(days=3), user=self.user
        )
        Transaction.objects.create(
            amount=3000, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        
        url = reverse('analytics-overview')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['total_income']), 30000)
        self.assertEqual(float(response.data['total_expenses']), 8000)
        self.assertEqual(float(response.data['savings']), 22000)
    
    def test_overview_time_range_filter(self):
        """Test filtrování přehledu podle období"""
        # Starší transakce
        Transaction.objects.create(
            amount=10000, type='INCOME', category=self.income_category,
            date=date.today() - timedelta(days=60), user=self.user
        )
        # Novější transakce
        Transaction.objects.create(
            amount=20000, type='INCOME', category=self.income_category,
            date=date.today() - timedelta(days=10), user=self.user
        )
        
        # Test 1 měsíc - měl by zahrnout pouze novější
        url = reverse('analytics-overview') + '?time_range=1m'
        response = self.client.get(url)
        self.assertEqual(float(response.data['total_income']), 20000)
        
        # Test 3 měsíce - měl by zahrnout obě
        url = reverse('analytics-overview') + '?time_range=3m'
        response = self.client.get(url)
        self.assertEqual(float(response.data['total_income']), 30000)
    
    def test_category_breakdown(self):
        """Test rozpisu kategorií"""
        Transaction.objects.create(
            amount=5000, type='EXPENSE', category=self.category,
            date=date.today(), user=self.user
        )
        other_category = Category.objects.create(
            name='Doprava',
            category_type='EXPENSE',
            user=self.user
        )
        Transaction.objects.create(
            amount=2000, type='EXPENSE', category=other_category,
            date=date.today(), user=self.user
        )
        
        url = reverse('analytics-overview')
        response = self.client.get(url)
        self.assertIn('category_data', response.data)
        self.assertEqual(len(response.data['category_data']), 2)


class FinancialHealthScoreTests(APITestCase):
    """Testy pro Financial Health Score"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Výdaje',
            category_type='EXPENSE',
            user=self.user
        )
        self.income_category = Category.objects.create(
            name='Příjem',
            category_type='INCOME',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_health_score_endpoint(self):
        """Test endpointu health score"""
        url = reverse('financial-health-score')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('score', response.data)
        self.assertIn('grade', response.data)
    
    def test_health_score_excellent(self):
        """Test excelentního skóre"""
        # Vytvoření dobrých finančních návyků - vysoké příjmy, nízké výdaje
        for i in range(6):
            Transaction.objects.create(
                amount=30000, type='INCOME', category=self.income_category,
                date=date.today() - timedelta(days=i*30), user=self.user
            )
            Transaction.objects.create(
                amount=10000, type='EXPENSE', category=self.category,
                date=date.today() - timedelta(days=i*30), user=self.user
            )
        
        url = reverse('financial-health-score')
        response = self.client.get(url)
        self.assertIn(response.data['grade'], ['A', 'B'])  # Vysoké skóre
    
    def test_health_score_components(self):
        """Test že skóre obsahuje všechny komponenty"""
        url = reverse('financial-health-score')
        response = self.client.get(url)
        self.assertIn('components', response.data)


class InsightsTests(APITestCase):
    """Testy pro finanční insights"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_insights_endpoint(self):
        """Test endpointu insights"""
        url = reverse('analytics-insights')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_savings_insight(self):
        """Test insight pro úspory"""
        income_category = Category.objects.create(
            name='Výplata',
            category_type='INCOME',
            user=self.user
        )
        # Vysoká míra úspor
        Transaction.objects.create(
            amount=50000, type='INCOME', category=income_category,
            date=date.today() - timedelta(days=15), user=self.user
        )
        Transaction.objects.create(
            amount=10000, type='EXPENSE', category=self.category,
            date=date.today() - timedelta(days=10), user=self.user
        )
        
        url = reverse('analytics-insights')
        response = self.client.get(url)
        # Měl by obsahovat achievement insight o úsporách
        insight_types = [i['type'] for i in response.data]
        self.assertTrue(len(response.data) > 0)


class TrendAnalysisTests(APITestCase):
    """Testy pro analýzu trendů"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_trends_endpoint(self):
        """Test endpointu trendů"""
        # Vytvoření transakcí za poslední měsíce
        for i in range(3):
            Transaction.objects.create(
                amount=5000 + i*1000, type='EXPENSE', category=self.category,
                date=date.today() - timedelta(days=i*30), user=self.user
            )
        
        url = reverse('analytics-trends')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AnalyticsIsolationTests(APITestCase):
    """Testy pro izolaci dat mezi uživateli"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.other_user = User.objects.create_user(username='other', password='Pass123!')
        self.category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.user
        )
        self.other_category = Category.objects.create(
            name='Jídlo',
            category_type='EXPENSE',
            user=self.other_user
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_overview_isolation(self):
        """Test že overview zobrazuje pouze data přihlášeného uživatele"""
        # Transakce jiného uživatele
        Transaction.objects.create(
            amount=100000, type='INCOME', category=self.other_category,
            date=date.today(), user=self.other_user
        )
        # Transakce přihlášeného uživatele
        Transaction.objects.create(
            amount=10000, type='INCOME', category=self.category,
            date=date.today(), user=self.user
        )
        
        url = reverse('analytics-overview')
        response = self.client.get(url)
        self.assertEqual(float(response.data['total_income']), 10000)  # Pouze vlastní transakce
