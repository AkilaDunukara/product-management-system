import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductsTable from '../../src/components/ProductsTable';
import * as hooks from '../../src/hooks';
import type { Product } from '../../src/types';

jest.mock('../../src/hooks');
jest.mock('../../src/components/ProductModal', () => {
  return function MockProductModal({ onClose }: any) {
    return <div data-testid="product-modal" onClick={onClose}>Product Modal</div>;
  };
});
jest.mock('../../src/components/Toast', () => {
  return function MockToast({ message }: any) {
    return <div data-testid="toast">{message}</div>;
  };
});

describe('ProductsTable', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      seller_id: 'seller-123',
      name: 'Product 1',
      description: 'Description 1',
      price: 10.99,
      quantity: 100,
      category: 'Electronics',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      seller_id: 'seller-123',
      name: 'Product 2',
      description: 'Description 2',
      price: 5.99,
      quantity: 5,
      category: 'Books',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockUseProducts = {
    products: mockProducts,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
    filters: { category: '', sort_by: 'created_at', sort_order: 'desc' },
    setFilters: jest.fn(),
    setPage: jest.fn(),
    refresh: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  const mockUseToast = {
    toast: null,
    showToast: jest.fn(),
    hideToast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useProducts as jest.Mock).mockReturnValue(mockUseProducts);
    (hooks.useToast as jest.Mock).mockReturnValue(mockUseToast);
  });

  it('should render products table', () => {
    render(<ProductsTable />);

    expect(screen.getByText('Products Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    (hooks.useProducts as jest.Mock).mockReturnValue({
      ...mockUseProducts,
      products: [],
      loading: true,
    });

    render(<ProductsTable />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should render product data correctly', () => {
    render(<ProductsTable />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should show low stock badge for products with quantity < 10', () => {
    render(<ProductsTable />);

    const lowStockBadges = screen.getAllByText('Low');
    expect(lowStockBadges).toHaveLength(1);
  });

  it('should open create modal when Add Product is clicked', () => {
    render(<ProductsTable />);

    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);

    expect(screen.getByTestId('product-modal')).toBeInTheDocument();
  });

  it('should open edit modal when Edit is clicked', () => {
    render(<ProductsTable />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByTestId('product-modal')).toBeInTheDocument();
  });

  it('should call deleteProduct when Delete is confirmed', async () => {
    global.confirm = jest.fn(() => true);
    mockUseProducts.deleteProduct.mockResolvedValue(undefined);

    render(<ProductsTable />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockUseProducts.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockUseToast.showToast).toHaveBeenCalledWith('Product deleted successfully');
    });
  });

  it('should not delete when Delete is cancelled', () => {
    global.confirm = jest.fn(() => false);

    render(<ProductsTable />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockUseProducts.deleteProduct).not.toHaveBeenCalled();
  });

  it('should handle delete errors', async () => {
    global.confirm = jest.fn(() => true);
    mockUseProducts.deleteProduct.mockRejectedValue(new Error('Delete failed'));

    render(<ProductsTable />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockUseToast.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete product'),
        'error'
      );
    });
  });

  it('should update filters when category input changes', () => {
    render(<ProductsTable />);

    const categoryInput = screen.getByPlaceholderText('Filter by category');
    fireEvent.change(categoryInput, { target: { value: 'Electronics' } });

    expect(mockUseProducts.setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'Electronics' })
    );
  });

  it('should update filters when sort_by changes', () => {
    render(<ProductsTable />);

    const sortBySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(sortBySelect, { target: { value: 'price' } });

    expect(mockUseProducts.setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'price' })
    );
  });

  it('should update filters when sort_order changes', () => {
    render(<ProductsTable />);

    const sortOrderSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });

    expect(mockUseProducts.setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ sort_order: 'asc' })
    );
  });

  it('should render pagination when multiple pages', () => {
    (hooks.useProducts as jest.Mock).mockReturnValue({
      ...mockUseProducts,
      pagination: { page: 1, limit: 20, total: 50, total_pages: 3 },
    });

    render(<ProductsTable />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3 (50 total)')).toBeInTheDocument();
  });

  it('should disable Previous button on first page', () => {
    (hooks.useProducts as jest.Mock).mockReturnValue({
      ...mockUseProducts,
      pagination: { page: 1, limit: 20, total: 50, total_pages: 3 },
    });

    render(<ProductsTable />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    (hooks.useProducts as jest.Mock).mockReturnValue({
      ...mockUseProducts,
      pagination: { page: 3, limit: 20, total: 50, total_pages: 3 },
    });

    render(<ProductsTable />);

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should call setPage when pagination buttons are clicked', () => {
    (hooks.useProducts as jest.Mock).mockReturnValue({
      ...mockUseProducts,
      pagination: { page: 2, limit: 20, total: 50, total_pages: 3 },
    });

    render(<ProductsTable />);

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    expect(mockUseProducts.setPage).toHaveBeenCalledWith(1);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(mockUseProducts.setPage).toHaveBeenCalledWith(3);
  });
});
