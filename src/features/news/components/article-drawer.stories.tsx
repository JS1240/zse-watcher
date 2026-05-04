import type { Meta, StoryObj } from "@storybook/react";
import { ArticleDrawer } from "./article-drawer";
import type { NewsArticle } from "@/types/news";

// Mock news articles for stories
const MOCK_ARTICLE_LONG: NewsArticle = {
  id: "1",
  title:
    "ZSE: CROBEX indeks porastao treći uzastopni dan uz podršku dionica Electrocompanijeta i HT-a",
  summary:
    "Zagrebačka burza je u srijedu zabilježila treći uzastopni dan rasta, pri čemu je CROBEX indeks ojačao za 0,8% na 2.184 boda. Najveći doprinos rastu dali su Electrocompaniet (+3,2%) i HT (+2,1%), dok je slabost pokazao sektor građevine. Promet je bio solidan, s oko 45 milijuna kuna transakcija na redovnom tržištu. Analitičari ističu da je pozitivno raspoloženje podržano boljim očekivanjima za turističku sezonu i oporavak potrošačke potražnje u drugom polugodištu.",
  url: "https://zse.hr/press/2026/05/04/crobex-rast",
  source: "ZSE.hr",
  publishedAt: new Date("2026-05-04T10:30:00").toISOString(),
  category: "trading",
  ticker: "R-A",
  readTimeMinutes: 4,
};

const MOCK_ARTICLE_SHORT: NewsArticle = {
  id: "2",
  title: "HT objavio kvartalne rezultate: prihodi stabilni, dividenda povoljna",
  summary:
    "Hrvatski telekom je u prvom tromjesečju ostvario prihode od 640 milijuna EUR, što je na razini prošlogodišnjeg razdoblja. Stopa dividendnog prinosa od 7,2% i dalje je među najatraktivnijima na ZSE-u.",
  url: "https://zse.hr/press/2026/05/03/ht-q1",
  source: "ZSE.hr",
  publishedAt: new Date("2026-05-03T14:15:00").toISOString(),
  category: "trading",
  ticker: "HT",
  readTimeMinutes: 2,
};

const MOCK_ARTICLE_NO_TICKER: NewsArticle = {
  id: "3",
  title: "ZSE uvodi novo pravilo za srednji tečaj — korisno za male ulagače",
  summary:
    "Zagrebačka burza najavila je promjene u metodologiji izračuna srednjeg tečaja dionica, s ciljem smanjenja volatilnosti i poboljšanja likvidnosti. Nova pravila stupaju na snagu 1. lipnja i očekuje se da će pridonijeti stabilnijem trgovanju.",
  url: "https://zse.hr/press/2026/05/02/zse-new-rule",
  source: "ZSE.hr",
  publishedAt: new Date("2026-05-02T09:00:00").toISOString(),
  category: "general",
  ticker: null,
  readTimeMinutes: 3,
};

const meta: Meta<typeof ArticleDrawer> = {
  title: "News/ArticleDrawer",
  component: ArticleDrawer,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Slide-in article drawer for reading news inline. Shows article header, lead paragraph, and external link. Includes scroll-to-top button and always-visible keyboard shortcuts. Croatian retail investors read news without leaving the app.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    article: { control: false },
    onClose: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="h-[500px] border border-border rounded-lg overflow-hidden relative">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArticleDrawer>;

// We need a wrapper since ArticleDrawer requires onClose
function ArticleDrawerWrapper({ article }: { article: NewsArticle }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  return (
    <ArticleDrawer
      article={article}
      onClose={() => {
        forceUpdate();
      }}
    />
  );
}

// Need this import for useReducer
import { useReducer } from "react";

export const Default: Story = {
  name: "Long Article",
  args: {
    article: MOCK_ARTICLE_LONG,
  },
  render: () => <ArticleDrawerWrapper article={MOCK_ARTICLE_LONG} />,
};

export const ShortArticle: Story = {
  name: "Short Article",
  args: {
    article: MOCK_ARTICLE_SHORT,
  },
  render: () => <ArticleDrawerWrapper article={MOCK_ARTICLE_SHORT} />,
};

export const NoTicker: Story = {
  name: "No Ticker (General News)",
  args: {
    article: MOCK_ARTICLE_NO_TICKER,
  },
  render: () => <ArticleDrawerWrapper article={MOCK_ARTICLE_NO_TICKER} />,
};

export const Hidden: Story = {
  name: "Hidden (No Article)",
  args: {},
  render: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
      Article drawer hidden — no article selected
    </div>
  ),
};