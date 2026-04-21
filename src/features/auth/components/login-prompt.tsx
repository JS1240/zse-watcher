import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, LogIn, UserPlus } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";

type AuthMode = "login" | "register";

export function LoginPrompt() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { t } = useTranslation("common");

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      {/* Branding header */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Activity className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="font-data text-xl font-bold tracking-tight">{t("app.name")}</h1>
          <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
        </div>
      </div>

      {/* Form container with visual polish */}
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full bg-muted px-1 py-0.5">
              <button
                onClick={() => setMode("login")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  mode === "login"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                {t("actions.login") || "Prijava"}
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  mode === "register"
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {t("actions.register") || "Registracija"}
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/40 p-2.5 ring-1 ring-border">
            <div className="text-lg">📈</div>
            <p className="text-[9px] text-muted-foreground">{t("features.stocks") || "Dionice"}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5 ring-1 ring-border">
            <div className="text-lg">💼</div>
            <p className="text-[9px] text-muted-foreground">{t("features.portfolio") || "Portfelj"}</p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5 ring-1 ring-border">
            <div className="text-lg">🔔</div>
            <p className="text-[9px] text-muted-foreground">{t("features.alerts") || "Alarmi"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
