import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';
import * as hooks from '../src/hooks';

jest.mock('../src/hooks');
jest.mock('../src/components/LoginForm', () => {
  return function MockLoginForm({ onLogin }: any) {
    return (
      <div data-testid="login-form">
        <button onClick={() => onLogin('seller-123')}>Mock Login</button>
      </div>
    );
  };
});
jest.mock('../src/components/AppHeader', () => {
  return function MockAppHeader({ onLogout, onPageChange, currentPage }: any) {
    return (
      <div data-testid="app-header">
        <button onClick={onLogout}>Logout</button>
        <button onClick={() => onPageChange('products')}>Products</button>
        <button onClick={() => onPageChange('import')}>Import</button>
        <span>{currentPage}</span>
      </div>
    );
  };
});
jest.mock('../src/components/AppLayout', () => {
  return function MockAppLayout({ children }: any) {
    return <div data-testid="app-layout">{children}</div>;
  };
});
jest.mock('../src/components/ProductsTable', () => {
  return function MockProductsTable() {
    return <div data-testid="products-table">Products Table</div>;
  };
});
jest.mock('../src/components/ImportPage', () => {
  return function MockImportPage() {
    return <div data-testid="import-page">Import Page</div>;
  };
});

describe('App', () => {
  const mockUseLocalStorage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useLocalStorage as jest.Mock).mockImplementation((key, initialValue) => {
      return mockUseLocalStorage(key, initialValue);
    });
  });

  it('should render LoginForm when not authenticated', () => {
    mockUseLocalStorage.mockReturnValue(['', jest.fn(), jest.fn()]);

    render(<App />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument();
  });

  it('should render app content when authenticated', () => {
    mockUseLocalStorage.mockReturnValue(['seller-123', jest.fn(), jest.fn()]);

    render(<App />);

    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('should render ProductsTable by default', () => {
    mockUseLocalStorage.mockReturnValue(['seller-123', jest.fn(), jest.fn()]);

    render(<App />);

    expect(screen.getByTestId('products-table')).toBeInTheDocument();
    expect(screen.queryByTestId('import-page')).not.toBeInTheDocument();
  });

  it('should switch to ImportPage when import page is selected', () => {
    mockUseLocalStorage.mockReturnValue(['seller-123', jest.fn(), jest.fn()]);

    render(<App />);

    const importButton = screen.getByText('Import');
    fireEvent.click(importButton);

    expect(screen.getByTestId('import-page')).toBeInTheDocument();
    expect(screen.queryByTestId('products-table')).not.toBeInTheDocument();
  });

  it('should switch back to ProductsTable', () => {
    mockUseLocalStorage.mockReturnValue(['seller-123', jest.fn(), jest.fn()]);

    render(<App />);

    const importButton = screen.getByText('Import');
    fireEvent.click(importButton);

    const productsButton = screen.getByText('Products');
    fireEvent.click(productsButton);

    expect(screen.getByTestId('products-table')).toBeInTheDocument();
    expect(screen.queryByTestId('import-page')).not.toBeInTheDocument();
  });

  it('should handle login', () => {
    const mockSetSellerId = jest.fn();
    mockUseLocalStorage.mockReturnValue(['', mockSetSellerId, jest.fn()]);

    render(<App />);

    const loginButton = screen.getByText('Mock Login');
    fireEvent.click(loginButton);

    expect(mockSetSellerId).toHaveBeenCalledWith('seller-123');
  });

  it('should handle logout', () => {
    const mockRemoveSellerId = jest.fn();
    mockUseLocalStorage.mockReturnValue(['seller-123', jest.fn(), mockRemoveSellerId]);

    render(<App />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockRemoveSellerId).toHaveBeenCalled();
  });

  it('should use useLocalStorage with correct key and initial value', () => {
    mockUseLocalStorage.mockReturnValue(['', jest.fn(), jest.fn()]);

    render(<App />);

    expect(hooks.useLocalStorage).toHaveBeenCalledWith('sellerId', '');
  });
});
