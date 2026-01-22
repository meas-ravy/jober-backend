# Role Switching - User Guide

## Overview

Users can now switch between **Job_finder** and **Recruiter** roles while keeping both profiles intact. This provides maximum flexibility for users who may need to use both features.

## How It Works

### Key Principles

1. ✅ **User can switch roles anytime** - No restrictions
2. ✅ **Both profiles are preserved** - No data loss
3. ✅ **Only ONE active role at a time** - Either Job_finder OR Recruiter
4. ✅ **Role controls API access** - Determines what endpoints you can use

---

## Complete User Journey Example

### Scenario: Mike's Journey

```
Day 1: Mike signs up as Recruiter
Day 30: Mike switches to Job_finder 
Day 60: Mike switches back to Recruiter
Result: ALL data preserved, no re-entry needed!
```

---

## Step-by-Step Flow

### **Day 1: Mike Signs Up as Recruiter**

#### 1. Verify Phone Number
```http
POST /api/sent-otp
Body: { "phone": "+1234567890" }
Response: { "success": true }

POST /api/verify-otp
Body: { "phone": "+1234567890", "otp": "123456" }
Response: {
  "user": { "id": "user_123", "roles": [] },
  "accessToken": "eyJhb..."
}
```

#### 2. Select Recruiter Role
```http
POST /api/select-role
Authorization: Bearer eyJhb...
Body: { "role": "Recruiter" }
Response: {
  "success": true,
  "user": {
    "id": "user_123",
    "roles": ["Recruiter"]
  },
  "accessToken": "new_token_with_recruiter_role",
  "refreshToken": "refresh_token"
}
```

**Database State:**
```
User {
  id: user_123
  roles: [Recruiter]
  companyProfile: null        ← Not created yet
  jobSeekerProfile: null      ← Not created yet
}
```

#### 3. Create Company Profile
```http
POST /api/company
Authorization: Bearer new_token_with_recruiter_role
Body: {
  "name": "TechCorp Inc",
  "contactEmail": "jobs@techcorp.com",
  "contactPhone": "+1234567890",
  "location": "New York, NY",
  "description": "Leading tech company",
  "logoUrl": "https://res.cloudinary.com/.../company-logos/techcorp.jpg"
}
Response: {
  "success": true,
  "company": { "id": "company_1", "name": "TechCorp Inc", ... }
}
```

**Database State:**
```
User {
  id: user_123
  roles: [Recruiter]
  companyProfile: {           ← Created! ✅
    id: company_1
    name: "TechCorp Inc"
    logoUrl: "https://..."
    contactEmail: "jobs@techcorp.com"
    location: "New York, NY"
    description: "Leading tech company"
  }
  jobSeekerProfile: null
}
```

---

### **Day 30: Mike Switches to Job_finder**

#### 1. Switch Role to Job_finder
```http
POST /api/select-role
Authorization: Bearer token_with_recruiter_role
Body: { "role": "Job_finder" }
Response: {
  "success": true,
  "user": {
    "id": "user_123",
    "roles": ["Job_finder"]     ← Changed!
  },
  "accessToken": "new_token_with_jobfinder_role",
  "refreshToken": "refresh_token"
}
```

**Database State:**
```
User {
  id: user_123
  roles: [Job_finder]         ← Changed from Recruiter
  companyProfile: {           ← STILL EXISTS! No data loss! ✅
    id: company_1
    name: "TechCorp Inc"
    logoUrl: "https://..."
    // ... all data preserved
  }
  jobSeekerProfile: null      ← Still null
}
```

#### 2. Create Job Seeker Profile
```http
POST /api/profile
Authorization: Bearer new_token_with_jobfinder_role
Body: {
  "fullName": "Mike Johnson",
  "email": "mike@email.com",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "avatarUrl": "https://res.cloudinary.com/.../job-seeker-avatars/mike.jpg"
}
Response: {
  "success": true,
  "profile": { "id": "profile_1", "fullName": "Mike Johnson", ... }
}
```

**Database State:**
```
User {
  id: user_123
  roles: [Job_finder]
  companyProfile: {           ← STILL THERE! ✅
    id: company_1
    name: "TechCorp Inc"
    logoUrl: "https://..."
    // ... all data intact
  }
  jobSeekerProfile: {         ← NEW! ✅
    id: profile_1
    fullName: "Mike Johnson"
    email: "mike@email.com"
    avatarUrl: "https://..."
    dateOfBirth: 1990-05-15
    gender: Male
  }
}
```

**What Mike Can Do Now:**
- ✅ Apply to jobs (Job_finder features)
- ✅ Upload job seeker avatar
- ✅ Search for jobs
- ❌ Cannot post jobs (needs Recruiter role)
- ❌ Cannot upload company logo (needs Recruiter role)

---

### **Day 60: Mike Switches Back to Recruiter**

#### 1. Switch Role Back to Recruiter
```http
POST /api/select-role
Authorization: Bearer token_with_jobfinder_role
Body: { "role": "Recruiter" }
Response: {
  "success": true,
  "user": {
    "id": "user_123",
    "roles": ["Recruiter"]      ← Switched back!
  },
  "accessToken": "new_token_with_recruiter_role",
  "refreshToken": "refresh_token"
}
```

**Database State:**
```
User {
  id: user_123
  roles: [Recruiter]          ← Back to Recruiter
  companyProfile: {           ← STILL THERE! All original data! ✅
    id: company_1
    name: "TechCorp Inc"
    logoUrl: "https://..."
    // ... EXACTLY as Mike left it on Day 1!
  }
  jobSeekerProfile: {         ← ALSO STILL THERE! ✅
    id: profile_1
    fullName: "Mike Johnson"
    email: "mike@email.com"
    avatarUrl: "https://..."
    // ... all data preserved
  }
}
```

