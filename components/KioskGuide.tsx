import React from 'react';

interface KioskGuideProps {
  onClose: () => void;
}

const KioskGuide: React.FC<KioskGuideProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-6 w-full max-w-2xl border border-[var(--color-border-primary)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bebas text-3xl text-center mb-2">How to Enable True Kiosk Mode</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-6">
          For maximum security, use your device's built-in features. The app's "Strict Kiosk Mode" is a strong deterrent but can be bypassed by advanced users. For a foolproof solution, follow these guides:
        </p>

        <div className="flex-grow overflow-y-auto scrollbar-thin space-y-4 pr-2">
          {/* Windows Guide */}
          <div className="bg-[var(--color-bg-primary)]/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-[var(--color-text-accent)] mb-2">Windows (Assigned Access)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>Open Windows Settings &gt; Accounts &gt; Family & other users.</li>
              <li>Under "Set up a kiosk", click "Assigned access".</li>
              <li>Create a new local account for the kiosk.</li>
              <li>Choose the web browser (e.g., Microsoft Edge) as the kiosk app.</li>
              <li>Set the browser's startup page to this photobooth's URL.</li>
            </ol>
          </div>
          
          {/* Android Guide */}
          <div className="bg-[var(--color-bg-primary)]/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-[var(--color-text-accent)] mb-2">Android (Screen Pinning)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>Go to Settings &gt; Security &gt; Advanced &gt; Screen pinning (or App pinning).</li>
              <li>Turn it on. Enable "Ask for PIN before unpinning".</li>
              <li>Open this photobooth app in your browser.</li>
              <li>Open the recent apps screen.</li>
              <li>Tap the app icon and select "Pin".</li>
            </ol>
          </div>
          
          {/* iOS/iPadOS Guide */}
          <div className="bg-[var(--color-bg-primary)]/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-[var(--color-text-accent)] mb-2">iOS/iPadOS (Guided Access)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--color-text-secondary)]">
              <li>Go to Settings &gt; Accessibility &gt; Guided Access.</li>
              <li>Turn it on and set a passcode.</li>
              <li>Open this photobooth app in Safari.</li>
              <li>Triple-click the side or Home button to start Guided Access.</li>
              <li>(Optional) Circle areas of the screen to disable, like the address bar.</li>
            </ol>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskGuide;