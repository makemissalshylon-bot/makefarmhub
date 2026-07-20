/**
 * Skeleton Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '../utils';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '../../components/UI/Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders with custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('renders with text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
  });

  it('renders with circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.querySelector('.skeleton-circular')).toBeInTheDocument();
  });

  it('renders with wave animation', () => {
    const { container } = render(<Skeleton animation="wave" />);
    expect(container.querySelector('.skeleton-wave')).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
  });
});

describe('SkeletonList', () => {
  it('renders correct number of items', () => {
    const { container } = render(<SkeletonList count={5} />);
    expect(container.querySelectorAll('.skeleton-list-item')).toHaveLength(5);
  });

  it('renders default 3 items', () => {
    const { container } = render(<SkeletonList />);
    expect(container.querySelectorAll('.skeleton-list-item')).toHaveLength(3);
  });
});

describe('SkeletonTable', () => {
  it('renders table skeleton with correct rows', () => {
    const { container } = render(<SkeletonTable rows={4} cols={3} />);
    expect(container.querySelectorAll('.skeleton-table-row')).toHaveLength(4);
  });
});
