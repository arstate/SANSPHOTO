
import React from 'react';

const TenantNotFoundScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-8xl font-bebas tracking-widest text-[var(--color-text-primary)]">404</h1>
      <p className="text-xl text-[var(--color-text-secondary)] mt-2">Photobooth Not Found</p>
      <p className="text-[var(--color-text-muted)] mt-4">
        The link you followed may be broken, or the page may have been removed or deactivated.
      </p>
    </div>
  );
};

export default TenantNotFoundScreen;
