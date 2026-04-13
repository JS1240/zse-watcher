import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        />
        {errors.displayName && (
          <p className="mt-1 text-[10px] text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-[10px] text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Password (min 6 characters)"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-[10px] text-destructive">{errors.password.message}</p>
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
