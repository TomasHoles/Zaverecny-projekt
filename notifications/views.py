from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Označí notifikaci jako přečtenou"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(self.get_serializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Označí všechny notifikace jako přečtené"""
        self.get_queryset().update(is_read=True)
        return Response({'message': 'Všechny notifikace označeny jako přečtené'})
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Vrátí pouze nepřečtené notifikace"""
        unread = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(unread, many=True)
        return Response({
            'count': unread.count(),
            'notifications': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Vrátí počet nepřečtených notifikací"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
