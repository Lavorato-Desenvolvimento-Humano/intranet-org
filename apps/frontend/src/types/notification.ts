export type NotificationType =
  | "NEWS"
  | "CHANGELOG"
  | "SYSTEM_ANNOUNCEMENT"
  | "FEATURE_TOUR";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  version?: string;
  content: string;
  imageUrl?: string;
  actionUrl?: string;
  mandatory: boolean;
  createdAt: string;
}
