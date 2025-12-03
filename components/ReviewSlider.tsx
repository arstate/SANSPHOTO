
import React from 'react';
import { Review } from '../types';
import { StarIcon } from './icons/StarIcon';

interface ReviewSliderProps {
  reviews: Review[];
  maxDescriptionLength: number;
}

// Neo-Brutalism Palette for Borders
const BORDER_COLORS = [
  '#A855F7', // Purple
  '#FB923C', // Orange
  '#4ADE80', // Green
  '#F87171', // Red
  '#67E8F9', // Cyan
  '#FACC15', // Yellow
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} isFilled={i < rating} className="w-5 h-5 text-black fill-current" />
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
    <div className="absolute bottom-0 left-0 right-0 h-56 z-20 pointer-events-none flex items-end pb-6">
      <div className="w-full h-44 overflow-hidden pointer-events-auto">
        <div 
          className="flex animate-scroll items-center h-full" 
          style={{ width: `${reviews.length * 2 * 320}px` }} // 320px width per card + margin
        >
          {duplicatedReviews.map((review, index) => {
            // Cycle through border colors based on index
            const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];
            
            return (
              <div 
                key={`${review.id}-${index}`}
                className="w-72 h-36 shrink-0 mx-4 p-4 flex flex-col justify-between"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `4px solid ${borderColor}`, // Colorful Border
                  boxShadow: '6px 6px 0px 0px #000000',
                  fontFamily: "'Roboto Mono', monospace",
                  color: '#000000',
                }}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs font-bold bg-black text-white px-2 py-0.5">VERIFIED</span>
                  </div>
                  <p className="text-xs font-bold uppercase leading-tight line-clamp-3">
                    "{truncateText(review.description, maxDescriptionLength)}"
                  </p>
                </div>
                <p className="text-sm font-black text-right text-[var(--color-accent-primary)] bg-black/5 p-1">
                  — {review.userName.toUpperCase()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${reviews.length * 320}px); } /* Adjusted translation */
        }
        .animate-scroll {
          animation: scroll ${reviews.length * 10}s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ReviewSlider;
