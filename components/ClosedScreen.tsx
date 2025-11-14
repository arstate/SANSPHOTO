
import React, { useState, useEffect } from 'react';
import { AdminIcon } from './icons/AdminIcon';

interface ClosedScreenProps {
  reopenTimestamp: number;
  onAdminLoginClick: () => void;
}

const calculateTimeLeft = (timestamp: number) => {
  const difference = timestamp - new Date().getTime();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center justify-center bg-[var(--color-bg-secondary)]/50 p-4 rounded-xl w-24 h-24 sm:w-32 sm:h-32 border border-[var(--color-border-primary)]">
        <span className="text-4xl sm:text-6xl font-bebas text-[var(--color-text-accent)]">{String(value).padStart(2, '0')}</span>
        <span className="text-xs sm:text-sm uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
    </div>
);

const ClosedScreen: React.FC<ClosedScreenProps> = ({ reopenTimestamp, onAdminLoginClick }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(reopenTimestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(reopenTimestamp));
    }, 1000);

    return () => clearInterval(timer);
  }, [reopenTimestamp]);

  const reopenDate = new Date(reopenTimestamp);
  const formattedReopenDate = reopenDate.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 text-center flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-4">
      <div className="absolute top-4 left-4 z-20">
          <button 
            onClick={onAdminLoginClick}
            className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
            aria-label="Admin Login"
          >
            <AdminIcon />
          </button>
        </div>
      <div className="relative z-10">
        <h1 className="text-6xl md:text-8xl font-bebas tracking-widest text-[var(--color-text-primary)]" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
          SANS PHOTO IS CLOSED
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mt-2">We'll be back soon!</p>
        
        <div className="mt-8 mb-10 p-4 bg-[var(--color-bg-secondary)]/70 rounded-lg border border-[var(--color-border-primary)]">
            <p className="text-[var(--color-text-muted)]">Reopening on</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{formattedReopenDate}</p>
        </div>

        <div className="flex justify-center gap-2 sm:gap-4">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
        </div>
      </div>
    </div>
  );
};

export default ClosedScreen;
