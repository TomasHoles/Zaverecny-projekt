from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import BudgetViewSet, BudgetCategoryViewSet

router = DefaultRouter()
router.register('budgets', BudgetViewSet, basename='budget')
router.register('categories', BudgetCategoryViewSet, basename='budget-category')

urlpatterns = router.urls