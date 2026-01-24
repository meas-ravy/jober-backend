# API Testing Guide

Complete guide for testing all Jober Backend APIs in Postman.

---

## Setup

### Base URL
```
http://localhost:3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `baseUrl` | `http://localhost:3000` |
| `phone` | `+855964519228` |
| `accessToken` | JWT access token (auto-set after verify-otp) |
| `refreshToken` | Refresh token (auto-set after verify-otp) |
| `jobId` | Job ID (auto-set after creating job) |
| `applicationId` | Application ID (auto-set after applying) |

---

## 1. Authentication APIs

### 1.1 OAuth Login (Google)
```
POST /api/auth/oauth
```
**Body:**
```json
{
  "provider": "Google",
  "idToken": "eyJhbGc...",
  "accessToken": "ya29...",
  "refreshToken": "1//0g..."
}
```
**Response:** `200 OK` or `201 Created`
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cm5xxx",
    "email": "user@gmail.com",
    "name": "John Doe",
    "phone": null,
    "roles": []
  },
  "accessToken": "eyJ...",
  "refreshToken": "abc123..."
}
```

---

### 1.2 OAuth Login (LinkedIn)
```
POST /api/auth/oauth
```
**Body:**
```json
{
  "provider": "LinkedIn",
  "accessToken": "AQV...",
  "refreshToken": "AQW..."
}
```
**Response:** `200 OK` or `201 Created`
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cm5xxx",
    "email": "user@linkedin.com",
    "name": "John Doe",
    "phone": null,
    "roles": []
  },
  "accessToken": "eyJ...",
  "refreshToken": "abc123..."
}
```

---

### 1.3 Send OTP
```
POST /api/sent-otp
```
**Body:**
```json
{
  "phone": "+855964519228"
}
```
**Response:** `200 OK`
```json
{
  "success": true,
  "message": "OTP has been sent successfully to your phone"
}
```

---

### 1.4 Verify OTP
```
POST /api/verify-otp
```
**Body:**
```json
{
  "phone": "+855964519228",
  "otp": "1234"
}
```
**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cm5xxx",
    "phone": "+855964519228",
    "roles": []
  },
  "accessToken": "eyJ...",
  "refreshToken": "abc123..."
}
```

---

### 1.5 Resend OTP
```
POST /api/resend-otp
```
**Body:**
```json
{
  "phone": "+855964519228"
}
```

---

### 1.6 Refresh Token
```
POST /api/refresh-token
```
**Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

---

### 1.7 Logout (with OAuth Token Revocation)
```
POST /api/logout
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

---

## 2. Role Selection

### 2.1 Select Role (Job Seeker)
```
POST /api/select-role
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "role": "Job_finder"
}
```

### 2.2 Select Role (Recruiter)
```
POST /api/select-role
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "role": "Recruiter"
}
```

---

## 3. Upload Signature (Cloudinary)

### 3.1 Get Signature for Resume
```
POST /api/upload/signature
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "imageType": "resume"
}
```

### 3.2 Get Signature for Avatar
```
POST /api/upload/signature
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "imageType": "job-seeker-avatar"
}
```

### 3.3 Get Signature for Company Logo
```
POST /api/upload/signature
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "imageType": "company-logo"
}
```

---

## 4. Job Seeker Profile

### 4.1 Create Profile
```
POST /api/profile
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "dateOfBirth": "1995-05-15",
  "gender": "Male",
  "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
}
```

### 4.2 Get Profile
```
GET /api/profile
Authorization: Bearer {{accessToken}}
```

### 4.3 Update Profile
```
PUT /api/profile
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "fullName": "John Smith"
}
```

---

## 5. Company Profile (Recruiter)

### 5.1 Create Company
```
POST /api/company
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "name": "Tech Solutions Ltd",
  "contactEmail": "hr@techsolutions.com",
  "contactPhone": "+855123456789",
  "location": "Phnom Penh, Cambodia",
  "description": "Leading technology company",
  "logoUrl": "https://res.cloudinary.com/.../logo.jpg"
}
```

### 5.2 Get Company
```
GET /api/company
Authorization: Bearer {{accessToken}}
```

