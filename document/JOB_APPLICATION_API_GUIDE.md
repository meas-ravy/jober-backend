# Job Application API Documentation

Complete guide for the Job Application system API endpoints.

## Table of Contents

1. [Overview](#overview)
2. [Application Status Flow](#application-status-flow)
3. [Job Seeker Endpoints](#job-seeker-endpoints)
4. [Recruiter Endpoints](#recruiter-endpoints)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Testing Examples](#testing-examples)

---

## Overview

The Job Application system allows job seekers to apply to jobs with their resume and cover letter. Recruiters can view, filter, and manage applications with status tracking and bulk actions.

### Key Features

- Resume + Cover Letter submission
- Hard deadline enforcement
- Status flow: Submitted → Under Review → Shortlisted → Rejected/Hired
- Unlimited reapply allowed
- Recruiter application management with filtering
- Bulk actions for efficient processing
- Detailed application tracking

### Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

### Role Requirements

- **Job Seekers (Job_finder role)**: Can apply to jobs and view their applications
- **Recruiters (Recruiter role)**: Can view and manage applications for their jobs

---

## Application Status Flow

```
Submitted
    ↓
Under Review ----→ Rejected (Terminal)
    ↓
Shortlisted -----→ Rejected (Terminal)
    ↓
Hired (Terminal)

Withdrawn (Terminal) - Can be set from any non-terminal state
```

### Status Descriptions

| Status | Description | Accessible To |
|--------|-------------|---------------|
| `Submitted` | Initial state when application is created | Job Seeker, Recruiter |
| `UnderReview` | Recruiter is actively reviewing | Job Seeker, Recruiter |
| `Shortlisted` | Passed initial review, candidate of interest | Job Seeker, Recruiter |
| `Rejected` | Application not successful (Terminal) | Job Seeker, Recruiter |
| `Hired` | Candidate accepted for the position (Terminal) | Job Seeker, Recruiter |
| `Withdrawn` | Applicant withdrew application (Terminal) | Job Seeker |

### Valid Status Transitions

```javascript
Submitted → [UnderReview, Rejected, Withdrawn]
UnderReview → [Shortlisted, Rejected, Withdrawn]
Shortlisted → [Hired, Rejected, Withdrawn]
Rejected → [] // Terminal state
Hired → [] // Terminal state
Withdrawn → [] // Terminal state
```

---

## Job Seeker Endpoints

### 1. Apply to Job

Submit an application for a job posting.

**Endpoint:** `POST /api/jobs/{jobId}/apply`

**Authentication:** Required (Job_finder role)

**Request Body:**

```json
{
  "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
  "coverLetter": "Optional cover letter text (50-5000 characters)"
}
```

**Validation Rules:**

- `resumeUrl`: Required, must be valid Cloudinary URL
- `coverLetter`: Optional, 50-5000 characters if provided

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "application": {
    "id": "cm5xyz123",
    "jobId": "cm5abc456",
    "status": "Submitted",
    "submittedAt": "2026-01-23T10:30:00.000Z",
    "job": {
      "id": "cm5abc456",
      "title": "Senior Backend Developer",
      "category": "Technology",
      "employmentType": "FullTime",
      "location": "Phnom Penh, Cambodia",
      "applicationDeadline": "2026-02-15T23:59:59.000Z",
      "company": {
        "name": "Tech Solutions Ltd",
        "logoUrl": "https://res.cloudinary.com/.../logo.png"
      }
    }
  }
}
```

**Error Responses:**

```json
// 400 - Deadline passed
{
  "error": "Application deadline has passed"
}

// 400 - Job not accepting applications
{
  "error": "This job is not accepting applications"
}

// 400 - Invalid resume URL
{
  "error": "Invalid resume URL. Must be a valid Cloudinary URL"
}

// 400 - Cover letter too short
{
  "error": "Cover letter must be at least 50 characters"
}

// 403 - Applying to own job
{
  "error": "You cannot apply to your own job posting"
}

// 404 - Job not found
{
  "error": "Job not found"
}
```

---

### 2. View My Applications

Get a list of all applications submitted by the current user.

**Endpoint:** `GET /api/applications/my-applications`

**Authentication:** Required (Job_finder role)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (Submitted, UnderReview, etc.) |
| `sortBy` | string | `submittedAt` | Sort by field (submittedAt, updatedAt) |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "applications": [
    {
      "id": "cm5xyz123",
      "status": "UnderReview",
      "submittedAt": "2026-01-20T10:00:00.000Z",
      "updatedAt": "2026-01-22T14:30:00.000Z",
      "reviewedAt": "2026-01-21T09:15:00.000Z",
      "job": {
        "id": "cm5abc456",
        "title": "Senior Backend Developer",
        "category": "Technology",
        "employmentType": "FullTime",
        "location": "Phnom Penh",
        "applicationDeadline": "2026-02-15T23:59:59.000Z",
        "status": "Active",
        "company": {
          "name": "Tech Solutions Ltd",
          "logoUrl": "https://res.cloudinary.com/.../logo.png"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

---

### 3. View Application Details

Get detailed information about a specific application.

**Endpoint:** `GET /api/applications/{applicationId}`

**Authentication:** Required (Application owner OR Job recruiter)

**Success Response (200 OK) - Job Seeker View:**

```json
{
  "success": true,
  "application": {
    "id": "cm5xyz123",
    "jobId": "cm5abc456",
    "status": "Shortlisted",
    "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
    "coverLetter": "I am excited to apply...",
    "submittedAt": "2026-01-20T10:00:00.000Z",
    "reviewedAt": "2026-01-21T09:15:00.000Z",
    "updatedAt": "2026-01-22T14:30:00.000Z",
    "job": {
      "id": "cm5abc456",
      "title": "Senior Backend Developer",
      "description": "Full job description...",
      "category": "Technology",
      "employmentType": "FullTime",
      "experienceLevel": "Senior",
      "workArrangement": "Hybrid",
      "location": "Phnom Penh",
      "salaryType": "Range",
      "salaryMin": 2000,
      "salaryMax": 3500,
      "salaryCurrency": "USD",
      "salaryPeriod": "Month",
      "requirements": "Required qualifications...",
      "responsibilities": "Key responsibilities...",
      "benefits": "Benefits offered...",
      "skills": "Node.js, PostgreSQL, AWS",
      "applicationDeadline": "2026-02-15T23:59:59.000Z",
      "status": "Active",
      "company": {
        "name": "Tech Solutions Ltd",
        "logoUrl": "https://res.cloudinary.com/.../logo.png",
        "location": "Phnom Penh, Cambodia",
        "description": "Leading tech company..."
      }
    }
  }
}
```

**Note:** Job seekers cannot see `recruiterNotes` field.

---

## Recruiter Endpoints

### 4. View Job Applications

Get all applications for a specific job posting.

**Endpoint:** `GET /api/jobs/{jobId}/applications`

**Authentication:** Required (Recruiter role, must own the job)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status |
| `sortBy` | string | `submittedAt` | Sort by field |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "job": {
    "id": "cm5abc456",
    "title": "Senior Backend Developer"
  },
  "applications": [
    {
      "id": "cm5xyz123",
      "status": "Submitted",
      "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
      "coverLetter": "I am excited to apply...",
      "recruiterNotes": null,
      "submittedAt": "2026-01-20T10:00:00.000Z",
      "reviewedAt": null,
      "updatedAt": "2026-01-20T10:00:00.000Z",
      "jobSeeker": {
        "id": "cm5user789",
        "phone": "+855964519228",
        "profile": {
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
          "gender": "Male",
          "dateOfBirth": "1995-05-15T00:00:00.000Z"
        }
      }
    }
  ],
  "summary": {
    "Submitted": 10,
    "UnderReview": 5,
    "Shortlisted": 3,
    "Rejected": 15,
    "Hired": 1
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 34,
    "totalPages": 2,
    "hasMore": true
  }
}
```

**Error Responses:**

```json
// 403 - Not job owner
{
  "error": "You do not have permission to view applications for this job"
}

// 404 - Job not found
{
  "error": "Job not found"
}
```

---

### 5. Update Application Status

Change the status of an application and optionally add notes.

**Endpoint:** `PATCH /api/applications/{applicationId}/status`

**Authentication:** Required (Recruiter role, must own the job)

**Request Body:**

```json
{
  "status": "Shortlisted",
  "notes": "Strong technical background, invited for interview"
}
```

**Validation:**

- `status`: Required, must be valid ApplicationStatus
- `notes`: Optional string
- Status transition must be valid (see status flow)

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Application status updated successfully",
  "application": {
    "id": "cm5xyz123",
    "status": "Shortlisted",
    "recruiterNotes": "Strong technical background, invited for interview",
    "reviewedAt": "2026-01-21T09:15:00.000Z",
    "updatedAt": "2026-01-23T10:30:00.000Z",
    "jobSeeker": {
      "id": "cm5user789",
      "profile": {
        "fullName": "John Doe",
        "email": "john.doe@example.com"
      }
    },
    "job": {
      "id": "cm5abc456",
      "title": "Senior Backend Developer"
    }
  }
}
```

**Error Responses:**

```json
// 400 - Invalid status transition
{
  "error": "Invalid status transition",
  "details": "Cannot change status from Hired to Submitted"
}

// 400 - Invalid status
{
  "error": "Invalid status",
  "details": "Status must be one of: Submitted, UnderReview, Shortlisted, Rejected, Hired, Withdrawn"
}

// 403 - Not authorized
{
  "error": "You do not have permission to manage this application"
}
```

---

### 6. Bulk Actions

Update multiple applications at once.

**Endpoint:** `POST /api/applications/bulk-action`

**Authentication:** Required (Recruiter role, must own all jobs)

**Request Body:**

```json
{
  "applicationIds": ["cm5xyz123", "cm5abc456", "cm5def789"],
  "action": "shortlist"
}
```

**Valid Actions:**

- `reject`: Set status to Rejected
- `shortlist`: Set status to Shortlisted
- `mark_under_review`: Set status to UnderReview

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully updated 3 application(s)",
  "updated": 3,
  "action": "shortlist",
  "newStatus": "Shortlisted"
}
```

**Error Responses:**

```json
// 400 - Some invalid transitions
{
  "error": "Some status transitions are not allowed",
  "details": "2 application(s) cannot transition to Shortlisted",
  "invalidApplications": [
    {
      "id": "cm5xyz123",
      "currentStatus": "Hired"
    }
  ]
}

// 403 - Not authorized for some applications
{
  "error": "You do not have permission to manage some of these applications",
  "details": "2 application(s) belong to jobs you don't own"
}

// 404 - Some applications not found
{
  "error": "Some applications were not found",
  "details": "Found 2 out of 3 applications"
}
```

---

## Data Models

### JobApplication

```typescript
{
  id: string;
  jobId: string;
  jobSeekerId: string;
  resumeUrl: string;              // Cloudinary URL
  coverLetter?: string;           // 50-5000 characters
  status: ApplicationStatus;
  recruiterNotes?: string;        // Only visible to recruiter
  submittedAt: Date;
  reviewedAt?: Date;              // Set on first status change
  updatedAt: Date;
}
```

### ApplicationStatus Enum

```typescript
enum ApplicationStatus {
  Submitted = "Submitted",
  UnderReview = "UnderReview",
  Shortlisted = "Shortlisted",
  Rejected = "Rejected",
  Hired = "Hired",
  Withdrawn = "Withdrawn"
}
```

---

## Error Handling

### Common Error Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Invalid data, validation failed, deadline passed |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions, wrong role |
| 404 | Not Found | Job/Application doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "error": "Brief error message",
  "details": "More detailed explanation (dev mode only)"
}
```

---

## Testing Examples

### 1. Complete Job Seeker Flow

```bash
# Step 1: Apply to a job
curl -X POST http://localhost:3000/api/jobs/cm5abc456/apply \
  -H "Authorization: Bearer <job_seeker_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
    "coverLetter": "I am excited to apply for this position..."
  }'

