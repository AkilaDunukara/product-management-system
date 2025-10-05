import React from 'react';
import { render, screen } from '@testing-library/react';
import Toast from '../../src/components/Toast';

describe('Toast', () => {
  it('should render success toast', () => {
    render(<Toast message="Success message" type="success" />);

    const toast = screen.getByText(/Success message/i);
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast-success');
    expect(screen.getByText(/✅/)).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(<Toast message="Error message" type="error" />);

    const toast = screen.getByText(/Error message/i);
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast-error');
    expect(screen.getByText(/❌/)).toBeInTheDocument();
  });

  it('should render info toast', () => {
    render(<Toast message="Info message" type="info" />);

    const toast = screen.getByText(/Info message/i);
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveClass('toast-info');
    expect(screen.getByText(/ℹ️/)).toBeInTheDocument();
  });

  it('should default to success type', () => {
    render(<Toast message="Default message" />);

    const toast = screen.getByText(/Default message/i);
    expect(toast).toHaveClass('toast-success');
  });
});
