
import React, { useState } from 'react';
import { Tenant } from '../types';

interface LoginModalProps {
  tenants: Tenant[];
  onLogin: (tenant?: Tenant) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ tenants, onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check for master admin
    if (username === 'admin' && password === '12345') {
      setError('');
      onLogin(); // Call without args for master
      return;
    }

    // 2. Check for tenant admins
    const matchedTenant = tenants.find(
      t => t.isActive && t.username === username && t.password === password
    );

    if (matchedTenant) {
      setError('');
      onLogin(matchedTenant); // Call with tenant object for redirect
      return;
    }

    // 3. If no match, show error
    setError('Invalid username or password.');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-bg-secondary)] rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-8 w-full max-w-sm border-4 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)] uppercase">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)] uppercase">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              required
            />
          </div>
          {error && <p className="text-red-500 font-bold text-center mb-4 bg-red-100 p-2 border-2 border-black">{error}</p>}
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-none text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
              Login
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-none text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
