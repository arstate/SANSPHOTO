
import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';

// Declare Html5Qrcode global from CDN
declare const Html5Qrcode: any;

interface LoginModalProps {
  tenants: Tenant[];
  onLogin: (tenant?: Tenant) => void;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ tenants, onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Scanner logic
  const scannerContainerId = "login-reader";

  useEffect(() => {
    if (typeof Html5Qrcode === 'undefined') return;

    let html5QrCode: any = null;

    const startScanner = async () => {
        try {
            html5QrCode = new Html5Qrcode(scannerContainerId);
            await html5QrCode.start(
                { facingMode: "user" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText: string) => {
                    const cleanCode = decodedText.trim();
                    // Format QR Admin: SANS_ADMIN:username:password
                    if (cleanCode.startsWith('SANS_ADMIN:')) {
                        const parts = cleanCode.split(':');
                        if (parts.length === 3) {
                            const qrUser = parts[1];
                            const qrPass = parts[2];
                            
                            // Attempt login logic
                            if (qrUser === 'admin' && qrPass === '12345') {
                                html5QrCode.pause();
                                onLogin(); // Master login
                                return;
                            }

                            // Check tenant login
                            const matchedTenant = tenants.find(
                                t => t.isActive && t.username === qrUser && t.password === qrPass
                            );

                            if (matchedTenant) {
                                html5QrCode.pause();
                                onLogin(matchedTenant);
                            }
                        }
                    }
                },
                () => {} // Ignore errors
            );
        } catch (err) {
            console.error("Error starting login scanner", err);
        }
    };

    startScanner();

    return () => {
        if (html5QrCode) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch((err: any) => console.error(err));
        }
    };
  }, [tenants, onLogin]);

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
      {/* Hidden Scanner Container */}
      <div className="fixed inset-0 z-[-1] opacity-0 pointer-events-none overflow-hidden">
         <div id={scannerContainerId} className="w-full h-full"></div>
      </div>
      <style>{`
        #${scannerContainerId} video {
            transform: scaleX(1) !important; 
        }
      `}</style>

      <div 
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-sm border border-[var(--color-border-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required
            />
          </div>
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          <div className="flex flex-col gap-3">
            <button type="submit" className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg">
              Login
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
              Or scan your Admin QR Code
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
