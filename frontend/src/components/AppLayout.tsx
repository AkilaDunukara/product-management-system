import React, { ReactNode } from 'react';
import NotificationsPanel from './NotificationsPanel';

interface AppLayoutProps {
  sellerId: string;
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ sellerId, children }) => {
  return (
    <div className="app-content">
      <main className="main-content">
        {children}
      </main>
      <aside className="sidebar">
        <NotificationsPanel sellerId={sellerId} />
      </aside>
    </div>
  );
};

export default AppLayout;
