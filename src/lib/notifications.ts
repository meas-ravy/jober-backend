import prisma from "./prisma";

export type NotificationType =
  | "INFO"
  | "SYSTEM"
  | "NEW_APPLICATION"
  | "VERIFICATION_STATUS"
  | "JOB_STATUS_CHANGE"
  | "APPLICATION_UPDATE"
  | "NEW_JOB_FROM_FOLLOW"
  | "NEW_JOB_SUBMISSION"
  | "NEW_VERIFICATION_REQUEST";

interface CreateNotificationParams {
  userId?: string;     // Recruiter or Seeker
  adminId?: string;    // Admin User
  title: string;
  content: string;
  type: NotificationType;
  link?: string;       // Deep link for Flutter or React URL
}

/**
 * Creates a notification in the database and prepares for push delivery.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, adminId, title, content, type, link } = params;

  if (!userId && !adminId) {
    throw new Error("Must provide either userId or adminId for notification");
  }

  // 1. Save to Database (The In-App Inbox)
  const notification = await prisma.notification.create({
    data: {
      userId,
      adminId,
      title,
      content,
      type,
      link,
    },
  });

  // 2. Push Notification (FCM logic for Flutter)
  if (userId) {
    // We only send FCM to standard Users (Flutter app).
    // Admin notifications stay in the React dashboard for now.
    await sendPushNotification(userId, title, content, link);
  }

  return notification;
}

/**
 * Placeholder for Firebase Cloud Messaging logic.
 * This will fetch the user's device tokens and send a push to their phone.
 */
async function sendPushNotification(userId: string, title: string, body: string, link?: string) {
  try {
    // Fetch all active tokens for this user
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    // TODO: Implement Firebase Admin SDK call here
    // Example logic:
    // const fcmTokens = tokens.map(t => t.token);
    // await admin.messaging().sendMulticast({ tokens: fcmTokens, notification: { title, body }, data: { link } });
    
    console.log(`[PUSH] Sending to user ${userId} (${tokens.length} devices): ${title}`);
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}
