import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

// Helper to get current user
async function getCurrentUser(req: Request) {
  let userId: string | null = null;
  let type: "User" | "Admin" | null = null;

  // 1. Check Admin Session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    userId = session.user.id;
    type = "Admin";
  }

  // 2. Check Bearer Token
  if (!userId) {
    const token = getBearerToken(req);
    if (token) {
      try {
        const verified = await verifyAccessToken(token);
        userId = verified.userId;
        type = "User";
      } catch (e) {
        console.error("Token verification failed:", e);
      }
    }
  }

  return { userId, type };
}

export async function GET(req: Request) {
  const { userId, type } = await getCurrentUser(req);

  if (!userId || !type) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: type === "User" ? { userId } : { adminId: userId },
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            recruiterId: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobSeekerProfile: {
                  select: { avatarUrl: true, fullName: true },
                },
                companyProfile: { select: { logoUrl: true, name: true } },
              },
            },
            admin: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format for easier consumption by the frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p =>
        type === "User"
          ? p.userId !== userId || p.adminId !== null
          : p.adminId !== userId || p.userId !== null,
      );

      if (!otherParticipant) return { id: conv.id, otherParticipant: null };

      // SMART PROFILE LOGIC:
      // If there's a job, determine if the other person is the Recruiter or the Seeker
      const isOtherRecruiter =
        conv.jobId && otherParticipant.userId === conv.job?.recruiterId;

      let displayName = "Unknown";
      let displayAvatar = null;

      if (otherParticipant.admin) {
        displayName = otherParticipant.admin.name || "Admin";
        displayAvatar = otherParticipant.admin.avatarUrl;
      } else if (otherParticipant.user) {
        const { companyProfile, jobSeekerProfile, name } =
          otherParticipant.user;

        if (isOtherRecruiter) {
          // Context: They are the Recruiter
          displayName =
            companyProfile?.name ||
            jobSeekerProfile?.fullName ||
            name ||
            "Company";
          displayAvatar =
            companyProfile?.logoUrl || jobSeekerProfile?.avatarUrl;
        } else {
          // Context: They are the Seeker (or no job context)
          displayName =
            jobSeekerProfile?.fullName ||
            companyProfile?.name ||
            name ||
            "User";
          displayAvatar =
            jobSeekerProfile?.avatarUrl || companyProfile?.logoUrl;
        }
      }

      return {
        id: conv.id,
        updatedAt: conv.updatedAt,
        lastMessageContent: conv.lastMessageContent,
        lastMessageAt: conv.lastMessageAt,
        job: conv.job,
        otherParticipant: {
          id: otherParticipant.userId || otherParticipant.adminId,
          type: otherParticipant.adminId ? "Admin" : "User",
          name: displayName,
          avatarUrl: displayAvatar,
        },
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { userId, type } = await getCurrentUser(req);

  if (!userId || !type) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { receiverId, receiverType, jobId } = body;

    if (!receiverId || !receiverType) {
      return NextResponse.json(
        { error: "Missing receiverId or receiverType" },
        { status: 400 },
      );
    }

    // Check if conversation already exists (optionally filtered by jobId)
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: type === "User" ? { userId } : { adminId: userId },
            },
          },
          {
            participants: {
              some:
                receiverType === "User"
                  ? { userId: receiverId }
                  : { adminId: receiverId },
            },
          },
          jobId ? { jobId } : {},
        ],
      },
    });

    if (conversation) {
      return NextResponse.json({ conversation, isNew: false });
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        jobId: jobId || null,
        participants: {
          create: [
            {
              userId: type === "User" ? userId : undefined,
              adminId: type === "Admin" ? userId : undefined,
            },
            {
              userId: receiverType === "User" ? receiverId : undefined,
              adminId: receiverType === "Admin" ? receiverId : undefined,
            },
          ],
        },
      },
    });

    return NextResponse.json({ conversation: newConversation, isNew: true });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
