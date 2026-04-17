import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation("common");
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Real-time validation state
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [focused, setFocused] = useState({ email: false, password: false });

  const debouncedEmail = useDebounce(emailInput, 300);
  const debouncedPassword = useDebounce(passwordInput, 300);

  // Real-time validation checks
  const isEmailValid = useMemo(() => {
    if (!debouncedEmail) return false;
    // Basic email regex for real-time feedback
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
  }, [debouncedEmail]);

  const isPasswordValid = useMemo(() => {
    if (!debouncedPassword) return false;
    return debouncedPassword.length >= 6;
  }, [debouncedPassword]);

  // Show validation: field has been focused AND has content
  const showEmailValidation = focused.email && emailInput;
  const showPasswordValidation = focused.password && passwordInput;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmailInput(e.target.value);
      // Also trigger react-hook-form (for final validation on submit)
      register("email").onChange(e);
    },
    [register]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordInput(e.target.value);
      register("password").onChange(e);
    },
    [register]
  );

  const handleEmailFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, email: true }));
  }, []);

  const handlePasswordFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, password: true }));
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          {...register("email")}
          onChange={handleEmailChange}
          onFocus={handleEmailFocus}
          className={cn(
            showEmailValidation &&
              (isEmailValid
                ? "ring-1 ring-emerald-500 border-emerald-500"
                : "ring-1 ring-destructive border-destructive")
          )}
        />
        {showEmailValidation ? (
          isEmailValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("validation.validEmail") || "Valid email"}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {errors.email?.message || t("validation.invalidEmail") || "Enter a valid email"}
            </p>
          )
        ) : errors.email ? (
          <p className="mt-1 text-[10px] text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          {...register("password")}
          onChange={handlePasswordChange}
          onFocus={handlePasswordFocus}
          className={cn(
            showPasswordValidation &&
              (isPasswordValid
                ? "ring-1 ring-emerald-500 border-emerald-500"
                : "ring-1 ring-destructive border-destructive")
          )}
        />
        {showPasswordValidation ? (
          isPasswordValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("validation.validPassword") || "Password OK"}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {errors.password?.message || t("validation.passwordMin") || "At least 6 characters"}
            </p>
          )
        ) : errors.password ? (
          <p className="mt-1 text-[10px] text-destructive">{errors.password.message}</p>
        ) : (
          <p className="mt-1.5 text-[9px] text-muted-foreground">
            {passwordInput.length > 0 && `${passwordInput.length}/6`}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {t("actions.login")}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => signInWithGoogle()}
      >
        Continue with Google
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary hover:underline"
        >
          {t("actions.register")}
        </button>
      </p>
    </form>
  );
}