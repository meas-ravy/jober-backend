# Cloudinary Image Upload - Implementation Guide

## Overview

The Cloudinary direct upload system has been successfully implemented. This allows clients to upload images directly to Cloudinary using signed uploads, then save the returned URLs to your database.

## What Was Implemented

### 1. **Environment Configuration**
- Added Cloudinary credentials to `src/shared/config/env.ts`
- Required environment variables:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### 2. **Cloudinary Utility Library** (`src/lib/cloudinary.ts`)
- `generateUploadSignature(imageType)` - Generates signed upload parameters
- `validateCloudinaryUrl(url, imageType)` - Validates uploaded image URLs
- Image transformations: Auto-format, auto-quality, max 1000x1000px
- Folder structure:
  - Company logos → `company-logos/`
  - Job seeker avatars → `job-seeker-avatars/`

### 3. **API Endpoints**

#### **POST /api/upload/signature**
- **Purpose**: Get signed upload parameters for Cloudinary
- **Auth**: Required (Bearer token)
- **Request Body**:
```json
{
  "imageType": "company-logo" | "job-seeker-avatar"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "signature": "...",
    "timestamp": 1234567890,
    "cloudName": "your-cloud",
    "apiKey": "your-key",
    "folder": "company-logos",
    "transformation": "c_limit,w_1000,h_1000,q_auto,f_auto"
  }
}
```
- **Role Requirements**:
  - `company-logo` → Requires `Recruiter` role
  - `job-seeker-avatar` → Requires `Job_finder` role
- **Rate Limit**: 10 requests per minute per user

#### **POST /api/company** (Updated)
- Now validates that `logoUrl` is a valid Cloudinary URL from the `company-logos/` folder

#### **GET/POST/PUT /api/profile** (New)
- Complete job seeker profile management
- Validates `avatarUrl` is from Cloudinary `job-seeker-avatars/` folder
- **GET**: Retrieve profile
- **POST**: Create new profile (requires all fields)
- **PUT**: Update existing profile (partial updates supported)

### 4. **Security Features**
- ✅ Signed uploads (prevents unauthorized uploads)
- ✅ Role-based access control
- ✅ URL validation (ensures URLs are from your Cloudinary account)
- ✅ Folder prefix validation
- ✅ Rate limiting on signature endpoint
- ✅ Image transformations (automatic optimization)

---

## Client-Side Implementation

### React/TypeScript Example

```typescript
import { useState } from 'react';

interface UploadSignatureResponse {
  success: boolean;
  data: {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    transformation: string;
  };
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  // ... other Cloudinary response fields
}

async function uploadImageToCloudinary(
  imageFile: File,
  imageType: 'company-logo' | 'job-seeker-avatar',
  accessToken: string
): Promise<string> {
  try {
    // Step 1: Get upload signature from your API
    const signatureResponse = await fetch('/api/upload/signature', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageType }),
    });

    if (!signatureResponse.ok) {
      const error = await signatureResponse.json();
      throw new Error(error.error || 'Failed to get upload signature');
    }

    const { data }: UploadSignatureResponse = await signatureResponse.json();

    // Step 2: Upload image to Cloudinary
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('signature', data.signature);
    formData.append('timestamp', data.timestamp.toString());
    formData.append('api_key', data.apiKey);
    formData.append('folder', data.folder);
    formData.append('transformation', data.transformation);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!cloudinaryResponse.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const cloudinaryData: CloudinaryUploadResponse = await cloudinaryResponse.json();

    // Step 3: Return the secure URL
    return cloudinaryData.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Example usage in a component
function CompanyLogoUpload() {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const accessToken = 'your-access-token'; // Get from your auth context

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file, 'company-logo', accessToken);
      setLogoUrl(url);
      console.log('Image uploaded successfully:', url);
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!logoUrl) {
      alert('Please upload a logo first');
      return;
    }

    // Step 4: Save the company profile with the logoUrl
    const response = await fetch('/api/company', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'My Company',
        contactEmail: 'contact@company.com',
        contactPhone: '+1234567890',
        location: 'New York, NY',
        description: 'We are a great company',
        logoUrl: logoUrl,
      }),
    });

    if (response.ok) {
      alert('Company profile created successfully!');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {logoUrl && (
        <div>
          <img src={logoUrl} alt="Preview" style={{ maxWidth: '200px' }} />
          <button onClick={handleSubmit}>Save Company Profile</button>
        </div>
      )}
    </div>
  );
}
```

