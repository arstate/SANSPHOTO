
import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';
import { Review } from '../types';

interface RatingScreenProps {
  eventName: string;
  onSubmit: (review: Omit<Review, 'id' | 'timestamp' | 'eventId' | 'eventName'>) => void;
  onSkip: () => void;
  maxDescriptionLength: number;
  isReviewForFreebieEnabled: boolean;
  reviewFreebieTakesCount: number;
}

const RatingScreen: React.FC<RatingScreenProps> = ({ eventName, onSubmit, onSkip, maxDescriptionLength, isReviewForFreebieEnabled, reviewFreebieTakesCount }) => {
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
        <h2 className="text-4xl font-bebas tracking-wider text-center text-[var(--color-text-primary)] mb-2">Bagaimana pengalaman Anda?</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-1">Ulasan Anda membantu kami menjadi lebih baik!</p>
        <p className="text-center text-[var(--color-text-accent)] font-bold mb-6">{eventName}</p>
        
        {isReviewForFreebieEnabled && reviewFreebieTakesCount > 0 && (
          <div className="text-center bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg mb-6">
            <p className="font-bold text-[var(--color-text-accent)]">⭐ PENAWARAN SPESIAL! ⭐</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Berikan ulasan 5 bintang untuk mendapatkan {reviewFreebieTakesCount} sesi foto tambahan gratis!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Nama Anda</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
              placeholder="contoh: Budi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-center text-[var(--color-text-secondary)]">Peringkat Anda</label>
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
            <label htmlFor="description" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)]">Komentar</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-md py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] resize-none scrollbar-thin"
              placeholder="Ceritakan pendapat Anda..."
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
              Kirim Ulasan
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full bg-transparent hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] font-bold py-3 px-4 rounded-full text-lg"
            >
              Lewati untuk sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingScreen;
