from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet, RecurringTransactionViewSet

router = DefaultRouter()
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('categories', CategoryViewSet, basename='category')
router.register('recurring', RecurringTransactionViewSet, basename='recurring-transaction')

urlpatterns = router.urls