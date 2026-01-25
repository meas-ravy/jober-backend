import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get application ID from params
    const { id: applicationId } = await context.params;

    // Authenticate user
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // Fetch application with full details
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            recruiterId: true,
            title: true,
            description: true,
            category: true,
            employmentType: true,
            experienceLevel: true,
            workArrangement: true,
            location: true,
            salaryType: true,
            salaryMin: true,
            salaryMax: true,
            salaryFixed: true,
            salaryCurrency: true,
            salaryPeriod: true,
            requirements: true,
            responsibilities: true,
            benefits: true,
            skills: true,
            applicationDeadline: true,
            status: true,
            companyProfile: {
              select: {
                name: true,
                logoUrl: true,
                location: true,
                description: true,
              },
            },
          },
        },
        jobSeeker: {
          select: {
            id: true,
            phone: true,
            jobSeekerProfile: {
              select: {
                fullName: true,
                email: true,
                avatarUrl: true,
                dateOfBirth: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Check authorization: must be application owner OR job recruiter
    const isApplicationOwner = application.jobSeekerId === userId;
    const isJobRecruiter = application.job.recruiterId === userId;

    if (!isApplicationOwner && !isJobRecruiter) {
      return NextResponse.json(
        { error: "You do not have permission to view this application" },
        { status: 403 },
      );
    }

    // Format response based on who's viewing
    if (isApplicationOwner) {
      // Job seeker view: hide recruiter notes
      return NextResponse.json({
        success: true,
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          resumeUrl: application.resumeUrl,
          coverLetter: application.coverLetter,
          submittedAt: application.submittedAt,
          reviewedAt: application.reviewedAt,
          updatedAt: application.updatedAt,
          job: {
            id: application.job.id,
            title: application.job.title,
            description: application.job.description,
            category: application.job.category,
            employmentType: application.job.employmentType,
            experienceLevel: application.job.experienceLevel,
            workArrangement: application.job.workArrangement,
            location: application.job.location,
            salaryType: application.job.salaryType,
            salaryMin: application.job.salaryMin,
            salaryMax: application.job.salaryMax,
            salaryFixed: application.job.salaryFixed,
            salaryCurrency: application.job.salaryCurrency,
            salaryPeriod: application.job.salaryPeriod,
            requirements: application.job.requirements,
            responsibilities: application.job.responsibilities,
            benefits: application.job.benefits,
            skills: application.job.skills,
            applicationDeadline: application.job.applicationDeadline,
            status: application.job.status,
            company: {
              name: application.job.companyProfile.name,
              logoUrl: application.job.companyProfile.logoUrl,
              location: application.job.companyProfile.location,
              description: application.job.companyProfile.description,
            },
          },
        },
      });
    } else {
      // Recruiter view: include recruiter notes and job seeker profile
      return NextResponse.json({
        success: true,
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          resumeUrl: application.resumeUrl,
          coverLetter: application.coverLetter,
          recruiterNotes: application.recruiterNotes,
          submittedAt: application.submittedAt,
          reviewedAt: application.reviewedAt,
          updatedAt: application.updatedAt,
          jobSeeker: {
            id: application.jobSeeker.id,
            phone: application.jobSeeker.phone,
            profile: application.jobSeeker.jobSeekerProfile
              ? {
                  fullName: application.jobSeeker.jobSeekerProfile.fullName,
                  email: application.jobSeeker.jobSeekerProfile.email,
                  avatarUrl: application.jobSeeker.jobSeekerProfile.avatarUrl,
                  dateOfBirth:
                    application.jobSeeker.jobSeekerProfile.dateOfBirth,
                  gender: application.jobSeeker.jobSeekerProfile.gender,
                }
              : null,
          },
          job: {
            id: application.job.id,
            title: application.job.title,
            category: application.job.category,
            employmentType: application.job.employmentType,
            location: application.job.location,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error fetching application details:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to fetch application details",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while fetching application details",
      },
      { status: 500 },
    );
  }
}
