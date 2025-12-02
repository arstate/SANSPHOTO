
import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';
import { Review, Settings } from '../types';

interface RatingScreenProps {
  eventName: string;
  onSubmit: (review: Omit<Review, 'id' | 'timestamp' | 'eventId' | 'eventName'>) => void;
  onSkip: () => void;
  settings: Settings;
}

const RatingScreen: React.FC<RatingScreenProps> = ({ eventName, onSubmit, onSkip, settings }) => {
  const {
    reviewSliderMaxDescriptionLength: maxDescriptionLength = 150,
    isReviewForFreebieEnabled = false,
    reviewFreebieTakesCount = 1,
    ratingScreenTitle = 'Bagaimana pengalaman Anda?',
    ratingScreenSubtitle = 'Ulasan Anda membantu kami menjadi lebih baik!',
    ratingScreenFreebieTitle = '⭐ PENAWARAN SPESIAL! ⭐',
    ratingScreenFreebieDescription = 'Berikan ulasan 5 bintang untuk mendapatkan {count} sesi foto tambahan gratis!',
    ratingScreenNameLabel = 'Nama Anda',
    ratingScreenNamePlaceholder = 'contoh: Budi',
    ratingScreenRatingLabel = 'Peringkat Anda',
    ratingScreenCommentLabel = 'Komentar',
    ratingScreenCommentPlaceholder = 'Ceritakan pendapat Anda...',
    ratingScreenSubmitButtonText = 'Kirim Ulasan',
    ratingScreenSkipButtonText = 'Lewati untuk sekarang',
  } = settings;

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
      <div className="w-full max-w-lg mx-auto bg-[var(--color-bg-secondary)] p-8 rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-[var(--color-border-primary)]">
        <h2 className="text-4xl font-bebas tracking-wider text-center text-[var(--color-text-primary)] mb-2">{ratingScreenTitle}</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-1">{ratingScreenSubtitle}</p>
        <p className="text-center text-[var(--color-text-accent)] font-bold mb-6">{eventName}</p>
        
        {isReviewForFreebieEnabled && reviewFreebieTakesCount > 0 && (
          <div className="text-center bg-purple-500/10 border-2 border-purple-500 p-3 rounded-none mb-6">
            <p className="font-bold text-[var(--color-text-accent)] uppercase">{ratingScreenFreebieTitle}</p>
            <p className="text-sm text-[var(--color-text-secondary)] font-bold">
              {ratingScreenFreebieDescription.replace('{count}', String(reviewFreebieTakesCount))}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)] uppercase">{ratingScreenNameLabel}</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              placeholder={ratingScreenNamePlaceholder}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-center text-[var(--color-text-secondary)] uppercase">{ratingScreenRatingLabel}</label>
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
                    className={`cursor-pointer transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'text-[var(--color-border-secondary)]'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold mb-2 text-[var(--color-text-secondary)] uppercase">{ratingScreenCommentLabel}</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-[var(--color-bg-tertiary)] border-2 border-black rounded-none py-2 px-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-black resize-none scrollbar-thin shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              placeholder={ratingScreenCommentPlaceholder}
              maxLength={maxDescriptionLength}
              required
            />
            <p className="text-right text-xs text-[var(--color-text-muted)] mt-1 font-mono">
              {description.length} / {maxDescriptionLength}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-accent-primary-text)] font-bold py-3 px-4 rounded-none border-2 border-black text-lg transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:bg-[var(--color-bg-tertiary)] disabled:cursor-not-allowed uppercase"
            >
              {ratingScreenSubmitButtonText}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full bg-white hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] font-bold py-3 px-4 rounded-none border-2 border-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 uppercase"
            >
              {ratingScreenSkipButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingScreen;
