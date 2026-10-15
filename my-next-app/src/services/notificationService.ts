export interface AppNotification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

class NotificationService {
  private notifications: AppNotification[] = [
    {
      id: "ntf-1",
      type: "success",
      title: "Visa Berhasil Terbit",
      message: "Visa umroh untuk jamaah Dr. H. Muhammad Ridwan telah disetujui Muassasah.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      id: "ntf-2",
      type: "info",
      title: "Pembayaran DP Diterima",
      message: "Pembayaran DP sebesar Rp 10.000.000 dari Siti Maryam Al-Banjari berhasil diverifikasi.",
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read: false,
    },
    {
      id: "ntf-3",
      type: "warning",
      title: "Tenggat Waktu Manasik",
      message: "Sesi Manasik Akbar Kloter Syawal dijadwalkan 5 hari lagi.",
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      read: true,
    },
  ];

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  sendNotification(title: string, message: string, type: AppNotification["type"] = "info"): AppNotification {
    const newNotice: AppNotification = {
      id: `ntf-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(newNotice);
    return newNotice;
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  async sendEmailSimulation(toEmail: string, subject: string, content: string): Promise<boolean> {
    // Simulated async email delivery
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log(`[NotificationService] Email simulated to: ${toEmail} | Subject: ${subject} | Content: ${content}`);
    return true;
  }
}

export const notificationService = new NotificationService();
