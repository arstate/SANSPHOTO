
import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const welcomeTitle = 'SANS PHOTO';
  const startButtonText = 'START SESSION';

  return (
    <div className="fixed inset-0 text-center flex flex-col items-center justify-center transition-colors duration-300 overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4">
        <h1 
          className="text-8xl md:text-9xl tracking-widest text-white font-bebas"
          style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
        >
          {welcomeTitle}
        </h1>
        <button
            onClick={onStart}
            className={`
                bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)]
                text-[var(--color-accent-primary-text)]
                shadow-lg shadow-black/50
                font-bold py-3 px-10 rounded-full text-xl transition-transform transform hover:scale-105
                mt-8
            `}
          >
            {startButtonText}
          </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
