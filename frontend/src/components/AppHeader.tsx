import React from 'react';

interface AppHeaderProps {
  sellerId: string;
  currentPage: 'products' | 'import';
  onPageChange: (page: 'products' | 'import') => void;
  onLogout: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ sellerId, currentPage, onPageChange, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Product Management System</h1>
        <div className="header-actions">
          <span className="seller-id">Seller: {sellerId}</span>
          <button className="btn btn-secondary btn-small" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
      <nav className="app-nav">
        <button
          className={`nav-link ${currentPage === 'products' ? 'active' : ''}`}
          onClick={() => onPageChange('products')}
        >
          Products
        </button>
        <button
          className={`nav-link ${currentPage === 'import' ? 'active' : ''}`}
          onClick={() => onPageChange('import')}
        >
          Import CSV
        </button>
      </nav>
    </header>
  );
};

export default AppHeader;
