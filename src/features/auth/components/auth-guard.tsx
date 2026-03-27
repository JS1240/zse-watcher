import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginPrompt } from "@/features/auth/components/login-prompt";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ?? <LoginPrompt />;
  }

  return <>{children}</>;
}
