"""
tests.py - Unit testy pro modul accounts

@author Tomáš Holes
@description Testuje:
    - Registraci uživatelů
    - Přihlášení a JWT tokeny
    - Aktualizaci profilu
    - Změnu hesla
    - Model User
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User, FinancialAccount


class UserModelTests(TestCase):
    """Testy pro model User"""
    
    def test_create_user(self):
        """Test vytvoření běžného uživatele"""
        user = User.objects.create_user(
            username='testuser',
            password='TestPass123!'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('TestPass123!'))
    
    def test_create_superuser(self):
        """Test vytvoření superuživatele"""
        admin = User.objects.create_superuser(
            username='admin',
            password='AdminPass123!'
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_verified)
    
    def test_user_str(self):
        """Test string reprezentace uživatele"""
        user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.assertEqual(str(user), 'testuser')
    
    def test_get_full_name_with_names(self):
        """Test získání celého jména když je vyplněno"""
        user = User.objects.create_user(
            username='testuser',
            password='TestPass123!',
            first_name='Jan',
            last_name='Novák'
        )
        self.assertEqual(user.get_full_name(), 'Jan Novák')
    
    def test_get_full_name_without_names(self):
        """Test získání celého jména když není vyplněno"""
        user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.assertEqual(user.get_full_name(), 'testuser')
    
    def test_default_currency(self):
        """Test výchozí měny"""
        user = User.objects.create_user(username='testuser', password='TestPass123!')
        self.assertEqual(user.currency_preference, 'CZK')


class RegistrationTests(APITestCase):
    """Testy pro registraci uživatelů"""
    
    def test_register_success(self):
        """Test úspěšné registrace"""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_register_password_mismatch(self):
        """Test registrace s neshodnými hesly"""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass456!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_duplicate_username(self):
        """Test registrace s existujícím uživatelským jménem"""
        User.objects.create_user(username='existinguser', password='TestPass123!')
        url = reverse('register')
        data = {
            'username': 'existinguser',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_weak_password(self):
        """Test registrace se slabým heslem"""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'password': '123',
            'password2': '123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    """Testy pro přihlášení uživatelů"""
    
    def setUp(self):
        """Vytvoření testovacího uživatele"""
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPass123!'
        )
    
    def test_login_success(self):
        """Test úspěšného přihlášení"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_login_wrong_password(self):
        """Test přihlášení se špatným heslem"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'WrongPass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_nonexistent_user(self):
        """Test přihlášení neexistujícího uživatele"""
        url = reverse('login')
        data = {
            'username': 'nonexistent',
            'password': 'TestPass123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    """Testy pro profil uživatele"""
    
    def setUp(self):
        """Vytvoření a autentifikace testovacího uživatele"""
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPass123!',
            first_name='Jan',
            last_name='Novák'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_get_profile(self):
        """Test získání profilu"""
        url = reverse('user-me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['first_name'], 'Jan')
    
    def test_update_profile(self):
        """Test aktualizace profilu"""
        url = reverse('user-update-profile')
        data = {
            'first_name': 'Petr',
            'last_name': 'Svoboda'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Petr')
        self.assertEqual(self.user.last_name, 'Svoboda')
    
    def test_change_password(self):
        """Test změny hesla"""
        url = reverse('user-change-password')
        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewSecurePass456!',
            'new_password2': 'NewSecurePass456!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass456!'))
    
    def test_change_password_wrong_old(self):
        """Test změny hesla se špatným starým heslem"""
        url = reverse('user-change-password')
        data = {
            'old_password': 'WrongOldPass!',
            'new_password': 'NewSecurePass456!',
            'new_password2': 'NewSecurePass456!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FinancialAccountTests(APITestCase):
    """Testy pro finanční účty"""
    
    def setUp(self):
        """Vytvoření a autentifikace testovacího uživatele"""
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPass123!'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_account(self):
        """Test vytvoření finančního účtu"""
        url = reverse('financial-account-list')
        data = {
            'name': 'Hlavní účet',
            'account_type': 'BANK',
            'initial_balance': 10000,
            'currency': 'CZK'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Hlavní účet')
    
    def test_list_accounts(self):
        """Test výpisu finančních účtů"""
        FinancialAccount.objects.create(
            user=self.user,
            name='Účet 1',
            account_type='BANK',
            initial_balance=5000
        )
        FinancialAccount.objects.create(
            user=self.user,
            name='Účet 2',
            account_type='CASH',
            initial_balance=1000
        )
        url = reverse('financial-account-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_account_isolation(self):
        """Test že uživatel vidí pouze své účty"""
        other_user = User.objects.create_user(username='other', password='Pass123!')
        FinancialAccount.objects.create(
            user=other_user,
            name='Cizí účet',
            account_type='BANK',
            initial_balance=10000
        )
        FinancialAccount.objects.create(
            user=self.user,
            name='Můj účet',
            account_type='BANK',
            initial_balance=5000
        )
        url = reverse('financial-account-list')
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Můj účet')