### 5.3 Update Company
```
PUT /api/company
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "name": "Tech Solutions Cambodia"
}
```

---

## 6. Job Posting (Recruiter)

### 6.1 Create Job (Draft)
```
POST /api/jobs
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "title": "Senior Backend Developer",
  "description": "We are looking for an experienced backend developer...",
  "location": "Phnom Penh, Cambodia",
  "category": "Technology",
  "employmentType": "FullTime",
  "experienceLevel": "Senior",
  "workArrangement": "Hybrid",
  "salaryType": "Range",
  "salaryMin": 2000,
  "salaryMax": 3500,
  "salaryCurrency": "USD",
  "salaryPeriod": "Month",
  "requirements": "5+ years Node.js, PostgreSQL, AWS",
  "responsibilities": "Design and implement backend systems",
  "benefits": "Health insurance, Remote work",
  "skills": "Node.js, PostgreSQL, AWS, Docker",
  "applicationDeadline": "2026-03-15T23:59:59.000Z",
  "positionsAvailable": 2
}
```

### 6.2 Get My Jobs
```
GET /api/jobs
Authorization: Bearer {{accessToken}}
```
**Query Params:**
- `status` - Draft, Pending, Active, etc.
- `page` - Page number
- `limit` - Items per page

### 6.3 Get Single Job
```
GET /api/jobs/{{jobId}}
Authorization: Bearer {{accessToken}}
```

### 6.4 Update Job
```
PUT /api/jobs/{{jobId}}
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "title": "Senior Backend Developer (Updated)"
}
```

### 6.5 Submit Job for Review
```
PATCH /api/jobs/{{jobId}}/submit
Authorization: Bearer {{accessToken}}
```

### 6.6 Change Job Status
```
PATCH /api/jobs/{{jobId}}/status
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "status": "Paused"
}
```
**Valid statuses:** Active, Paused, Closed, Filled

### 6.7 Delete Job
```
DELETE /api/jobs/{{jobId}}
Authorization: Bearer {{accessToken}}
```

---

## 7. Job Applications (Job Seeker)

### 7.1 Apply to Job
```
POST /api/jobs/{{jobId}}/apply
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "resumeUrl": "https://res.cloudinary.com/.../resume.pdf",
  "coverLetter": "I am excited to apply for this position..."
}
```

### 7.2 Get My Applications
```
GET /api/applications/my-applications
Authorization: Bearer {{accessToken}}
```
**Query Params:**
- `status` - Submitted, UnderReview, Shortlisted, etc.
- `sortBy` - submittedAt, updatedAt
- `page` - Page number
- `limit` - Items per page

### 7.3 Get Application Details
```
GET /api/applications/{{applicationId}}
Authorization: Bearer {{accessToken}}
```

---

## 8. Application Management (Recruiter)

### 8.1 Get Job Applications
```
GET /api/jobs/{{jobId}}/applications
Authorization: Bearer {{accessToken}}
```
**Query Params:**
- `status` - Filter by status
- `sortBy` - submittedAt, updatedAt
- `page` - Page number
- `limit` - Items per page

### 8.2 Update Application Status
```
PATCH /api/applications/{{applicationId}}/status
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "status": "UnderReview",
  "notes": "Good candidate"
}
```
**Valid statuses:** Submitted, UnderReview, Shortlisted, Rejected, Hired

### 8.3 Bulk Action
```
POST /api/applications/bulk-action
Authorization: Bearer {{accessToken}}
```
**Body:**
```json
{
  "applicationIds": ["id1", "id2", "id3"],
  "action": "reject"
}
```
**Valid actions:** reject, shortlist, mark_under_review

---

## 9. Admin APIs

### 9.1 Get Pending Jobs
```
GET /api/admin/jobs/pending
```
*(Uses NextAuth session)*

### 9.2 Get All Jobs
```
GET /api/admin/jobs
```
**Query Params:**
- `status` - Filter by status
- `recruiterId` - Filter by recruiter

### 9.3 Approve Job
```
POST /api/admin/jobs/{{jobId}}/approve
```

### 9.4 Reject Job
```
POST /api/admin/jobs/{{jobId}}/reject
```
**Body:**
```json
{
  "reason": "Job description needs more details",
  "rejectToStatus": "Draft"
}
```

