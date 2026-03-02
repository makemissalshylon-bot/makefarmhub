import React, { Component, type ReactNode, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface SafeComponentState {
  hasError: boolean;
  error: Error | null;
}

/**
 * SafeComponent - Wraps any component to prevent crashes
 * Use this around components that might fail
 */
class SafeComponent extends Component<SafeComponentProps, SafeComponentState> {
  constructor(props: SafeComponentProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SafeComponentState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('SafeComponent caught error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="safe-component-error">
          <p>This section couldn't load. Please refresh the page.</p>
        </div>
      );
    }

    return (
      <Suspense fallback={this.props.loadingFallback || <LoadingFallback />}>
        {this.props.children}
      </Suspense>
    );
  }
}

/**
 * Default loading fallback
 */
function LoadingFallback(): React.JSX.Element {
  return (
    <div className="safe-component-loading">
      <Loader2 className="animate-spin" size={24} />
      <span>Loading...</span>
    </div>
  );
}

/**
 * Higher-order component to make any component safe
 */
export function withSafeComponent<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeComponent fallback={fallback}>
        <WrappedComponent {...props} />
      </SafeComponent>
    );
  };
}

/**
 * Safe render function - renders content safely
 */
export function safeRender(
  renderFn: () => ReactNode,
  fallback: ReactNode = null
): ReactNode {
  try {
    return renderFn();
  } catch (error) {
    console.error('Safe render error:', error);
    return fallback;
  }
}

/**
 * Safe map function for rendering lists
 */
export function safeMap<T>(
  items: T[] | null | undefined,
  renderFn: (item: T, index: number) => ReactNode,
  fallback: ReactNode = null
): ReactNode[] {
  if (!items || !Array.isArray(items)) {
    return [fallback];
  }

  return items.map((item, index) => {
    try {
      return renderFn(item, index);
    } catch (error) {
      console.error('Safe map render error at index', index, error);
      return null;
    }
  }).filter(Boolean) as ReactNode[];
}

export default SafeComponent;
