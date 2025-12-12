import api from "./api";

export interface SystemNotification {
  id: string;
  type: "info" | "warning" | "critical";
  title: string;
  content: string;
  imageUrl?: string;
  actionUrl?: string;
  mandatory: boolean;
  active?: boolean;
  createdAt?: string;
  targetRoles?: string;
}

export const getPendingNotifications = async (): Promise<
  SystemNotification[]
> => {
  const response = await api.get("/notifications/pending");
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

export const getAllNotifications = async (): Promise<SystemNotification[]> => {
  const response = await api.get("/notifications");
  return response.data;
};
