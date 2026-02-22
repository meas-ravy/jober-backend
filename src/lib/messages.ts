import prisma from "./prisma";
import { db } from "./firebase-admin";

/**
 * Sends an automated message from a recruiter to a job seeker.
 * This function handles finding/creating the conversation in Postgres
 * and injecting the message into Firebase Realtime Database.
 */
export async function sendAutoMessage({
  recruiterId,
  seekerId,
  content,
  jobId,
}: {
  recruiterId: string;
  seekerId: string;
  content: string;
  jobId?: string;
}) {
  try {
    // 1. Find or create the conversation in Postgres
    // We look for a conversation between these two specific to this job if jobId is provided
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            OR: [{ userId: recruiterId }, { userId: seekerId }],
          },
        },
        jobId: jobId || null,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          jobId: jobId || null,
          participants: {
            create: [{ userId: recruiterId }, { userId: seekerId }],
          },
        },
      });
    }

    // 2. Send the message to Firebase Realtime Database
    const messageData = {
      content: content,
      senderId: recruiterId,
      senderType: "User",
      timestamp: Date.now(),
    };

    // Firebase Path: messages/{conversationId}/messages
    const messagesRef = db.ref(`messages/${conversation.id}/messages`);
    await messagesRef.push(messageData);

    // 3. Update the conversation metadata in Postgres
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageContent: content,
        lastMessageAt: new Date(),
      },
    });

    // 4. Send Push Notification to the recipient (seeker)
    try {
      const { createNotification } = await import("./notifications");
      await createNotification({
        userId: seekerId,
        title: "New Message",
        content:
          content.length > 50 ? content.substring(0, 47) + "..." : content,
        type: "NEW_MESSAGE",
        link: `/chat-detail/${conversation.id}`,
      });
    } catch (notifError) {
      console.error("Failed to send auto-message notification:", notifError);
    }

    return { success: true, conversationId: conversation.id };
  } catch (error) {
    console.error("Error sending auto-message:", error);
    return { success: false, error };
  }
}
