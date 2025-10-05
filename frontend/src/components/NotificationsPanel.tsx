import React from 'react';
import { useSSE } from '../hooks';
import type { Notification } from '../types';

interface NotificationsPanelProps {
  sellerId: string;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ sellerId }) => {
  const { notifications, connected, clearNotifications } = useSSE(sellerId);

  const getNotificationClass = (type: Notification['type']): string => {
    switch (type) {
      case 'LowStockWarning':
        return 'notification-warning';
      case 'ProductCreated':
        return 'notification-success';
      case 'ProductUpdated':
        return 'notification-info';
      case 'ProductDeleted':
        return 'notification-error';
      default:
        return 'notification-info';
    }
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'LowStockWarning':
        return '⚠️';
      case 'ProductCreated':
        return '✅';
      case 'ProductUpdated':
        return '🔄';
      case 'ProductDeleted':
        return '🗑️';
      default:
        return 'ℹ️';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>Notifications</h3>
        <div className="notifications-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {notifications.length > 0 && (
        <button className="btn btn-small btn-clear" onClick={clearNotifications}>
          Clear All
        </button>
      )}

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <p>No notifications yet</p>
            <small>Real-time updates will appear here</small>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className={`notification-item ${getNotificationClass(notification.type)}`}>
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                {notification.data && notification.data.productId && (
                  <div className="notification-details">
                    {notification.data.name && <span>Product: {notification.data.name}</span>}
                    {notification.data.quantity !== undefined && (
                      <span>Quantity: {notification.data.quantity}</span>
                    )}
                  </div>
                )}
                <div className="notification-time">{formatTimestamp(notification.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;