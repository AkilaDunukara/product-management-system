import React, { useState, ChangeEvent } from 'react';
import ProductModal from './ProductModal';
import Toast from './Toast';
import { useProducts, useToast } from '../hooks';
import type { Product, ProductFilters, ProductCreateRequest } from '../types';

const ProductsTable: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { products, loading, pagination, filters, setFilters, setPage, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast, showToast } = useToast();

  const handleCreate = (): void => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product): void => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (product: Product): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      showToast('Product deleted successfully');
    } catch (error: any) {
      showToast('Failed to delete product: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleSave = async (productData: ProductCreateRequest): Promise<void> => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        showToast('Product updated successfully');
      } else {
        await createProduct(productData);
        showToast('Product created successfully');
      }
      setModalOpen(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const handlePageChange = (newPage: number): void => {
    setPage(newPage);
  };

  const handleFilterChange = (key: keyof ProductFilters, value: string): void => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading && products.length === 0) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Products Dashboard</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          Add Product
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Filter by category"
          value={filters.category || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange('category', e.target.value)}
          className="filter-input"
        />
        <select
          value={filters.sort_by || 'created_at'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('sort_by', e.target.value)}
          className="filter-select"
        >
          <option value="created_at">Created Date</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="quantity">Quantity</option>
        </select>
        <select
          value={filters.sort_order || 'desc'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange('sort_order', e.target.value)}
          className="filter-select"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={product.quantity < 10 ? 'low-stock' : ''}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  {product.quantity}
                  {product.quantity < 10 && <span className="low-stock-badge">Low</span>}
                </td>
                <td>{new Date(product.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  <button className="btn btn-small btn-edit" onClick={() => handleEdit(product)}>
                    Edit
                  </button>
                  <button className="btn btn-small btn-delete" onClick={() => handleDelete(product)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.total_pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-small"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
          </span>
          <button
            className="btn btn-small"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.total_pages}
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default ProductsTable;