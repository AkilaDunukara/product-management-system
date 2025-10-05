import React, { useState, FormEvent, ChangeEvent } from 'react';

interface LoginFormProps {
  onLogin: (sellerId: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [inputSellerId, setInputSellerId] = useState<string>('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (inputSellerId.trim()) {
      onLogin(inputSellerId.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Product Management System</h1>
        <p>Enter your Seller ID to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Seller ID (e.g., seller-123)"
            value={inputSellerId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputSellerId(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
        <div className="login-note">
          <small>This is a demo authentication. Use any seller ID (e.g., seller-123)</small>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
