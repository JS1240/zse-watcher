export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  ticker: string | null;
  category: "general" | "trading";
}
