import { RoleName } from "./role";

// Job validation types
export type JobCategory =
  | "Technology"
  | "Healthcare"
  | "Finance"
  | "Education"
  | "Marketing"
  | "Sales"
  | "Engineering"
  | "Design"
  | "CustomerService"
  | "HumanResources"
  | "Operations"
  | "Legal"
  | "Construction"
  | "Retail"
  | "Hospitality"
  | "Manufacturing"
  | "Transportation"
  | "RealEstate"
  | "Media"
  | "Other";

export type EmploymentType =
  | "FullTime"
  | "PartTime"
  | "Contract"
  | "Internship"
  | "Freelance";

export type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Lead" | "Executive";

export type WorkArrangement = "OnSite" | "Remote" | "Hybrid";

export type SalaryType = "Range" | "Fixed" | "Negotiable";

export type SalaryPeriod = "Hour" | "Day" | "Week" | "Month" | "Year";

export type JobStatus =
  | "Draft"
  | "Pending"
  | "Rejected"
  | "Active"
  | "Paused"
  | "Closed"
  | "Filled";

export interface JobData {
  title: string;
  description: string;
  location: string;
  category: JobCategory;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  workArrangement?: WorkArrangement;
  salaryType: SalaryType;
  salaryMin?: number;
  salaryMax?: number;
  salaryFixed?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  skills?: string;
  applicationDeadline: string | Date;
  positionsAvailable?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate job data for creation or update
 */
export function validateJobData(data: Partial<JobData>): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!data.title) {
    errors.push("Job title is required");
  } else if (data.title.trim().length < 5) {
    errors.push("Job title must be at least 5 characters");
  } else if (data.title.trim().length > 200) {
    errors.push("Job title must not exceed 200 characters");
  }

  // Description validation
  if (!data.description) {
    errors.push("Job description is required");
  } else if (data.description.trim().length < 50) {
    errors.push("Job description must be at least 50 characters");
  } else if (data.description.trim().length > 5000) {
    errors.push("Job description must not exceed 5000 characters");
  }

  // Location validation
  if (!data.location) {
    errors.push("Job location is required");
  } else if (data.location.trim().length < 3) {
    errors.push("Location must be at least 3 characters");
  }

  // Category validation
  if (!data.category) {
    errors.push("Job category is required");
  } else if (!isValidJobCategory(data.category)) {
    errors.push("Invalid job category");
  }

  // Employment type validation
  if (!data.employmentType) {
    errors.push("Employment type is required");
  } else if (!isValidEmploymentType(data.employmentType)) {
    errors.push("Invalid employment type");
  }

  // Experience level validation
  if (!data.experienceLevel) {
    errors.push("Experience level is required");
  } else if (!isValidExperienceLevel(data.experienceLevel)) {
    errors.push("Invalid experience level");
  }

  // Work arrangement validation (optional)
  if (data.workArrangement && !isValidWorkArrangement(data.workArrangement)) {
    errors.push("Invalid work arrangement");
  }

  // Salary validation
  if (!data.salaryType) {
    errors.push("Salary type is required");
  } else if (!isValidSalaryType(data.salaryType)) {
    errors.push("Invalid salary type");
  } else {
    if (data.salaryType === "Range") {
      if (data.salaryMin === undefined || data.salaryMin === null) {
        errors.push("Minimum salary is required for salary range");
      } else if (data.salaryMin < 0) {
        errors.push("Minimum salary must be non-negative");
      }

      if (data.salaryMax === undefined || data.salaryMax === null) {
        errors.push("Maximum salary is required for salary range");
      } else if (data.salaryMax < 0) {
        errors.push("Maximum salary must be non-negative");
      }

      if (
        data.salaryMin !== undefined &&
        data.salaryMax !== undefined &&
        data.salaryMin >= data.salaryMax
      ) {
        errors.push("Maximum salary must be greater than minimum salary");
      }
    } else if (data.salaryType === "Fixed") {
      if (data.salaryFixed === undefined || data.salaryFixed === null) {
        errors.push("Fixed salary amount is required");
      } else if (data.salaryFixed < 0) {
        errors.push("Fixed salary must be non-negative");
      }
    }
    // Negotiable requires no specific amount
  }

  // Requirements validation
  if (!data.requirements) {
    errors.push("Job requirements are required");
  } else if (data.requirements.trim().length < 10) {
    errors.push("Job requirements must be at least 10 characters");
  }

  // Responsibilities validation
  if (!data.responsibilities) {
    errors.push("Job responsibilities are required");
  } else if (data.responsibilities.trim().length < 10) {
    errors.push("Job responsibilities must be at least 10 characters");
  }

  // Application deadline validation
  if (!data.applicationDeadline) {
    errors.push("Application deadline is required");
  } else {
    const deadline = new Date(data.applicationDeadline);
    if (isNaN(deadline.getTime())) {
      errors.push("Invalid application deadline date");
    } else {
      const now = new Date();
      const minDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const maxDeadline = new Date(
        now.getTime() + 365 * 24 * 60 * 60 * 1000,
      ); // 1 year from now

      if (deadline < minDeadline) {
        errors.push("Application deadline must be at least 24 hours in the future");
      }
      if (deadline > maxDeadline) {
        errors.push("Application deadline must not exceed 1 year in the future");
      }
    }
  }

  // Positions available validation
  if (data.positionsAvailable !== undefined) {
    if (data.positionsAvailable < 1) {
      errors.push("At least 1 position must be available");
    }
    if (data.positionsAvailable > 100) {
      errors.push("Cannot exceed 100 positions");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a user with Recruiter role owns a specific job
 */
export function canRecruiterManageJob(
  roles: RoleName[],
  jobRecruiterId: string,
  userId: string,
): boolean {
  const isRecruiter = roles.includes("Recruiter");
  const isOwner = jobRecruiterId === userId;
  return isRecruiter && isOwner;
}

/**
 * Get valid status transitions for a job
 */
export function getValidStatusTransitions(
  currentStatus: JobStatus,
  role: "Recruiter" | "Admin",
): JobStatus[] {
  if (role === "Admin") {
    // Admin can approve or reject pending jobs
    if (currentStatus === "Pending") {
      return ["Active", "Draft", "Rejected"];
    }
    return [];
  }

  // Recruiter transitions
  if (currentStatus === "Draft" || currentStatus === "Rejected") {
    return ["Pending"]; // Submit for review
  }

  if (currentStatus === "Active") {
    return ["Paused", "Closed", "Filled"];
  }

  if (currentStatus === "Paused") {
    return ["Active", "Closed"];
  }

  return [];
}

/**
 * Check if a recruiter can edit a job based on its status
 */
export function canEditJob(status: JobStatus): boolean {
  return status === "Draft" || status === "Rejected";
}

/**
 * Check if a job can be deleted
 */
export function canDeleteJob(
  status: JobStatus,
  applicationCount: number,
): boolean {
  // Can only delete Draft or Rejected jobs with no applications
  return (
    (status === "Draft" || status === "Rejected") && applicationCount === 0
  );
}

/**
 * Format salary for display
 */
export function formatSalary(
  salaryType: SalaryType,
  salaryMin?: number | null,
  salaryMax?: number | null,
  salaryFixed?: number | null,
  currency: string = "USD",
  period: SalaryPeriod = "Year",
): string {
  if (salaryType === "Negotiable") {
    return "Negotiable";
  }

  const periodLabel = period === "Year" ? "/year" : `/${period.toLowerCase()}`;

  if (salaryType === "Range" && salaryMin && salaryMax) {
    return `${currency} ${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}${periodLabel}`;
  }

  if (salaryType === "Fixed" && salaryFixed) {
    return `${currency} ${salaryFixed.toLocaleString()}${periodLabel}`;
  }

  return "Not specified";
}

// Type guard functions
export function isValidJobCategory(value: unknown): value is JobCategory {
  const validCategories: JobCategory[] = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Marketing",
    "Sales",
    "Engineering",
    "Design",
    "CustomerService",
    "HumanResources",
    "Operations",
    "Legal",
    "Construction",
    "Retail",
    "Hospitality",
    "Manufacturing",
    "Transportation",
    "RealEstate",
    "Media",
    "Other",
  ];
  return typeof value === "string" && validCategories.includes(value as JobCategory);
}

export function isValidEmploymentType(
  value: unknown,
): value is EmploymentType {
  const validTypes: EmploymentType[] = [
    "FullTime",
    "PartTime",
    "Contract",
    "Internship",
    "Freelance",
  ];
  return typeof value === "string" && validTypes.includes(value as EmploymentType);
}

export function isValidExperienceLevel(
  value: unknown,
): value is ExperienceLevel {
  const validLevels: ExperienceLevel[] = [
    "Entry",
    "Mid",
    "Senior",
    "Lead",
    "Executive",
  ];
  return typeof value === "string" && validLevels.includes(value as ExperienceLevel);
}

export function isValidWorkArrangement(
  value: unknown,
): value is WorkArrangement {
  const validArrangements: WorkArrangement[] = ["OnSite", "Remote", "Hybrid"];
  return (
    typeof value === "string" && validArrangements.includes(value as WorkArrangement)
  );
}

export function isValidSalaryType(value: unknown): value is SalaryType {
  const validTypes: SalaryType[] = ["Range", "Fixed", "Negotiable"];
  return typeof value === "string" && validTypes.includes(value as SalaryType);
}

export function isValidSalaryPeriod(value: unknown): value is SalaryPeriod {
  const validPeriods: SalaryPeriod[] = ["Hour", "Day", "Week", "Month", "Year"];
  return typeof value === "string" && validPeriods.includes(value as SalaryPeriod);
}

export function isValidJobStatus(value: unknown): value is JobStatus {
  const validStatuses: JobStatus[] = [
    "Draft",
    "Pending",
    "Rejected",
    "Active",
    "Paused",
    "Closed",
    "Filled",
  ];
  return typeof value === "string" && validStatuses.includes(value as JobStatus);
}
