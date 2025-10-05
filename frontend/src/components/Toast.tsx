import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && '✅ '}
      {type === 'error' && '❌ '}
      {type === 'info' && 'ℹ️ '}
      {message}
    </div>
  );
};

export default Toast;