# Step 2: View my applications
curl -X GET "http://localhost:3000/api/applications/my-applications?status=Submitted" \
  -H "Authorization: Bearer <job_seeker_token>"

# Step 3: View application details
curl -X GET http://localhost:3000/api/applications/cm5xyz123 \
  -H "Authorization: Bearer <job_seeker_token>"
```

### 2. Complete Recruiter Flow

```bash
# Step 1: View all applications for a job
curl -X GET "http://localhost:3000/api/jobs/cm5abc456/applications?sortBy=submittedAt&limit=50" \
  -H "Authorization: Bearer <recruiter_token>"

# Step 2: Review an application
curl -X GET http://localhost:3000/api/applications/cm5xyz123 \
  -H "Authorization: Bearer <recruiter_token>"

# Step 3: Update application status
curl -X PATCH http://localhost:3000/api/applications/cm5xyz123/status \
  -H "Authorization: Bearer <recruiter_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Shortlisted",
    "notes": "Strong candidate, schedule interview"
  }'

# Step 4: Bulk reject applications
curl -X POST http://localhost:3000/api/applications/bulk-action \
  -H "Authorization: Bearer <recruiter_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationIds": ["cm5app1", "cm5app2", "cm5app3"],
    "action": "reject"
  }'
```

### 3. Testing Invalid Scenarios

```bash
# Apply after deadline
curl -X POST http://localhost:3000/api/jobs/cm5expired/apply \
  -H "Authorization: Bearer <job_seeker_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeUrl": "https://res.cloudinary.com/.../resume.pdf"
  }'
