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
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: recruiterId } } },
          { participants: { some: { userId: seekerId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: recruiterId }, { userId: seekerId }],
          },
        },
      });
    }

    // 2. Send the message to Firebase Realtime Database
    const messageData: any = {
      content,
      senderId: recruiterId,
      senderType: "User", // Both Recruiter and Seeker are "User" in our system roles
      timestamp: Date.now(),
      status: "sent",
    };

    if (jobId) {
      messageData.jobId = jobId;
    }

    const messagesRef = db.ref(`conversations/${conversation.id}/messages`);
    await messagesRef.push(messageData);

    // 3. Update the conversation metadata in Postgres
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageContent: content,
        lastMessageAt: new Date(),
      },
    });

    return { success: true, conversationId: conversation.id };
  } catch (error) {
    console.error("Error sending auto-message:", error);
    return { success: false, error };
  }
}
