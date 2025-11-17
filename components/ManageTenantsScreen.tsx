

import React, { useState } from 'react';
import { Tenant } from '../types';
import { BackIcon } from './icons/BackIcon';
import { AddIcon } from './icons/AddIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ToggleOnIcon } from './icons/ToggleOnIcon';
import { ToggleOffIcon } from './icons/ToggleOffIcon';
import { CopyIcon } from './icons/CopyIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import TenantEditModal from './TenantEditModal';

interface ManageTenantsScreenProps {
  tenants: Tenant[];
  onBack: () => void;
  onAddTenant: (tenantData: Partial<Tenant>) => void;
  onUpdateTenant: (tenantData: Partial<Tenant>) => void;
  onDeleteTenant: (tenantId: string) => void;
}

const ManageTenantsScreen: React.FC<ManageTenantsScreenProps> = ({ tenants, onBack, onAddTenant, onUpdateTenant, onDeleteTenant }) => {
  const [editingTenant, setEditingTenant] = useState<Partial<Tenant> | null>(null);
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopyLink = (path: string) => {
    const url = `${window.location.origin}/#/${path}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(path);
    setTimeout(() => setCopySuccess(''), 2000);
  };
  
  const handleOpenLink = (path: string) => {
    window.open(`/#/${path}`, '_blank');
  };
  
  const handleSaveTenant = (tenantData: Partial<Tenant>) => {
    if (tenantData.id) {
        onUpdateTenant(tenantData);
    } else {
        onAddTenant(tenantData);
    }
    setEditingTenant(null);
  };

  return (
    <>
      {editingTenant && (
        <TenantEditModal 
          tenant={editingTenant}
          existingPaths={tenants.map(t => t.path)}
          onSave={handleSaveTenant}
          onClose={() => setEditingTenant(null)}
        />
      )}
      <div className="relative flex flex-col w-full h-full">
        <div className="absolute top-4 left-4 z-10">
          <button onClick={onBack} className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors" aria-label="Go Back">
            <BackIcon />
          </button>
        </div>

        <header className="text-center shrink-0 my-4 px-16">
          <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Manage Admins</h2>
        </header>
        
        <main className="w-full max-w-4xl mx-auto flex flex-col min-h-0">
          <div className="shrink-0 p-4 mb-6">
            <button onClick={() => setEditingTenant({})} className="w-full bg-[var(--color-positive)] hover:bg-[var(--color-positive-hover)] text-[var(--color-positive-text)] font-bold py-3 px-6 rounded-full text-lg flex items-center justify-center gap-2">
              <AddIcon /> Create New Admin
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto scrollbar-thin px-4">
            <div className="space-y-3">
              {tenants.map(tenant => (
                <div key={tenant.id} className={`p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${tenant.isActive ? 'border-[var(--color-border-primary)]' : 'border-red-800/50 bg-red-900/20'}`}>
                  <div>
                    <p className={`font-bold text-lg ${tenant.isActive ? 'text-[var(--color-text-primary)]' : 'text-gray-400'}`}>{tenant.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm text-[var(--color-text-accent)] bg-[var(--color-bg-primary)]/50 px-2 py-1 rounded">/#/{tenant.path}</code>
                        <button onClick={() => handleCopyLink(tenant.path)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Copy link">
                            {copySuccess === tenant.path ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon />}
                        </button>
                         <button onClick={() => handleOpenLink(tenant.path)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Open link in new tab">
                            <ExternalLinkIcon />
                        </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button onClick={() => onUpdateTenant({ ...tenant, isActive: !tenant.isActive })} className={`p-2 rounded-full ${tenant.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-red-400 hover:bg-red-500/20'}`} aria-label={tenant.isActive ? "Deactivate" : "Activate"}>
                        {tenant.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                    </button>
                    <button onClick={() => setEditingTenant(tenant)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-2 rounded-full" aria-label="Edit Tenant"><EditIcon /></button>
                    <button onClick={() => {
                        if (window.confirm(`Are you sure you want to delete admin "${tenant.username}"? All their data will be lost.`)) {
                            onDeleteTenant(tenant.id);
                        }
                    }} className="text-[var(--color-text-muted)] hover:text-[var(--color-negative)] p-2 rounded-full" aria-label="Delete Tenant"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ManageTenantsScreen;