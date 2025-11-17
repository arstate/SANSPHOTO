
import React, { useState, useEffect } from 'react';
import { Tenant } from '../types';

interface TenantEditModalProps {
  tenant: Partial<Tenant> | null;
  existingPaths: string[];
  onSave: (tenantData: Partial<Tenant>) => void;
  onClose: () => void;
}

const TenantEditModal: React.FC<TenantEditModalProps> = ({ tenant, existingPaths, onSave, onClose }) => {
  const [tenantData, setTenantData] = useState<Partial<Tenant>>({
    username: '',
    password: '',
    path: '',
    isActive: true,
    ...tenant
  });
  const [pathError, setPathError] = useState<string | null>(null);

  const isNew = !tenant?.id;

  useEffect(() => {
    setTenantData({
      username: '',
      password: '',
      path: '',
      isActive: true,
      ...tenant
    });
  }, [tenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'path') {
      const sanitizedPath = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const isPathTaken = existingPaths.includes(sanitizedPath) && sanitizedPath !== tenant?.path;
      if (isPathTaken) {
        setPathError('This path is already taken.');
      } else {
        setPathError(null);
      }
      setTenantData(prev => ({ ...prev, [name]: sanitizedPath }));
    } else {
      setTenantData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathError) return;
    onSave(tenantData);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-md border border-[var(--color-border-primary)]" onClick={e => e.stopPropagation()}>
        <h2 className="font-bebas text-4xl text-center mb-6">{isNew ? 'Create New Admin' : 'Edit Admin'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Username</label>
            <input
              id="username" name="username" type="text"
              value={tenantData.username} onChange={handleChange}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Password</label>
            <input
              id="password" name="password" type="password"
              value={tenantData.password} onChange={handleChange}
              placeholder={isNew ? '' : 'Leave blank to keep unchanged'}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              required={isNew}
            />
          </div>
          <div>
            <label htmlFor="path" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Custom URL Path</label>
            <div className="flex items-center">
                <span className="bg-[var(--color-bg-tertiary)] border border-r-0 border-[var(--color-border-secondary)] rounded-l-md px-3 py-2 text-[var(--color-text-muted)]">/</span>
                <input
                    id="path" name="path" type="text"
                    value={tenantData.path} onChange={handleChange}
                    className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-r-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
                    required
                />
            </div>
            {pathError && <p className="text-red-400 text-sm mt-1">{pathError}</p>}
             <p className="text-xs text-[var(--color-text-muted)] mt-1">Only lowercase letters, numbers, and hyphens are allowed.</p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button type="submit" disabled={!!pathError} className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-4 rounded-full text-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
              Save
            </button>
            <button type="button" onClick={onClose} className="w-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-full text-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantEditModal;
