import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  displayName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  termsAccepted: z.literal(true, "validation.termsRequired"),
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

      {/* GDPR consent checkbox - Croatian retail investors need explicit consent */}
      <div className="flex items-start gap-2">
        <label className="relative mt-0.5 flex cursor-pointer items-center">
          <input
            type="checkbox"
            {...register("termsAccepted")}
            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-background transition-all checked:border-primary checked:bg-primary hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-0 scale-0 text-primary-foreground transition-all peer-checked:rotate-0 peer-checked:scale-100" />
        </label>
        <label className="flex cursor-pointer flex-col text-[10px] leading-relaxed">
          <span className="text-foreground">
            {t("terms.label") || "Prihvaćam"}{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t("terms.link") || "Uvijete korištenja"}
            </a>
            {" "}{t("terms.and") || "i"}{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t("terms.privacy") || "Pravila o privatnosti"}
            </a>
          </span>
          {errors.termsAccepted && (
            <p className="mt-1 flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {t("validation.termsRequired") || "Morate prihvatiti uvjete"}
            </p>
          )}
        </label>
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