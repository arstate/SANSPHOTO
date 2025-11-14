import React, { useState, useEffect, useCallback } from 'react';

interface PinInputModalProps {
  correctPin: string;
  onCorrectPin: () => void;
  onClose: () => void;
}

const PinInputModal: React.FC<PinInputModalProps> = ({ correctPin, onCorrectPin, onClose }) => {
  const [pin, setPin] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const handleKeyPress = useCallback((key: string) => {
    if (isWrong) return;
    if (key === 'backspace') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4 && !isNaN(parseInt(key, 10))) {
      setPin(p => p + key);
    }
  }, [pin, isWrong]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        onCorrectPin();
      } else {
        setIsWrong(true);
        setTimeout(() => {
          setPin('');
          setIsWrong(false);
        }, 800);
      }
    }
  }, [pin, correctPin, onCorrectPin]);

  const PinDisplay = () => (
    <div className="flex justify-center gap-4 mb-6">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-12 h-16 bg-[var(--color-bg-tertiary)] border-2 rounded-lg flex items-center justify-center text-4xl font-bold
            ${pin.length > i ? 'border-[var(--color-border-active)]' : 'border-[var(--color-border-secondary)]'}
            ${isWrong ? 'border-red-500' : ''}`}
        >
          {pin.length > i ? '•' : ''}
        </div>
      ))}
    </div>
  );

  const BackspaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" />
    </svg>
  );

  // FIX: Changed to React.FC to correctly type the component for use with a 'key' prop in a list.
  const KeypadButton: React.FC<{ value: string }> = ({ value }) => (
    <button
      onClick={() => handleKeyPress(value)}
      className="w-20 h-20 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-secondary)] rounded-full text-3xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
    >
      {value === 'backspace' ? <BackspaceIcon /> : value}
    </button>
  );

  const keypadLayout = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', 'backspace'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-[var(--color-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-sm border border-[var(--color-border-primary)] text-[var(--color-text-primary)] ${isWrong ? 'animate-shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-bebas text-4xl text-center mb-2">Enter PIN to Exit</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-6">Enter the 4-digit PIN to exit fullscreen mode.</p>
        <PinDisplay />
        <div className="grid grid-cols-3 gap-4 justify-items-center">
            {keypadLayout.map((key, i) => (
                key ? <KeypadButton key={i} value={key} /> : <div key={i} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default PinInputModal;