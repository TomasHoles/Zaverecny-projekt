from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FinancialGoal, GoalContribution
from .serializers import FinancialGoalSerializer, GoalContributionSerializer
from notifications.models import Notification
from django.utils import timezone


class FinancialGoalViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialGoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialGoal.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_contribution(self, request, pk=None):
        """Přidá příspěvek do cíle"""
        goal = self.get_object()
        serializer = GoalContributionSerializer(data=request.data)
        
        if serializer.is_valid():
            contribution = serializer.save(goal=goal)
            
            # Aktualizuj current_amount
            goal.current_amount += contribution.amount
            
            # Zkontroluj, zda byl cíl dosažen
            if goal.is_achieved and goal.status != 'COMPLETED':
                goal.status = 'COMPLETED'
                goal.completed_at = timezone.now()
                
                # Vytvoř notifikaci
                Notification.objects.create(
                    user=request.user,
                    type='GOAL_ACHIEVED',
                    title='Cíl dosažen!',
                    message=f'Gratulujeme! Dosáhli jste svého cíle "{goal.name}"!',
                    related_goal=goal
                )
            elif goal.progress_percentage >= 50 and goal.progress_percentage < 60:
                # Notifikace při 50% pokroku
                Notification.objects.create(
                    user=request.user,
                    type='GOAL_PROGRESS',
                    title='Polovina cesty!',
                    message=f'Dosáhli jste 50% svého cíle "{goal.name}"!',
                    related_goal=goal
                )
            
            goal.save()
            
            return Response({
                'goal': FinancialGoalSerializer(goal).data,
                'contribution': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Vrátí souhrn všech cílů"""
        goals = self.get_queryset()
        
        active_goals = goals.filter(status='ACTIVE')
        completed_goals = goals.filter(status='COMPLETED')
        
        total_target = sum(g.target_amount for g in active_goals)
        total_saved = sum(g.current_amount for g in active_goals)
        
        return Response({
            'total_goals': goals.count(),
            'active_goals': active_goals.count(),
            'completed_goals': completed_goals.count(),
            'total_target_amount': total_target,
            'total_saved_amount': total_saved,
            'overall_progress': (total_saved / total_target * 100) if total_target > 0 else 0,
            'goals': FinancialGoalSerializer(active_goals, many=True).data
        })
