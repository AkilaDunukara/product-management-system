import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AppHeader from '../../src/components/AppHeader';

describe('AppHeader', () => {
  const mockOnPageChange = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with seller ID', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="products"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText('Product Management System')).toBeInTheDocument();
    expect(screen.getByText('Seller: seller-123')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="products"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('should highlight active page', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="products"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    const productsButton = screen.getByText('Products');
    const importButton = screen.getByText('Import CSV');

    expect(productsButton).toHaveClass('active');
    expect(importButton).not.toHaveClass('active');
  });

  it('should call onPageChange when Products is clicked', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="import"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    const productsButton = screen.getByText('Products');
    fireEvent.click(productsButton);

    expect(mockOnPageChange).toHaveBeenCalledWith('products');
  });

  it('should call onPageChange when Import CSV is clicked', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="products"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    const importButton = screen.getByText('Import CSV');
    fireEvent.click(importButton);

    expect(mockOnPageChange).toHaveBeenCalledWith('import');
  });

  it('should call onLogout when Logout is clicked', () => {
    render(
      <AppHeader
        sellerId="seller-123"
        currentPage="products"
        onPageChange={mockOnPageChange}
        onLogout={mockOnLogout}
      />
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });
});
