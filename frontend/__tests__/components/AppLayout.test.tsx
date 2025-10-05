import React from 'react';
import { render, screen } from '@testing-library/react';
import AppLayout from '../../src/components/AppLayout';

jest.mock('../../src/components/NotificationsPanel', () => {
  return function MockNotificationsPanel({ sellerId }: { sellerId: string }) {
    return <div data-testid="notifications-panel">Notifications for {sellerId}</div>;
  };
});

describe('AppLayout', () => {
  it('should render children in main content', () => {
    render(
      <AppLayout sellerId="seller-123">
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render NotificationsPanel with sellerId', () => {
    render(
      <AppLayout sellerId="seller-123">
        <div>Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();
    expect(screen.getByText('Notifications for seller-123')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(
      <AppLayout sellerId="seller-123">
        <div>Test Content</div>
      </AppLayout>
    );

    expect(container.querySelector('.app-content')).toBeInTheDocument();
    expect(container.querySelector('.main-content')).toBeInTheDocument();
    expect(container.querySelector('.sidebar')).toBeInTheDocument();
  });
});
