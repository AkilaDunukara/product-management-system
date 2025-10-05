import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import AppHeader from './components/AppHeader';
import AppLayout from './components/AppLayout';
import ProductsTable from './components/ProductsTable';
import ImportPage from './components/ImportPage';
import { useLocalStorage } from './hooks';

type PageType = 'products' | 'import';

const App: React.FC = () => {
  const [sellerId, setSellerId, removeSellerId] = useLocalStorage<string>('sellerId', '');
  const [currentPage, setCurrentPage] = useState<PageType>('products');

  const isAuthenticated = !!sellerId;

  if (!isAuthenticated) {
    return <LoginForm onLogin={setSellerId} />;
  }

  return (
    <div className="app">
      <AppHeader
        sellerId={sellerId}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={removeSellerId}
      />
      <AppLayout sellerId={sellerId}>
        {currentPage === 'products' && <ProductsTable />}
        {currentPage === 'import' && <ImportPage />}
      </AppLayout>
    </div>
  );
};

export default App;