import prisma from "./prisma";
import { validateCloudinaryUrl } from "./cloudinary";

// Application validation constants
export const MAX_COVER_LETTER_LENGTH = 5000;
export const MIN_COVER_LETTER_LENGTH = 50;

// Application status enum values
export const ApplicationStatus = {
  Submitted: "Submitted",
  UnderReview: "UnderReview",
  Shortlisted: "Shortlisted",
  Rejected: "Rejected",
  Hired: "Hired",
  Withdrawn: "Withdrawn",
} as const;

export type ApplicationStatusType =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/**
 * Validates application data before submission
 */
export function validateApplicationData(data: {
  fullName: string;
  email: string;
  resumeUrl: string;
  coverLetter?: string;
}): { valid: boolean; error?: string } {
  // Validate name and email
  if (!data.fullName || typeof data.fullName !== "string") {
    return { valid: false, error: "Full name is required" };
  }

  if (!data.email || typeof data.email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  // Validate resume URL
  if (!data.resumeUrl || typeof data.resumeUrl !== "string") {
    return { valid: false, error: "Resume URL is required" };
  }

  if (!validateCloudinaryUrl(data.resumeUrl, "resume")) {
    return {
      valid: false,
      error: "Invalid resume URL. Must be a valid Cloudinary URL",
    };
  }

  // Validate cover letter if provided
  if (data.coverLetter !== undefined && data.coverLetter !== null) {
    if (typeof data.coverLetter !== "string") {
      return { valid: false, error: "Cover letter must be a string" };
    }

    const length = data.coverLetter.trim().length;

    if (length > 0 && length < MIN_COVER_LETTER_LENGTH) {
      return {
        valid: false,
        error: `Cover letter must be at least ${MIN_COVER_LETTER_LENGTH} characters`,
      };
    }

    if (length > MAX_COVER_LETTER_LENGTH) {
      return {
        valid: false,
        error: `Cover letter must not exceed ${MAX_COVER_LETTER_LENGTH} characters`,
      };
    }
  }

  return { valid: true };
}

/**
 * Checks if a user can apply to a specific job
 */
export async function canUserApplyToJob(
  jobId: string,
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // Fetch job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      applicationDeadline: true,
      recruiterId: true,
    },
  });

  if (!job) {
    return { allowed: false, reason: "Job not found" };
  }

  // Check if user is the recruiter (can't apply to own job)
  if (job.recruiterId === userId) {
    return {
      allowed: false,
      reason: "You cannot apply to your own job posting",
    };
  }

  // Check if job is active
  if (job.status !== "Active") {
    return {
      allowed: false,
      reason: "This job is not accepting applications",
    };
  }

  // Check if user has already applied for this job
  const existingApplication = await prisma.jobApplication.findFirst({
    where: {
      jobId,
      jobSeekerId: userId,
    },
    select: { id: true },
  });

  if (existingApplication) {
    return {
      allowed: false,
      reason: "You have already applied for this job",
    };
  }

  // Check if deadline has passed (hard deadline)
  if (new Date() > job.applicationDeadline) {
    return {
      allowed: false,
      reason: "Application deadline has passed",
    };
  }

  return { allowed: true };
}

/**
 * Checks if a recruiter can manage a specific application
 */
export async function canRecruiterManageApplication(
  applicationId: string,
  recruiterId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          recruiterId: true,
        },
      },
    },
  });

  if (!application) {
    return { allowed: false, reason: "Application not found" };
  }

  if (application.job.recruiterId !== recruiterId) {
    return {
      allowed: false,
      reason: "You do not have permission to manage this application",
    };
  }

  return { allowed: true };
}

/**
 * Defines valid status transitions for applications
 */
export function getValidStatusTransitions(
  currentStatus: ApplicationStatusType,
): ApplicationStatusType[] {
  const transitions: Record<ApplicationStatusType, ApplicationStatusType[]> = {
    [ApplicationStatus.Submitted]: [
      ApplicationStatus.UnderReview,
      ApplicationStatus.Rejected,
      ApplicationStatus.Withdrawn,
    ],
    [ApplicationStatus.UnderReview]: [
      ApplicationStatus.Shortlisted,
      ApplicationStatus.Rejected,
      ApplicationStatus.Withdrawn,
    ],
    [ApplicationStatus.Shortlisted]: [
      ApplicationStatus.Hired,
      ApplicationStatus.Rejected,
      ApplicationStatus.Withdrawn,
    ],
    [ApplicationStatus.Rejected]: [], // Terminal state
    [ApplicationStatus.Hired]: [], // Terminal state
    [ApplicationStatus.Withdrawn]: [], // Terminal state
  };

  return transitions[currentStatus] || [];
}

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: ApplicationStatusType,
  newStatus: ApplicationStatusType,
): boolean {
  const validTransitions = getValidStatusTransitions(currentStatus);
  return validTransitions.includes(newStatus);
}

/**
 * Checks if a status is a terminal state (no further transitions allowed)
 */
export function isTerminalStatus(status: ApplicationStatusType): boolean {
  return (
    status === ApplicationStatus.Rejected ||
    status === ApplicationStatus.Hired ||
    status === ApplicationStatus.Withdrawn
  );
}

/**
 * Formats application status for display
 */
export function formatApplicationStatus(status: ApplicationStatusType): string {
  const statusLabels: Record<ApplicationStatusType, string> = {
    [ApplicationStatus.Submitted]: "application sent",
    [ApplicationStatus.UnderReview]: "application pending",
    [ApplicationStatus.Shortlisted]: "shortlisted",
    [ApplicationStatus.Rejected]: "application rejected",
    [ApplicationStatus.Hired]: "application accepted",
    [ApplicationStatus.Withdrawn]: "withdrawn",
  };

  return statusLabels[status] || status.toLowerCase();
}

/**
 * Validates bulk action parameters
 */
export function validateBulkAction(action: string): {
  valid: boolean;
  error?: string;
} {
  const validActions = ["reject", "shortlist", "mark_under_review"];

  if (!validActions.includes(action)) {
    return {
      valid: false,
      error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Maps bulk action to application status
 */
export function getBulkActionStatus(
  action: string,
): ApplicationStatusType | null {
  const actionStatusMap: Record<string, ApplicationStatusType> = {
    reject: ApplicationStatus.Rejected,
    shortlist: ApplicationStatus.Shortlisted,
    mark_under_review: ApplicationStatus.UnderReview,
  };

  return actionStatusMap[action] || null;
}
