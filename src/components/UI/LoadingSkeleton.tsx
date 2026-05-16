/**
 * Loading Skeleton Components
 * Provides better UX during data fetching
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClass = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }[animation];

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components
export function ListingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <Skeleton height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton width="60%" height={24} />
        <Skeleton width="40%" height={20} />
        <div className="flex items-center justify-between mt-4">
          <Skeleton width={80} height={32} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={24} className="rounded-full" />
      </div>
      <Skeleton width="100%" height={16} />
      <Skeleton width="80%" height={16} />
      <div className="flex items-center gap-4 mt-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={100} height={100} />
        <div className="flex-1 space-y-2">
          <Skeleton width={200} height={28} />
          <Skeleton width={150} height={20} />
          <Skeleton width={120} height={16} />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={48} />
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
      <Skeleton width={100} height={16} />
      <Skeleton width={120} height={36} />
      <Skeleton width="60%" height={14} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton width="100%" height={48} /> {/* Header */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={56} />
      ))}
    </div>
  );
}
