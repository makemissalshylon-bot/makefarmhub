import { useState, useRef, type ReactNode } from 'react';
import { Trash2, Heart, Archive } from 'lucide-react';
import './SwipeableCard.css';

interface SwipeAction {
  icon: ReactNode;
  color: string;
  action: () => void;
  label: string;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export default function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;

    // Limit swipe distance
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

    // Only allow swipe if there are actions in that direction
    if (diff > 0 && leftActions.length === 0) return;
    if (diff < 0 && rightActions.length === 0) return;

    setTranslateX(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setTranslateX(0);
  };

  const leftProgress = Math.min(translateX / threshold, 1);
  const rightProgress = Math.min(-translateX / threshold, 1);

  return (
    <div className="swipeable-card-container">
      {/* Left Actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div
          className="swipe-actions left"
          style={{
            opacity: leftProgress,
            transform: `scale(${0.8 + leftProgress * 0.2})`,
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              className="swipe-action-btn"
              style={{ backgroundColor: action.color }}
              onClick={action.action}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div
          className="swipe-actions right"
          style={{
            opacity: rightProgress,
            transform: `scale(${0.8 + rightProgress * 0.2})`,
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              className="swipe-action-btn"
              style={{ backgroundColor: action.color }}
              onClick={action.action}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        className="swipeable-card-content"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Export common action presets
export const SwipeActions = {
  delete: (onDelete: () => void): SwipeAction => ({
    icon: <Trash2 size={20} />,
    color: '#ef4444',
    action: onDelete,
    label: 'Delete',
  }),
  favorite: (onFavorite: () => void): SwipeAction => ({
    icon: <Heart size={20} />,
    color: '#ec4899',
    action: onFavorite,
    label: 'Favorite',
  }),
  archive: (onArchive: () => void): SwipeAction => ({
    icon: <Archive size={20} />,
    color: '#6366f1',
    action: onArchive,
    label: 'Archive',
  }),
};
