import { NotificationType } from "../app/generated/prisma/enums";
import { messaging } from "./firebase-admin";
import prisma from "./prisma";

interface CreateNotificationParams {
  userId?: string; // Recruiter or Seeker
  adminId?: string; // Admin User
  title: string;
  content: string;
  type: NotificationType;
  link?: string;
  imageUrl?: string;
}

/**
 * Creates a notification in the database and prepares for push delivery.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, adminId, title, content, type, link, imageUrl } = params;

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
      imageUrl,
    },
  });

  // 2. Push Notification (FCM logic for Flutter)
  if (userId) {
    await sendPushNotification(userId, title, content, link, type);
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
  type?: NotificationType, // Added type to handle specific FCM logic
) {
  try {
    // Determine target role based on notification type
    let targetRole: string = "Both";
    if (
      ["NEW_APPLICATION", "VERIFICATION_STATUS", "JOB_STATUS_CHANGE"].includes(
        type || "",
      )
    ) {
      targetRole = "Recruiter";
    } else if (
      ["APPLICATION_UPDATE", "NEW_JOB_FROM_FOLLOW"].includes(type || "")
    ) {
      targetRole = "Job_finder";
    }

    // If it's a role-specific notification, only send to tokens registered with that role
    // OR tokens that haven't specified a role yet (legacy)
    const tokens = await prisma.deviceToken.findMany({
      where: {
        userId,
        ...(targetRole !== "Both"
          ? {
              OR: [{ role: targetRole as any }, { role: null }],
            }
          : {}),
      },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const fcmTokens = tokens.map(t => t.token);

    // Special handling for INCOMING_CALL (High Priority)
    const isCall = type === "INCOMING_CALL";

    // 4. Fetch total unread count for this user specific to the role they are receiving a notification for
    // This ensures the badge matches what the user will see in their current app mode (Seeker/Recruiter)
    const recruiterTypes = [
      "INFO",
      "SYSTEM",
      "NEW_APPLICATION",
      "VERIFICATION_STATUS",
      "JOB_STATUS_CHANGE",
      "NEW_MESSAGE",
      "INCOMING_CALL",
      "CALL_MISSED",
    ];

    const seekerTypes = [
      "INFO",
      "SYSTEM",
      "APPLICATION_UPDATE",
      "NEW_JOB_FROM_FOLLOW",
      "NEW_MESSAGE",
      "INCOMING_CALL",
      "CALL_MISSED",
    ];

    let typeFilter: any = undefined;
    if (targetRole === "Recruiter") {
      typeFilter = { in: recruiterTypes };
    } else if (targetRole === "Job_finder") {
      typeFilter = { in: seekerTypes };
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        ...(typeFilter ? { type: typeFilter } : {}),
      },
    });

    const message: any = {
      tokens: fcmTokens,
      // For calls, we often want a "Data Message" to wake up the app
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        link: link || "",
        type: type || "INFO",
        title: title,
        body: body,
        targetRole,
        unreadCount: unreadCount.toString(),
      },
    };

    // If it's NOT a call, add the standard visual notification
    // If it IS a call, we let the Flutter app handle the UI (Data Message)
    if (!isCall) {
      message.notification = { title, body };
    }

    // Android/iOS High Priority Config
    message.android = {
      priority: "high",
      notification: !isCall
        ? {
            sound: "default",
            priority: "high",
            channelId: "high_importance_channel",
          }
        : undefined,
    };

    message.apns = {
      payload: {
        aps: {
          contentAvailable: true, // Wakes up the app in background
          badge: unreadCount, // Use the actual dynamic count
          sound: isCall ? "call_ringtone.mp3" : "default",
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Cleanup logic remains the same...
    if (response.failureCount > 0) {
      const tokensToDelete: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/invalid-registration-token" ||
            resp.error?.code === "messaging/registration-token-not-registered")
        ) {
          tokensToDelete.push(fcmTokens[idx]);
        }
      });
      if (tokensToDelete.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: tokensToDelete } },
        });
      }
    }
  } catch (error) {
    console.error("Critical error in sendPushNotification:", error);
  }
}
