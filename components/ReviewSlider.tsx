import React from 'react';
import { Review } from '../types';
import { StarIcon } from './icons/StarIcon';

interface ReviewSliderProps {
  reviews: Review[];
  maxDescriptionLength: number;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} isFilled={i < rating} className="w-5 h-5 text-yellow-400" />
        ))}
    </div>
);

const ReviewSlider: React.FC<ReviewSliderProps> = ({ reviews, maxDescriptionLength }) => {
  const duplicatedReviews = [...reviews, ...reviews]; // Duplicate for seamless loop

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--color-bg-secondary)] via-[var(--color-bg-secondary)]/80 to-transparent z-20">
      <div className="absolute bottom-4 left-0 w-full h-40 overflow-hidden">
        <div 
          className="flex animate-scroll" 
          style={{ width: `${reviews.length * 2 * 288}px` }} // 288px = 18rem width per card
        >
          {duplicatedReviews.map((review, index) => (
            <div 
              key={`${review.id}-${index}`}
              className="w-72 h-36 shrink-0 mx-2 p-4 flex flex-col justify-between rounded-lg shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-primary)',
                fontFamily: "'Lora', serif",
                color: 'var(--color-text-secondary)',
              }}
            >
              <div>
                <StarRating rating={review.rating} />
                <p className="text-sm italic mt-2">
                  "{truncateText(review.description, maxDescriptionLength)}"
                </p>
              </div>
              <p className="text-xs font-bold text-right text-[var(--color-text-accent)]">
                - {review.userName}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${reviews.length * 288}px); }
        }
        .animate-scroll {
          animation: scroll ${reviews.length * 8}s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ReviewSlider;