---

## Enums Reference

### JobCategory
```
Technology, Healthcare, Finance, Education, Marketing, Sales, 
Engineering, Design, CustomerService, HumanResources, Operations, 
Legal, Construction, Retail, Hospitality, Manufacturing, 
Transportation, RealEstate, Media, Other
```

### EmploymentType
```
FullTime, PartTime, Contract, Internship, Freelance
```

### ExperienceLevel
```
Entry, Mid, Senior, Lead, Executive
```

### WorkArrangement
```
OnSite, Remote, Hybrid
```

### SalaryType
```
Range, Fixed, Negotiable
```

### SalaryPeriod
```
Hour, Day, Week, Month, Year
```

### JobStatus
```
Draft, Pending, Rejected, Active, Paused, Closed, Filled
```

### ApplicationStatus
```
Submitted, UnderReview, Shortlisted, Rejected, Hired, Withdrawn
```

### Gender
```
Male, Female, Other
```

### RoleName
```
Job_finder, Recruiter, Admin
```

### OAuthProvider
```
Google, LinkedIn
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong role/permission) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Testing Checklist

### Authentication
- [ ] OAuth login with Google
- [ ] OAuth login with LinkedIn
- [ ] Send OTP
- [ ] Verify OTP
- [ ] Resend OTP
- [ ] Refresh token
- [ ] Logout (with OAuth token revocation)

### Job Seeker Flow
- [ ] Select Job_finder role
- [ ] Create profile
- [ ] Get upload signature for resume
- [ ] Apply to job
- [ ] View my applications

### Recruiter Flow
- [ ] Select Recruiter role
- [ ] Create company profile
- [ ] Create job (Draft)
- [ ] Submit job for review
- [ ] View applications
- [ ] Update application status
- [ ] Bulk actions

### OAuth Testing
- [ ] Google login with valid token
- [ ] Google login with invalid token → 401
- [ ] LinkedIn login with valid token
- [ ] LinkedIn login with invalid token → 401
- [ ] OAuth user logout with token revocation

### Error Testing
- [ ] Missing token → 401
- [ ] Wrong role → 403
- [ ] Invalid data → 400
- [ ] Job not found → 404
- [ ] Rate limit → 429

---

## Postman Auto-Save Scripts

### After OAuth Login
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const data = pm.response.json();
    pm.environment.set("accessToken", data.accessToken);
    pm.environment.set("refreshToken", data.refreshToken);
    pm.environment.set("userId", data.user.id);
}
```

### After Verify OTP
```javascript
if (pm.response.code === 200) {
    const data = pm.response.json();
    pm.environment.set("accessToken", data.accessToken);
    pm.environment.set("refreshToken", data.refreshToken);
}
```

### After Create Job
```javascript
if (pm.response.code === 201) {
    const data = pm.response.json();
    pm.environment.set("jobId", data.job.id);
}
```

### After Apply to Job
```javascript
if (pm.response.code === 201) {
    const data = pm.response.json();
    pm.environment.set("applicationId", data.application.id);
}
```

---

## Phone Number Format

Cambodia only: `+855` followed by 8-9 digits

**Valid:**
- +855964519228
- +85596451822

**Invalid:**
- 964519228 (missing +855)
- +1234567890 (wrong country)

---

## OAuth Testing Notes

### Getting Test Tokens

**For Google:**
1. Use Google OAuth Playground: https://developers.google.com/oauthplayground/
2. Select "Google OAuth2 API v2"
3. Authorize and get tokens
4. Use the `id_token` in your request

**For LinkedIn:**
1. Use LinkedIn's OAuth flow in a test app
2. Get the access token after authorization
3. Use it in your request

### Testing OAuth Logout
Make sure to include the `Authorization` header with your JWT access token when testing logout to enable OAuth token revocation:

```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_ACCESS_TOKEN" \
  -d '{"refreshToken": "YOUR_JWT_REFRESH_TOKEN"}'
```

### OAuth vs Phone Users
- OAuth users have `email` and `name` in User table
- Phone users have `phone` in User table
- Both use the same JWT token system
- Both need to select roles after login
- Both create profiles manually
