import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Settings, LogOut, Crown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ to: "/settings" })}
      >
        {t("actions.login")}
      </Button>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-data text-[10px] font-bold text-primary transition-colors hover:bg-primary/30">
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          {/* User info */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{user?.email}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground outline-none hover:bg-accent"
            onSelect={() => navigate({ to: "/settings" })}
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            {t("nav.settings")}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground outline-none hover:bg-accent"
            onSelect={() => navigate({ to: "/pricing" })}
          >
            <Crown className="h-3.5 w-3.5 text-amber" />
            {t("actions.upgrade")}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-destructive outline-none hover:bg-destructive/10"
            onSelect={() => signOut()}
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("actions.logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
