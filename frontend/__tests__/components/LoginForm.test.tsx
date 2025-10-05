import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../../src/components/LoginForm';

describe('LoginForm', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    expect(screen.getByText('Product Management System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter Seller ID/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('should update input value on change', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    const input = screen.getByPlaceholderText(/Enter Seller ID/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'seller-123' } });

    expect(input.value).toBe('seller-123');
  });

  it('should call onLogin with trimmed sellerId on submit', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    const input = screen.getByPlaceholderText(/Enter Seller ID/i);
    const button = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(input, { target: { value: '  seller-123  ' } });
    fireEvent.click(button);

    expect(mockOnLogin).toHaveBeenCalledWith('seller-123');
  });

  it('should not call onLogin with empty sellerId', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    const button = screen.getByRole('button', { name: /Login/i });

    fireEvent.click(button);

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should not call onLogin with whitespace only sellerId', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    const input = screen.getByPlaceholderText(/Enter Seller ID/i);
    const button = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(button);

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should handle form submission', () => {
    render(<LoginForm onLogin={mockOnLogin} />);

    const form = screen.getByRole('button', { name: /Login/i }).closest('form');
    const input = screen.getByPlaceholderText(/Enter Seller ID/i);

    fireEvent.change(input, { target: { value: 'seller-456' } });
    fireEvent.submit(form!);

    expect(mockOnLogin).toHaveBeenCalledWith('seller-456');
  });
});
