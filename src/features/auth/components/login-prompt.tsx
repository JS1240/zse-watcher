import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";

type AuthMode = "login" | "register";

export function LoginPrompt() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { t } = useTranslation("common");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-data text-xl font-bold">{t("app.name")}</span>
      </div>

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Sign in to access your watchlist, portfolio, and alerts.
      </p>

      <div className="w-full max-w-sm">
        {mode === "login" ? (
          <LoginForm onSwitchToRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