# Expected: 400 "Application deadline has passed"

# Invalid status transition
curl -X PATCH http://localhost:3000/api/applications/cm5hired/status \
  -H "Authorization: Bearer <recruiter_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Submitted"
  }'
# Expected: 400 "Invalid status transition"
```

---

## Frontend Integration Examples

### React Hook for Applying to Job

```typescript
import { useState } from 'react';

interface ApplyToJobParams {
  jobId: string;
  resumeUrl: string;
  coverLetter?: string;
}

export function useApplyToJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async ({ jobId, resumeUrl, coverLetter }: ApplyToJobParams) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeUrl, coverLetter }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      return data.application;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apply, loading, error };
}
```

### React Component for Recruiter Application Management

```typescript
import { useState, useEffect } from 'react';

export function ApplicationManager({ jobId }: { jobId: string }) {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    fetchApplications();
  }, [jobId, filter]);

  const fetchApplications = async () => {
    const token = localStorage.getItem('accessToken');
    const url = filter === 'all' 
      ? `/api/jobs/${jobId}/applications`
      : `/api/jobs/${jobId}/applications?status=${filter}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await response.json();
    setApplications(data.applications);
  };

  const updateStatus = async (applicationId: string, status: string) => {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      fetchApplications(); // Refresh list
    }
  };

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Applications</option>
        <option value="Submitted">Submitted</option>
        <option value="UnderReview">Under Review</option>
        <option value="Shortlisted">Shortlisted</option>
      </select>

      {applications.map((app) => (
        <div key={app.id}>
          <h3>{app.jobSeeker.profile?.fullName}</h3>
          <p>Status: {app.status}</p>
          <button onClick={() => updateStatus(app.id, 'Shortlisted')}>
            Shortlist
          </button>
          <button onClick={() => updateStatus(app.id, 'Rejected')}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### For Job Seekers

1. **Upload Resume to Cloudinary First**: Use the `/api/upload/signature` endpoint to get signed upload parameters
2. **Write Meaningful Cover Letters**: Minimum 50 characters, make it count
3. **Check Deadlines**: Applications are hard-rejected after deadline
4. **Track Your Applications**: Use the my-applications endpoint regularly

### For Recruiters

1. **Add Notes**: Use the `recruiterNotes` field to track candidate details
2. **Use Bulk Actions**: Efficiently manage multiple applications at once
3. **Filter Strategically**: Use status filters to focus on actionable applications
4. **Review Timeline**: Check `submittedAt` and `reviewedAt` to track application age

### Security Considerations

1. **Validate Resume URLs**: All resume URLs must be from Cloudinary
2. **Deadline Enforcement**: Hard deadline prevents late submissions
3. **Ownership Verification**: Recruiters can only manage their own job applications
4. **Role-Based Access**: Strict role checking on all endpoints

---

## Troubleshooting

### Application Submission Fails

**Issue:** "Application deadline has passed"
- **Solution:** Check `job.applicationDeadline`. Deadline is enforced strictly.

**Issue:** "Invalid resume URL"
- **Solution:** Ensure resume is uploaded to Cloudinary first using `/api/upload/signature`

### Status Update Fails

**Issue:** "Invalid status transition"
- **Solution:** Check current status and valid transitions in status flow diagram

**Issue:** "You do not have permission"
- **Solution:** Verify you're the recruiter who posted the job

### Bulk Action Fails

**Issue:** "Some status transitions are not allowed"
- **Solution:** Review the `invalidApplications` array, those applications are in terminal states

---

## Summary

The Job Application API provides a complete workflow for job seekers to apply and track applications, while giving recruiters powerful tools to manage and process applications efficiently. With proper validation, status flow management, and bulk actions, the system supports high-volume application processing.

For additional help or feature requests, consult the development team.
