
import axiosInstance from "@/api/axiosInstance";

export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  expires_at: string | null;
}

interface UnreadCountResponse {
  count: number;
}

interface MarkAllReadResponse {
  success: boolean;
  updated: number;
}

export const notificationService = {
  async getMyNotifications(): Promise<AppNotification[]> {
    const response = await axiosInstance.get<AppNotification[]>(
      "notifications/my/"
    );
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<UnreadCountResponse>(
      "notifications/unread-count/"
    );
    return response.data.count;
  },

  async markAsRead(id: number): Promise<AppNotification> {
    const response = await axiosInstance.post<AppNotification>(
      `notifications/${id}/read/`
    );
    return response.data;
  },

  async markAllAsRead(): Promise<MarkAllReadResponse> {
    const response = await axiosInstance.post<MarkAllReadResponse>(
      "notifications/mark-all-read/"
    );
    return response.data;
  },

  async dismiss(id: number): Promise<void> {
    await axiosInstance.post(`notifications/${id}/dismiss/`);
  },
};
