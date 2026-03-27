import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "i18next";

const TEST_RESOURCES = {
  hr: {
    stocks: {
      table: {
        label: "Popis dionica ZSE",
        ticker: "Oznaka",
        name: "Naziv",
        price: "Cijena",
        change: "Promjena",
        volume: "Volumen",
        turnover: "Promet",
      },
    },
    common: {},
    portfolio: {},
    alerts: {},
    macro: {},
  },
  en: {
    stocks: {
      table: {
        label: "ZSE stock listing",
        ticker: "Ticker",
        name: "Name",
        price: "Price",
        change: "Change",
        volume: "Volume",
        turnover: "Turnover",
      },
    },
    common: {},
    portfolio: {},
    alerts: {},
    macro: {},
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: TEST_RESOURCES,
    lng: "hr",
    fallbackLng: "hr",
    interpolation: { escapeValue: false },
  });
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
