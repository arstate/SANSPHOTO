
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
          For professional use, configure your browser to run in full Kiosk mode with silent printing.
        </p>

        <div className="flex-grow overflow-y-auto scrollbar-thin space-y-6 pr-2">
          
          {/* Silent Printing Guide (New) */}
          <div className="bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)] p-4 rounded-lg">
            <h3 className="font-bold text-lg text-[var(--color-accent-primary)] mb-2">🔥 How to Remove Print Popup (Silent Print)</h3>
            <p className="text-sm text-[var(--color-text-primary)] mb-2">
                By default, browsers force a popup. To print instantly on click:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>Close all open Chrome/Edge windows.</li>
              <li>Right-click your browser shortcut (e.g., Chrome) on Desktop.</li>
              <li>Select <strong>Properties</strong>.</li>
              <li>In the <strong>Target</strong> field, add this to the very end (after the quotes):<br/>
                  <code className="bg-black/30 px-2 py-1 rounded text-white select-all"> --kiosk-printing</code>
              </li>
              <li>Click Apply/OK.</li>
              <li>Launch the browser using this shortcut. Now, when you click Print, it will send data directly to the default printer without a dialog.</li>
            </ol>
          </div>

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
