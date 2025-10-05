import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductModal from '../../src/components/ProductModal';
import type { Product } from '../../src/types';

describe('ProductModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  const mockProduct: Product = {
    id: 1,
    seller_id: 'seller-123',
    name: 'Test Product',
    description: 'Test Description',
    price: 10.99,
    quantity: 100,
    category: 'Electronics',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  it('should render create product modal', () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    expect(screen.getByText('Create Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
  });

  it('should render edit product modal with product data', () => {
    render(<ProductModal product={mockProduct} onSave={mockOnSave} onClose={mockOnClose} />);

    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate price is greater than 0', async () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement;
    const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
    const categoryInput = screen.getByLabelText(/Category/i) as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '' } });
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should validate quantity is 0 or greater', async () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/Price/i) as HTMLInputElement;
    const quantityInput = screen.getByLabelText(/Quantity/i) as HTMLInputElement;
    const categoryInput = screen.getByLabelText(/Category/i) as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '10.99' } });
    fireEvent.change(quantityInput, { target: { value: '' } });
    fireEvent.change(categoryInput, { target: { value: 'Test' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity must be 0 or greater')).toBeInTheDocument();
    });
    
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should call onSave with valid data', async () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New Description' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Books' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: 'New Product',
        description: 'New Description',
        price: 19.99,
        quantity: 50,
        category: 'Books',
      });
    });
  });

  it('should call onClose when cancel is clicked', () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when overlay is clicked', () => {
    const { container } = render(
      <ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />
    );

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not call onClose when modal content is clicked', () => {
    const { container } = render(
      <ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />
    );

    const modalContent = container.querySelector('.modal-content');
    fireEvent.click(modalContent!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should clear field errors on change', async () => {
    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Product' } });

    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  it('should show saving state', async () => {
    mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Books' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  it('should handle save errors', async () => {
    mockOnSave.mockRejectedValue(new Error('Save failed'));

    render(<ProductModal product={null} onSave={mockOnSave} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '19.99' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Books' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
