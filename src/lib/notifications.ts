import { messaging } from "./firebase-admin";
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
  userId?: string; // Recruiter or Seeker
  adminId?: string; // Admin User
  title: string;
  content: string;
  type: NotificationType;
  link?: string; // Deep link for Flutter or React URL
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
 * Sends push notifications to all registered device tokens for a user.
 * Automatically handles token cleanup for expired/invalid registrations.
 */
async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
) {
  try {
    // 1. Fetch all active device tokens for the user
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      console.log(
        `[PUSH] No device tokens found for user ${userId}. Skipping push.`,
      );
      return;
    }

    const fcmTokens = tokens.map(t => t.token);

    // 2. Prepare the mobile payload
    // Note: 'data' is where Flutter takes the link for navigation
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        link: link || "",
      },
      tokens: fcmTokens,
    };

    // 3. Send to all devices
    const response = await messaging.sendEachForMulticast(message);

    console.log(
      `[PUSH] Multicast results for user ${userId}: Successfully sent ${response.successCount}, Failed: ${response.failureCount}`,
    );

    // 4. Cleanup invalid or stale tokens
    if (response.failureCount > 0) {
      const tokensToDelete: string[] = [];

      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          // Tokens that are definitely invalid
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            tokensToDelete.push(fcmTokens[idx]);
          }
        }
      });

      if (tokensToDelete.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: tokensToDelete } },
        });
        console.log(
          `[PUSH] Cleaned up ${tokensToDelete.length} invalid device tokens.`,
        );
      }
    }
  } catch (error) {
    console.error("Critical error in sendPushNotification:", error);
  }
}
