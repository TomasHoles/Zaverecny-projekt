from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet, RecurringTransactionViewSet, generate_demo_data, delete_all_data

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('categories', CategoryViewSet, basename='category')
router.register('recurring', RecurringTransactionViewSet, basename='recurring-transaction')

urlpatterns = [
    path('generate-demo-data/', generate_demo_data, name='generate-demo-data'),
    path('delete-all-data/', delete_all_data, name='delete-all-data'),
] + router.urls