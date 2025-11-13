import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Icon from './Icon';
import '../styles/Notifications.css';
import '../styles/Notifications.css';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_budget?: number;
  related_goal?: number;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/notifications/${id}/mark_as_read/`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/notifications/mark_all_read/');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/notifications/${id}/`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
      case 'BUDGET_WARNING':
        return 'target';
      case 'GOAL_ACHIEVED':
      case 'GOAL_PROGRESS':
        return 'trending-up';
      case 'RECURRING_DUE':
        return 'income';
      case 'MONTHLY_SUMMARY':
        return 'analytics';
      default:
        return 'lightbulb';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return '#EF4444';
      case 'BUDGET_WARNING':
        return '#F59E0B';
      case 'GOAL_ACHIEVED':
        return '#10B981';
      case 'GOAL_PROGRESS':
        return '#3B82F6';
      case 'RECURRING_DUE':
        return '#8B5CF6';
      case 'MONTHLY_SUMMARY':
        return '#6B7280';
      default:
        return '#9B4DCA';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Právě teď';
    if (diffMins < 60) return `Před ${diffMins} min`;
    if (diffHours < 24) return `Před ${diffHours} h`;
    if (diffDays < 7) return `Před ${diffDays} dny`;
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Načítám notifikace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">
            <Icon name="lightbulb" size={32} color="#F59E0B" /> Notifikace
          </h1>
          <p className="notifications-subtitle">
            {unreadCount > 0 
              ? `Máte ${unreadCount} nepřečtených notifikací` 
              : 'Všechny notifikace přečteny'}
          </p>
        </div>
        
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-mark-all">
              <Icon name="check" size={18} /> Označit vše jako přečtené
            </button>
          )}
        </div>
      </div>

      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Všechny ({notifications.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Nepřečtené ({unreadCount})
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div
                className="notification-icon"
                style={{ backgroundColor: getNotificationColor(notification.type) + '20' }}
              >
                <Icon
                  name={getNotificationIcon(notification.type)}
                  size={24}
                  color={getNotificationColor(notification.type)}
                />
              </div>
              
              <div className="notification-content">
                <div className="notification-header-row">
                  <h3 className="notification-title">{notification.title}</h3>
                  <span className="notification-time">{formatDate(notification.created_at)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
                {!notification.is_read && (
                  <span className="notification-badge">Nová</span>
                )}
              </div>

              <button
                className="notification-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <Icon name="trash" size={18} color="#EF4444" />
              </button>
            </div>
          ))
        ) : (
          <div className="notifications-empty">
            <Icon name="lightbulb" size={64} color="#6B7280" />
            <h3>Žádné {filter === 'unread' ? 'nepřečtené ' : ''}notifikace</h3>
            <p>Budeme vás informovat o důležitých událostech</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
