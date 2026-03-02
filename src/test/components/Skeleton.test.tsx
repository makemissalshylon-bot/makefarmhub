/**
 * Skeleton Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '../../components/UI/Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with custom width and height', () => {
    render(<Skeleton width="200px" height="50px" />);
    const skeleton = document.querySelector('.skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('renders with text variant', () => {
    render(<Skeleton variant="text" />);
    const skeleton = document.querySelector('.skeleton-text');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with circular variant', () => {
    render(<Skeleton variant="circular" />);
    const skeleton = document.querySelector('.skeleton-circular');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with wave animation', () => {
    render(<Skeleton animation="wave" />);
    const skeleton = document.querySelector('.skeleton-wave');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton', () => {
    render(<SkeletonCard />);
    const card = document.querySelector('.skeleton-card');
    expect(card).toBeInTheDocument();
  });
});

describe('SkeletonList', () => {
  it('renders correct number of items', () => {
    render(<SkeletonList count={5} />);
    const items = document.querySelectorAll('.skeleton-list-item');
    expect(items).toHaveLength(5);
  });

  it('renders default 3 items', () => {
    render(<SkeletonList />);
    const items = document.querySelectorAll('.skeleton-list-item');
    expect(items).toHaveLength(3);
  });
});

describe('SkeletonTable', () => {
  it('renders table skeleton with correct rows', () => {
    render(<SkeletonTable rows={4} cols={3} />);
    const rows = document.querySelectorAll('.skeleton-table-row');
    expect(rows).toHaveLength(4);
  });
});
