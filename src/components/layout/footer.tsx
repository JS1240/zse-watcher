import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-data">{t("app.name")} v0.1.0</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">ZSE - Zagrebacka burza</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-data">
          {new Date().toLocaleTimeString("hr-HR")}
        </span>
      </div>
    </footer>
  );
}
