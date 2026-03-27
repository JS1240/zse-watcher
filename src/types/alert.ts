export type AlertCondition = "above" | "below" | "percent_change_up" | "percent_change_down";
export type NotificationMethod = "in_app" | "email" | "push";

export interface PriceAlert {
  id: string;
  userId: string;
  ticker: string;
  condition: AlertCondition;
  targetValue: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt: string | null;
  notificationMethod: NotificationMethod;
  createdAt: string;
}