**What Mike Can Do Now:**
- ✅ Post jobs (Recruiter features)
- ✅ Upload company logo
- ✅ View applications
- ✅ Access company profile (still has all original data!)
- ❌ Cannot apply to jobs (needs Job_finder role)
- ❌ Cannot upload job seeker avatar (needs Job_finder role)

**Important:** Mike doesn't need to re-enter ANY company information. His logo, company description, everything is still there!

---

## API Access Control by Role

### When Role = "Recruiter"

| Endpoint | Method | Access |
|----------|--------|--------|
| `/api/upload/signature` (company-logo) | POST | ✅ Allowed |
| `/api/upload/signature` (job-seeker-avatar) | POST | ❌ Denied |
| `/api/company` | GET/POST | ✅ Allowed |
| `/api/profile` | GET/POST/PUT | ❌ Denied |

### When Role = "Job_finder"

| Endpoint | Method | Access |
|----------|--------|--------|
| `/api/upload/signature` (company-logo) | POST | ❌ Denied |
| `/api/upload/signature` (job-seeker-avatar) | POST | ✅ Allowed |
| `/api/company` | GET/POST | ❌ Denied |
| `/api/profile` | GET/POST/PUT | ✅ Allowed |

---

## Common Scenarios

### Scenario 1: Freelancer Who Also Hires

**User:** Sarah is a freelance developer who also hires other freelancers

**Flow:**
1. Sign up as Job_finder → Create job seeker profile
2. Switch to Recruiter → Create company profile
3. Switch between roles as needed
4. Both profiles always available

---

### Scenario 2: Career Transition

**User:** John is switching from being employed to starting his own company

**Flow:**
1. Sign up as Job_finder → Apply to jobs
2. Gets a job, starts company
3. Switch to Recruiter → Post jobs to hire team
4. Job seeker profile preserved (resume data still there)

---

### Scenario 3: Accidental Wrong Role Selection

**User:** Emma accidentally selected Recruiter instead of Job_finder

**Flow:**
1. Sign up, select "Recruiter" by mistake
2. Immediately call `/api/select-role` again with "Job_finder"
3. ✅ Role switched, no problem!

---

## Important Notes

### ✅ What IS Preserved When Switching:
- Company profile (name, logo, contact info, description)
- Job seeker profile (name, email, avatar, date of birth)
- All uploaded images (Cloudinary URLs remain valid)
- User data is NEVER deleted

### ⚠️ What Changes When Switching:
- Active role (determines API access)
- JWT tokens (new tokens issued with new role)
- Available endpoints (role-based access control)

### 🔑 Security:
- Each role switch issues new JWT tokens
- Old refresh tokens are revoked (single-device session)
- Role is embedded in JWT and verified on every API call
- Cannot access other role's endpoints without switching

---

## Error Handling

### Error 1: Admin Role Not Allowed
```http
POST /api/select-role
Body: { "role": "Admin" }
Response: 403 {
  "error": "Admin role cannot be selected"
}
```
**Reason:** Admin role must be assigned directly in database, not self-selected

### Error 2: Invalid Role
```http
POST /api/select-role
Body: { "role": "InvalidRole" }
Response: 400 {
  "error": "Role is required"
}
```
**Reason:** Role must be exactly "Job_finder" or "Recruiter"

### Error 3: Missing Token
```http
POST /api/select-role
Body: { "role": "Recruiter" }
Response: 401 {
  "error": "Authorization token is required"
}
```
**Reason:** Must include Bearer token in Authorization header

---

## Best Practices

### For Frontend Developers:

1. **Always get new tokens after role switch**
   ```javascript
   const { accessToken, refreshToken } = await switchRole('Recruiter');
   // Store new tokens
   localStorage.setItem('accessToken', accessToken);
   localStorage.setItem('refreshToken', refreshToken);
   ```

2. **Check which profiles exist**
   ```javascript
   // After login, check what profiles user has
   const hasCompanyProfile = await checkCompanyProfile();
   const hasJobSeekerProfile = await checkJobSeekerProfile();
   
   // Guide user to create missing profile if needed
   ```

3. **Show role switcher in UI**
   ```javascript
   // Let users easily switch between roles
   <RoleSwitcher 
     currentRole={user.roles[0]} 
     onSwitch={(newRole) => switchRole(newRole)}
   />
   ```

4. **Handle role-based routing**
   ```javascript
   if (user.roles.includes('Recruiter')) {
     navigate('/recruiter/dashboard');
   } else if (user.roles.includes('Job_finder')) {
     navigate('/jobseeker/dashboard');
   }
   ```

---

## Testing Checklist

- [ ] User can select initial role (Job_finder or Recruiter)
- [ ] User can create profile for selected role
- [ ] User can switch to other role
- [ ] New tokens are issued after role switch
- [ ] Old profile data is preserved after switch
- [ ] User can create second profile for new role
- [ ] User can switch back to original role
- [ ] Original profile data is still intact
- [ ] API access is controlled by current role
- [ ] Cannot access wrong role's endpoints
- [ ] Can upload images appropriate to current role
- [ ] Admin role cannot be self-selected

---

## Summary

✅ **Flexible** - Switch roles anytime  
✅ **Safe** - No data loss, all profiles preserved  
✅ **Secure** - Role-based access control enforced  
✅ **User-Friendly** - No need to re-enter data  
✅ **Simple** - One active role at a time  

The system now supports the real-world scenario where users may need both job seeker and recruiter features, while maintaining clean separation through role-based access control.
