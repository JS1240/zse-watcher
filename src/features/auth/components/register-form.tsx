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

const registerSchema = z.object({
  displayName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
});

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation("common");
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time validation state
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [focused, setFocused] = useState({ displayName: false, email: false, password: false });

  const debouncedName = useDebounce(nameInput, 300);
  const debouncedEmail = useDebounce(emailInput, 300);
  const debouncedPassword = useDebounce(passwordInput, 300);

  // Real-time validation checks
  const isNameValid = useMemo(() => {
    if (!debouncedName) return false;
    return debouncedName.trim().length >= 2;
  }, [debouncedName]);

  const isEmailValid = useMemo(() => {
    if (!debouncedEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
  }, [debouncedEmail]);

  const isPasswordValid = useMemo(() => {
    if (!debouncedPassword) return false;
    return debouncedPassword.length >= 6;
  }, [debouncedPassword]);

  // Show validation: field has been focused AND has content
  const showNameValidation = focused.displayName && nameInput;
  const showEmailValidation = focused.email && emailInput;
  const showPasswordValidation = focused.password && passwordInput;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterValues) => {
    setError(null);
    try {
      await signUp(data.email, data.password, data.displayName);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNameInput(e.target.value);
      register("displayName").onChange(e);
    },
    [register]
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmailInput(e.target.value);
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

  const handleNameFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, displayName: true }));
  }, []);

  const handleEmailFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, email: true }));
  }, []);

  const handlePasswordFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, password: true }));
  }, []);

  if (success) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-xs text-foreground">
          Check your email for a confirmation link.
        </p>
        <Button variant="outline" className="w-full" onClick={onSwitchToLogin}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <Input
          placeholder="Display name"
          autoComplete="name"
          {...register("displayName")}
          onChange={handleNameChange}
          onFocus={handleNameFocus}
          className={cn(
            showNameValidation &&
              (isNameValid
                ? "ring-1 ring-emerald-500 border-emerald-500"
                : "ring-1 ring-destructive border-destructive")
          )}
        />
        {showNameValidation ? (
          isNameValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              OK
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {t("validation.nameMin") || "At least 2 characters"}
            </p>
          )
        ) : errors.displayName ? (
          <p className="mt-1 text-[10px] text-destructive">
            {errors.displayName.message}
          </p>
        ) : null}
      </div>

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
              {t("validation.invalidEmail") || "Enter a valid email"}
            </p>
          )
        ) : errors.email ? (
          <p className="mt-1 text-[10px] text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Password (min 6 characters)"
          autoComplete="new-password"
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
              {t("validation.passwordMin") || "At least 6 characters"}
            </p>
          )
        ) : errors.password ? (
          <p className="mt-1 text-[10px] text-destructive">
            {errors.password.message}
          </p>
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
        {t("actions.register")}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:underline"
        >
          {t("actions.login")}
        </button>
      </p>
    </form>
  );
}