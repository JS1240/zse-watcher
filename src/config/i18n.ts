import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

const NAMESPACES = ["common", "stocks", "portfolio", "alerts", "macro"] as const;

await i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "hr",
    supportedLngs: ["hr", "en"],
    defaultNS: "common",
    ns: [...NAMESPACES],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "zse-watcher-lang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
