# Future Features - Implementation Notes

## 🔮 Features to Implement Later

This document tracks features planned for future implementation.

---

## 1. Messaging System

### Overview
Allow Job_finders and Recruiters to communicate directly about job applications and opportunities.

### Key Considerations (Due to Role Switching)
- Messages belong to **User** (not role)
- Track `senderRole` and `receiverRole` for context
- Filter messages by active role in UI
- Show cross-role message count ("You have 3 messages in Recruiter inbox")

### Database Schema Needed
```prisma
model Message {
  id           String   @id @default(cuid())
  senderId     String
  receiverId   String
  content      String
  senderRole   RoleName
  receiverRole RoleName
  read         Boolean  @default(false)
  createdAt    DateTime @default(now())

  sender   User @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiver User @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([receiverId, read])
  @@index([senderId])
}
```

### API Endpoints Needed
- `GET /api/messages` - Get messages for current role
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread count per role

---

## 2. Notifications System

### Overview
Notify users about important events (applications, messages, job matches, etc.)

### Key Considerations (Due to Role Switching)
- Notifications belong to **User** (not role)
- Each notification has `targetRole` (which role should see it)
- Show notifications only for active role
- Display badge for other role's unread notifications

### Database Schema Needed
```prisma
model Notification {
  id         String   @id @default(cuid())
  userId     String
  targetRole RoleName
  type       String   // "application_received", "message_received", "job_match", etc.
  content    String
  link       String?  // Deep link to relevant page
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, targetRole, read])
  @@index([createdAt])
}
```

### Notification Types
- **For Job_finder:**
  - Application status changed
  - New message from recruiter
  - Job match/recommendation
  - Interview scheduled

- **For Recruiter:**
  - New application received
  - Applicant messaged
  - Job post expiring
  - Application deadline approaching

### API Endpoints Needed
- `GET /api/notifications` - Get notifications for current role
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count per role

---

## 3. Job Applications System

### Overview
Allow Job_finders to apply to jobs posted by Recruiters.

### Database Schema Needed
```prisma
model Job {
  id          String   @id @default(cuid())
  recruiterId String
  title       String
  description String
  location    String
  salary      String?
  type        String   // "full-time", "part-time", "contract"
  status      String   @default("active") // "active", "closed", "filled"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  recruiter    User             @relation(fields: [recruiterId], references: [id], onDelete: Cascade)
  applications JobApplication[]

  @@index([recruiterId])
  @@index([status, createdAt])
}

model JobApplication {
  id          String   @id @default(cuid())
  jobId       String
  applicantId String
  recruiterId String
  status      String   @default("pending") // "pending", "reviewed", "shortlisted", "rejected", "accepted"
  coverLetter String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  job       Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  applicant User @relation("JobApplicationsAsApplicant", fields: [applicantId], references: [id], onDelete: Cascade)
  recruiter User @relation("JobApplicationsAsRecruiter", fields: [recruiterId], references: [id], onDelete: Cascade)

  @@unique([jobId, applicantId]) // One application per job per user
  @@index([applicantId])
  @@index([recruiterId])
  @@index([status])
}
```

### API Endpoints Needed

**For Job_finder:**
- `GET /api/jobs` - Browse/search jobs
- `GET /api/jobs/:id` - View job details
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/applications` - View my applications
- `DELETE /api/applications/:id` - Withdraw application

**For Recruiter:**
- `GET /api/jobs` - View my posted jobs
- `POST /api/jobs` - Create job posting
- `PUT /api/jobs/:id` - Update job posting
- `DELETE /api/jobs/:id` - Delete job posting
- `GET /api/jobs/:id/applications` - View applications for a job
- `PATCH /api/applications/:id/status` - Update application status

---

## 4. Real-time Features (WebSocket/SSE)

### Overview
Real-time updates for messages and notifications without page refresh.

### Technology Options
- WebSocket (Socket.io)
- Server-Sent Events (SSE)
- Polling (simple but less efficient)

### Implementation Notes
- Need to handle role context in WebSocket connections
- Emit events to correct role channels
- Handle reconnection when user switches roles

---

## 5. File Upload for Applications

### Overview
Allow Job_finders to upload resumes/CVs when applying.

### Cloudinary Integration
- Use existing Cloudinary setup
- New folder: `application-documents/`
- New image type: `application-document`
- File types: PDF, DOC, DOCX
- Max size: 10MB

### Database Updates
```prisma
model JobApplication {
  // ... existing fields
  resumeUrl String?
  // ...
}
```

---

## 6. Search & Filtering

### For Job_finder
- Search jobs by title, location, type
- Filter by salary range, job type
- Save job searches
- Job recommendations based on profile

### For Recruiter
- Search applicants
- Filter by skills, experience
- Saved candidate searches

---

## 7. Analytics Dashboard

### For Job_finder
- Application statistics
- Profile views
- Job match rate

### For Recruiter
- Job posting performance
- Application conversion rate
- Time to hire metrics

---

## Implementation Priority

Suggested order based on dependencies:

1. **Job Posting System** (foundational)
2. **Job Application System** (core feature)
3. **Notifications** (enhances UX)
4. **Messaging** (enables communication)
5. **File Upload for Applications** (better applications)
6. **Real-time Updates** (polish)
7. **Search & Filtering** (scalability)
8. **Analytics** (insights)

---

## Current System Status ✅

### Already Implemented:
- ✅ User authentication (OTP)
- ✅ Role system (Job_finder, Recruiter, Admin)
- ✅ Role switching (preserve both profiles)
- ✅ Job Seeker profile management
- ✅ Company profile management
- ✅ Cloudinary image upload (avatars & logos)
- ✅ JWT access/refresh tokens
- ✅ Admin dashboard

### Ready for Next Phase:
- Jobs & Applications
- Messaging
- Notifications

---

## Notes

- All features must respect role-based access control
- Consider role switching in every feature design
- Test cross-role interactions thoroughly
- Maintain data continuity when users switch roles
- Use role-aware filtering in UI
- Show cross-role indicators where appropriate

---

Last Updated: 2026-01-22
