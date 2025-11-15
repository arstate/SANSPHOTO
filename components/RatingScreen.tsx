import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';
import { Review } from '../types';

interface RatingScreenProps {
  eventName: string;
  onSubmit: (review: Omit<Review, 'id' | 'timestamp' | 'eventId' | 'eventName'>) => void;
  onSkip: () => void;
  maxDescriptionLength: number;
}

const RatingScreen: React.FC<RatingScreenProps> = ({ eventName, onSubmit, onSkip, maxDescriptionLength }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [description, setDescription] = useState('');
  
  const isFormValid = userName.trim() !== '' && rating > 0 && description.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit({ userName, rating, description });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
      <div className="w-full max-w-lg mx-auto bg-[var(--color-bg-secondary)] p-8 rounded-2xl shadow-2xl border border-[var(--color-border-primary)]">
        <h2 className="text-4xl font-bebas tracking-wider text-center text-[var(--color-text-primary)] mb-2">How was your experience?</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-1">Your feedback helps us improve!</p>
        <p className="text-center text-[var(--color-text-accent)] font-bold mb-6">{eventName}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Your Name</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-center text-[var(--color-text-secondary)]">Your Rating</label>
            <div className="flex justify-center items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className="focus:outline-none"
                >
                  <StarIcon 
                    isFilled={(hoverRating || rating) >= star}
                    className={`cursor-pointer transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-[var(--color-border-secondary)]'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Comments</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] resize-none scrollbar-thin"
              placeholder="Tell us what you think..."
              maxLength={maxDescriptionLength}
              required
            />
            <p className="text-right text-xs text-[var(--color-text-muted)] mt-1">
              {description.length} / {maxDescriptionLength}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-full text-lg transition-colors disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full bg-transparent hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] font-bold py-3 px-4 rounded-full text-lg"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingScreen;
