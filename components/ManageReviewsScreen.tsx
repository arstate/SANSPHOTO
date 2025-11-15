import React from 'react';
import { Review } from '../types';
import { BackIcon } from './icons/BackIcon';
import { TrashIcon } from './icons/TrashIcon';
import { StarIcon } from './icons/StarIcon';

interface ManageReviewsScreenProps {
  reviews: Review[];
  onBack: () => void;
  onDelete: (reviewId: string) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} isFilled={i < rating} className="w-5 h-5 text-yellow-400" />
        ))}
    </div>
);


const ManageReviewsScreen: React.FC<ManageReviewsScreenProps> = ({ reviews, onBack, onDelete }) => {
  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-tertiary)]/70 text-[var(--color-text-primary)] font-bold p-3 rounded-full transition-colors"
          aria-label="Go Back"
        >
          <BackIcon />
        </button>
      </div>

      <header className="text-center shrink-0 my-4">
        <h2 className="text-4xl font-bebas tracking-wider text-[var(--color-text-primary)]">Manage User Reviews</h2>
      </header>
      
      <main className="w-full max-w-4xl mx-auto flex-grow overflow-y-auto scrollbar-thin pr-2 pb-4">
        {reviews.length > 0 ? (
            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)] flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-[var(--color-text-primary)]">{review.userName}</h3>
                                    <StarRating rating={review.rating} />
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1 sm:mt-0">
                                    {new Date(review.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] italic bg-[var(--color-bg-primary)]/50 p-3 rounded-md mb-2">
                                "{review.description}"
                            </p>
                            <p className="text-xs font-semibold text-[var(--color-text-accent)]">
                                Event: <span className="font-normal text-[var(--color-text-muted)]">{review.eventName}</span>
                            </p>
                        </div>
                        <div className="flex-shrink-0 self-center">
                            <button 
                                onClick={() => onDelete(review.id)}
                                className="bg-[var(--color-negative)] hover:bg-[var(--color-negative-hover)] text-[var(--color-negative-text)] p-3 rounded-full"
                                aria-label="Delete review"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center text-[var(--color-text-muted)] py-16">
                <p>No user reviews submitted yet.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default ManageReviewsScreen;
