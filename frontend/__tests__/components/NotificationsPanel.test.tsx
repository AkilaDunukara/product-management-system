import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsPanel from '../../src/components/NotificationsPanel';
import * as hooks from '../../src/hooks';
import type { Notification } from '../../src/types';

jest.mock('../../src/hooks');

describe('NotificationsPanel', () => {
  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'ProductCreated',
      message: 'Product created successfully',
      data: { productId: 1, name: 'Product 1' },
      timestamp: Date.now() - 60000,
    },
    {
      id: 2,
      type: 'LowStockWarning',
      message: 'Low stock warning',
      data: { productId: 2, name: 'Product 2', quantity: 5 },
      timestamp: Date.now() - 120000,
    },
  ];

  const mockUseSSE = {
    notifications: mockNotifications,
    connected: true,
    clearNotifications: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useSSE as jest.Mock).mockReturnValue(mockUseSSE);
  });

  it('should render notifications panel', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should show connected status', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('Live')).toBeInTheDocument();
    const indicator = document.querySelector('.status-indicator');
    expect(indicator).toHaveClass('connected');
  });

  it('should show disconnected status', () => {
    (hooks.useSSE as jest.Mock).mockReturnValue({
      ...mockUseSSE,
      connected: false,
    });

    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    const indicator = document.querySelector('.status-indicator');
    expect(indicator).toHaveClass('disconnected');
  });

  it('should render notifications list', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('Product created successfully')).toBeInTheDocument();
    expect(screen.getByText('Low stock warning')).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    (hooks.useSSE as jest.Mock).mockReturnValue({
      ...mockUseSSE,
      notifications: [],
    });

    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByText('Real-time updates will appear here')).toBeInTheDocument();
  });

  it('should render notification icons correctly', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should render notification details', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('Product: Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product: Product 2')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 5')).toBeInTheDocument();
  });

  it('should apply correct notification classes', () => {
    const { container } = render(<NotificationsPanel sellerId="seller-123" />);

    const successNotification = container.querySelector('.notification-success');
    const warningNotification = container.querySelector('.notification-warning');

    expect(successNotification).toBeInTheDocument();
    expect(warningNotification).toBeInTheDocument();
  });

  it('should call clearNotifications when Clear All is clicked', () => {
    render(<NotificationsPanel sellerId="seller-123" />);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockUseSSE.clearNotifications).toHaveBeenCalled();
  });

  it('should not show Clear All button when no notifications', () => {
    (hooks.useSSE as jest.Mock).mockReturnValue({
      ...mockUseSSE,
      notifications: [],
    });

    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const now = Date.now();
    const notifications: Notification[] = [
      {
        id: 1,
        type: 'ProductCreated',
        message: 'Just now message',
        timestamp: now - 30000,
      },
      {
        id: 2,
        type: 'ProductCreated',
        message: 'Minutes ago message',
        timestamp: now - 300000,
      },
    ];

    (hooks.useSSE as jest.Mock).mockReturnValue({
      ...mockUseSSE,
      notifications,
    });

    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getAllByText(/ago/).length).toBeGreaterThan(0);
  });

  it('should render different notification types with correct icons', () => {
    const allTypeNotifications: Notification[] = [
      { id: 1, type: 'ProductCreated', message: 'Created', timestamp: Date.now() },
      { id: 2, type: 'ProductUpdated', message: 'Updated', timestamp: Date.now() },
      { id: 3, type: 'ProductDeleted', message: 'Deleted', timestamp: Date.now() },
      { id: 4, type: 'LowStockWarning', message: 'Low Stock', timestamp: Date.now() },
    ];

    (hooks.useSSE as jest.Mock).mockReturnValue({
      ...mockUseSSE,
      notifications: allTypeNotifications,
    });

    render(<NotificationsPanel sellerId="seller-123" />);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('🗑️')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
