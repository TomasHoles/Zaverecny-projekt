"""
tests.py - Unit testy pro modul notifications

@author Tomáš Holes
@description Testuje:
    - Vytváření a čtení notifikací
    - Označení notifikace jako přečtené
    - Filtrování nepřečtených notifikací
    - Hromadné označení jako přečtené
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta
from accounts.models import User
from budgets.models import Budget
from goals.models import FinancialGoal
from .models import Notification


class NotificationModelTests(TestCase):
    """Testy pro model Notification"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
    
    def test_create_notification(self):
        """Test vytvoření notifikace"""
        notification = Notification.objects.create(
            user=self.user,
            type='BUDGET_EXCEEDED',
            title='Překročen rozpočet',
            message='Váš rozpočet na jídlo byl překročen o 500 Kč.'
        )
        self.assertEqual(notification.title, 'Překročen rozpočet')
        self.assertEqual(notification.type, 'BUDGET_EXCEEDED')
        self.assertFalse(notification.is_read)
    
    def test_notification_str(self):
        """Test string reprezentace notifikace"""
        notification = Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='Cíl dosažen!',
            message='Gratulujeme!'
        )
        self.assertIn('testuser', str(notification))
        self.assertIn('Cíl dosažen', str(notification))
    
    def test_notification_with_budget(self):
        """Test notifikace s vazbou na rozpočet"""
        budget = Budget.objects.create(
            name='Jídlo',
            amount=5000,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            period='MONTHLY',
            user=self.user
        )
        notification = Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Varování',
            message='Blížíte se limitu',
            related_budget=budget
        )
        self.assertEqual(notification.related_budget, budget)
    
    def test_notification_with_goal(self):
        """Test notifikace s vazbou na cíl"""
        goal = FinancialGoal.objects.create(
            user=self.user,
            name='Dovolená',
            target_amount=50000
        )
        notification = Notification.objects.create(
            user=self.user,
            type='GOAL_PROGRESS',
            title='Pokrok',
            message='50% cíle dosaženo',
            related_goal=goal
        )
        self.assertEqual(notification.related_goal, goal)
    
    def test_default_ordering(self):
        """Test výchozího řazení notifikací"""
        n1 = Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Starší',
            message='...'
        )
        n2 = Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='Novější',
            message='...'
        )
        notifications = Notification.objects.all()
        self.assertEqual(notifications[0], n2)  # Novější první


class NotificationAPITests(APITestCase):
    """Testy pro API notifikací"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test výpisu notifikací"""
        Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Notifikace 1',
            message='...'
        )
        Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='Notifikace 2',
            message='...'
        )
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 2)
    
    def test_mark_as_read(self):
        """Test označení notifikace jako přečtené"""
        notification = Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Test',
            message='...',
            is_read=False
        )
        url = reverse('notification-mark-read', kwargs={'pk': notification.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
    
    def test_notification_isolation(self):
        """Test že uživatel vidí pouze své notifikace"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        Notification.objects.create(
            user=other_user,
            type='BUDGET_WARNING',
            title='Cizí',
            message='...'
        )
        Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='Moje',
            message='...'
        )
        url = reverse('notification-list')
        response = self.client.get(url)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'Moje')
    
    def test_unread_filter(self):
        """Test filtrování nepřečtených notifikací"""
        Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Nepřečtená',
            message='...',
            is_read=False
        )
        Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='Přečtená',
            message='...',
            is_read=True
        )
        url = reverse('notification-list') + '?is_read=false'
        response = self.client.get(url)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['title'], 'Nepřečtená')
    
    def test_mark_all_read(self):
        """Test označení všech notifikací jako přečtené"""
        Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='N1',
            message='...',
            is_read=False
        )
        Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='N2',
            message='...',
            is_read=False
        )
        url = reverse('notification-mark-all-read')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread_count = Notification.objects.filter(user=self.user, is_read=False).count()
        self.assertEqual(unread_count, 0)
    
    def test_unread_count(self):
        """Test počtu nepřečtených notifikací"""
        Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='N1',
            message='...',
            is_read=False
        )
        Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='N2',
            message='...',
            is_read=False
        )
        Notification.objects.create(
            user=self.user,
            type='GOAL_ACHIEVED',
            title='N3',
            message='...',
            is_read=True
        )
        url = reverse('notification-unread-count')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
    
    def test_delete_notification(self):
        """Test smazání notifikace"""
        notification = Notification.objects.create(
            user=self.user,
            type='BUDGET_WARNING',
            title='Test',
            message='...'
        )
        url = reverse('notification-detail', kwargs={'pk': notification.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(pk=notification.pk).exists())
