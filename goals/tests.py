"""
tests.py - Unit testy pro modul goals

@author Tomáš Holes
@description Testuje:
    - CRUD operace pro finanční cíle
    - Příspěvky k cílům
    - Výpočty pokroku a zbývající částky
    - Stavy cílů
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from accounts.models import User
from .models import FinancialGoal, GoalContribution


class FinancialGoalModelTests(TestCase):
    """Testy pro model FinancialGoal"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
    
    def test_create_goal(self):
        """Test vytvoření finančního cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Dovolená',
            target_amount=Decimal('50000'),
            goal_type='SAVINGS'
        )
        self.assertEqual(goal.name, 'Dovolená')
        self.assertEqual(goal.target_amount, Decimal('50000'))
        self.assertEqual(goal.current_amount, Decimal('0'))
        self.assertEqual(goal.status, 'ACTIVE')
    
    def test_goal_str(self):
        """Test string reprezentace cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Auto',
            target_amount=200000
        )
        self.assertIn('Auto', str(goal))
        self.assertIn('testuser', str(goal))
    
    def test_progress_percentage_zero(self):
        """Test procenta pokroku při nule"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=0
        )
        self.assertEqual(goal.progress_percentage, 0)
    
    def test_progress_percentage_partial(self):
        """Test procenta pokroku při částečném plnění"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=2500
        )
        self.assertEqual(goal.progress_percentage, 25)
    
    def test_progress_percentage_over_100(self):
        """Test procenta pokroku nad 100%"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=15000
        )
        self.assertEqual(goal.progress_percentage, 100)  # Max 100%
    
    def test_remaining_amount(self):
        """Test zbývající částky"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=3000
        )
        self.assertEqual(goal.remaining_amount, 7000)
    
    def test_remaining_amount_achieved(self):
        """Test zbývající částky při překročení cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=12000
        )
        self.assertEqual(goal.remaining_amount, 0)
    
    def test_is_achieved_false(self):
        """Test nedosaženého cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=5000
        )
        self.assertFalse(goal.is_achieved)
    
    def test_is_achieved_true(self):
        """Test dosaženého cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=10000
        )
        self.assertTrue(goal.is_achieved)
    
    def test_is_achieved_exceeded(self):
        """Test překročeného cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=15000
        )
        self.assertTrue(goal.is_achieved)


class GoalContributionModelTests(TestCase):
    """Testy pro model GoalContribution"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.goal = FinancialGoal.objects.create(
            user=self.user,
            name='Úspory',
            target_amount=50000
        )
    
    def test_create_contribution(self):
        """Test vytvoření příspěvku"""
        contribution = GoalContribution.objects.create(
            goal=self.goal,
            amount=Decimal('5000'),
            date=date.today(),
            note='Měsíční úspora'
        )
        self.assertEqual(contribution.amount, Decimal('5000'))
        self.assertEqual(contribution.note, 'Měsíční úspora')
    
    def test_contribution_str(self):
        """Test string reprezentace příspěvku"""
        contribution = GoalContribution.objects.create(
            goal=self.goal,
            amount=1000,
            date=date.today()
        )
        self.assertIn(self.goal.name, str(contribution))
        self.assertIn('1000', str(contribution))


class GoalAPITests(APITestCase):
    """Testy pro API finančních cílů"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_goal(self):
        """Test vytvoření cíle přes API"""
        url = reverse('goal-list')
        data = {
            'name': 'Nové auto',
            'description': 'Spoření na nové auto',
            'goal_type': 'PURCHASE',
            'target_amount': '300000',
            'target_date': str(date.today() + timedelta(days=365))
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Nové auto')
    
    def test_list_goals(self):
        """Test výpisu cílů"""
        FinancialGoal.objects.create(
            user=self.user,
            name='Cíl 1',
            target_amount=10000
        )
        FinancialGoal.objects.create(
            user=self.user,
            name='Cíl 2',
            target_amount=20000
        )
        url = reverse('goal-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response může být paginated nebo list
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 2)
        else:
            self.assertEqual(len(response.data), 2)
    
    def test_update_goal(self):
        """Test aktualizace cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000
        )
        url = reverse('goal-detail', kwargs={'pk': goal.pk})
        data = {'name': 'Aktualizováno', 'current_amount': '5000'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        goal.refresh_from_db()
        self.assertEqual(goal.name, 'Aktualizováno')
        self.assertEqual(goal.current_amount, Decimal('5000'))
    
    def test_delete_goal(self):
        """Test smazání cíle"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000
        )
        url = reverse('goal-detail', kwargs={'pk': goal.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_goal_isolation(self):
        """Test že uživatel vidí pouze své cíle"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        FinancialGoal.objects.create(
            user=other_user,
            name='Cizí cíl',
            target_amount=100000
        )
        FinancialGoal.objects.create(
            user=self.user,
            name='Můj cíl',
            target_amount=50000
        )
        url = reverse('goal-list')
        response = self.client.get(url)
        goals = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0]['name'], 'Můj cíl')
    
    def test_add_contribution(self):
        """Test přidání příspěvku k cíli"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Test',
            target_amount=10000,
            current_amount=0
        )
        url = reverse('goal-add-contribution', kwargs={'pk': goal.pk})
        data = {
            'amount': '2000',
            'date': str(date.today()),
            'note': 'Příspěvek z výplaty'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        goal.refresh_from_db()
        self.assertEqual(goal.current_amount, Decimal('2000'))
    
    def test_goal_summary(self):
        """Test souhrnu cílů"""
        FinancialGoal.objects.create(
            user=self.user,
            name='Aktivní',
            target_amount=10000,
            current_amount=5000,
            status='ACTIVE'
        )
        FinancialGoal.objects.create(
            user=self.user,
            name='Dokončeno',
            target_amount=5000,
            current_amount=5000,
            status='COMPLETED'
        )
        url = reverse('goal-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('active_goals', response.data)
        self.assertIn('completed_goals', response.data)
    
    def test_goal_status_filter(self):
        """Test filtrování cílů podle stavu"""
        FinancialGoal.objects.create(
            user=self.user,
            name='Aktivní',
            target_amount=10000,
            status='ACTIVE'
        )
        FinancialGoal.objects.create(
            user=self.user,
            name='Pozastaveno',
            target_amount=5000,
            status='PAUSED'
        )
        url = reverse('goal-list') + '?status=ACTIVE'
        response = self.client.get(url)
        goals = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0]['name'], 'Aktivní')
