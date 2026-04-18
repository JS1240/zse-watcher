import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginPrompt } from "@/features/auth/components/login-prompt";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Polished loading skeleton matching LoginPrompt layout for smooth auth state transitions.
 */
function AuthLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      {/* Logo area */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-6 w-32 rounded-md" />
      </div>

      {/* Description */}
      <Skeleton className="h-3 w-48 rounded-md" />

      {/* Form skeleton */}
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />

        {/* Divider */}
        <div className="relative flex py-2">
          <div className="h-px w-full" />
          <Skeleton className="absolute left-1/2 top-1/2 h-3 w-8 -translate-x-1/2 -translate-y-1/2 rounded-md" />
        </div>

        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingSkeleton />;

  if (!isAuthenticated) {
    return fallback ?? <LoginPrompt />;
  }

  return <>{children}</>;
}
