import { Component, type ReactNode, type ErrorInfo } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ErrorBoundary");

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Uncaught error", { error: error.message, stack: errorInfo.componentStack });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="font-data text-xs text-muted-foreground">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary/80"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