### Job Seeker Avatar Upload Example

```typescript
function JobSeekerAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const accessToken = 'your-access-token';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(
        file,
        'job-seeker-avatar',
        accessToken
      );
      setAvatarUrl(url);
    } catch (error) {
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'John Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        avatarUrl: avatarUrl || null,
      }),
    });

    if (response.ok) {
      alert('Profile created successfully!');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {avatarUrl && (
        <div>
          <img src={avatarUrl} alt="Avatar" style={{ maxWidth: '200px' }} />
          <button onClick={handleSubmit}>Save Profile</button>
        </div>
      )}
    </div>
  );
}
```

---

## Environment Setup

Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

To get these credentials:
1. Sign up at https://cloudinary.com
2. Go to Dashboard → Settings → Access Keys
3. Copy your Cloud name, API Key, and API Secret

---

## Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Can get upload signature for company logo (Recruiter role)
- [ ] Can get upload signature for job seeker avatar (Job_finder role)
- [ ] Role validation works (Recruiter can't get avatar signature)
- [ ] Upload to Cloudinary succeeds with signature
- [ ] Images are optimized and transformed correctly
- [ ] Company profile saves with valid logoUrl
- [ ] Job seeker profile saves with valid avatarUrl
- [ ] Invalid Cloudinary URLs are rejected
- [ ] Rate limiting prevents excessive requests

---

## API Response Examples

### Success Response (Upload Signature)
```json
{
  "success": true,
  "data": {
    "signature": "a1b2c3d4e5f6...",
    "timestamp": 1737451200,
    "cloudName": "your-cloud",
    "apiKey": "123456789012345",
    "folder": "company-logos",
    "transformation": "c_limit,w_1000,h_1000,q_auto,f_auto"
  }
}
```

### Error Response (Wrong Role)
```json
{
  "error": "Recruiter role required to upload company-logo"
}
```

### Error Response (Invalid URL)
```json
{
  "error": "Invalid logo URL. Must be a valid Cloudinary URL from the company-logos folder"
}
```

### Error Response (Rate Limited)
```json
{
  "error": "Too many requests. Please try again later."
}
```

---

## Notes

1. **Avatar is Optional**: Job seekers can create profiles without avatars (set `avatarUrl: null`)
2. **Logo is Required**: Company profiles require a logo URL
3. **Image Transformations**: All images are automatically optimized (format, quality, size)
4. **Security**: Signatures expire, so upload immediately after getting the signature
5. **Rate Limiting**: Maximum 10 signature requests per minute per user

---

## Troubleshooting

### "Missing environment variable: CLOUDINARY_CLOUD_NAME"
- Ensure all Cloudinary env vars are set in your `.env` file
- Restart your development server after adding env vars

### "Invalid access token"
- Check that you're sending a valid Bearer token
- Ensure the token hasn't expired

### "Recruiter role required to upload company-logo"
- Verify the user has the correct role in their JWT token
- Check the `imageType` matches the user's role

### Upload fails with Cloudinary error
- Check that your Cloudinary credentials are correct
- Ensure the signature hasn't expired (upload within a few minutes)
- Verify file size is under 5MB

### "Invalid logo URL"
- URL must be from Cloudinary (https://res.cloudinary.com/...)
- URL must contain your cloud name
- URL must contain the correct folder (company-logos or job-seeker-avatars)
