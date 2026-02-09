# OAuth Implementation - Setup Instructions

## ✅ Implementation Complete

All OAuth authentication code has been successfully implemented! However, you need to complete the following setup steps before the build will succeed.

---

## 🔧 Required Setup Steps

### 1. Update Your `.env` File

Add the following OAuth environment variables to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-for-android.apps.googleusercontent.com
GOOGLE_CLIENT_ID_IOS=your-google-client-id-for-ios.apps.googleusercontent.com

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

**Important:** Make sure each variable is on its own line with proper newlines.

### 2. Get OAuth Credentials

#### For Google:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Sign-In API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Create credentials for:
   - Android application
   - iOS application
6. Copy the Client IDs

#### For LinkedIn:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Go to "Auth" tab
5. Copy Client ID and Client Secret
6. Add redirect URIs for your Flutter app

### 3. Run Database Migration

After setting up environment variables, run:

```bash
npx prisma migrate dev --name add_oauth_support
npx prisma generate
```

This will:
- Create the `oauth_accounts` table
- Update the `User` table with optional `phone`, `email`, and `name` fields
- Generate Prisma client with OAuth types

### 4. Build the Project

```bash
npm run build
```

---

## 📁 What Was Implemented

### Database Changes
- ✅ Added `OAuthAccount` model
- ✅ Updated `User` model (phone now optional, added email and name)
- ✅ Added `OAuthProvider` enum (Google, LinkedIn)

### Backend Files Created
- ✅ `src/lib/oauth.ts` - OAuth verification and token management
- ✅ `src/app/api/auth/oauth/route.ts` - OAuth login endpoint
- ✅ Updated `src/app/api/(auth)/logout/route.ts` - OAuth token revocation
- ✅ Updated `src/lib/jwt.ts` - Added `verifyAccessToken` function

### Dependencies Installed
- ✅ `google-auth-library` - Google token verification
- ✅ `axios` - LinkedIn API calls

### Documentation Created
- ✅ `OAUTH_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- ✅ `API_TESTING_GUIDE.md` - Updated with OAuth endpoints
- ✅ This file - Setup instructions

---

## 🧪 Testing After Setup

### 1. Test OAuth Login (Google)

```bash
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "Google",
    "idToken": "your-google-id-token",
    "accessToken": "your-google-access-token",
    "refreshToken": "your-google-refresh-token"
  }'
```

### 2. Test OAuth Login (LinkedIn)

```bash
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "LinkedIn",
    "accessToken": "your-linkedin-access-token",
    "refreshToken": "your-linkedin-refresh-token"
  }'
```

### 3. Test Logout with Token Revocation

```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-access-token" \
  -d '{
    "refreshToken": "your-jwt-refresh-token"
  }'
```

---

## 🔄 Authentication Flow

1. **User signs in with Google/LinkedIn in Flutter app**
2. **Flutter receives OAuth tokens from provider**
3. **Flutter sends tokens to `POST /api/auth/oauth`**
4. **Backend verifies tokens with OAuth provider**
5. **Backend creates/updates User + OAuthAccount**
6. **Backend returns JWT tokens (same as phone auth)**
7. **User selects role via `POST /api/select-role`**
8. **User creates profile manually**

---

## 📱 Flutter Integration

See `OAUTH_IMPLEMENTATION_GUIDE.md` for complete Flutter integration examples including:
- Google Sign-In setup
- LinkedIn Sign-In setup
- Token management
- Logout implementation

---

## 🚨 Troubleshooting

### Build Fails with "Missing environment variable"
- Make sure all 4 OAuth variables are in your `.env` file
- Check that each variable is on its own line
- Restart your development server after adding variables

### "Invalid or expired OAuth token" Error
- Verify your OAuth credentials are correct
- Check token hasn't expired
- Ensure CLIENT_IDs match your app configuration

### Database Migration Fails
- Check PostgreSQL connection
- Ensure no duplicate emails exist in User table
- Run `npx prisma migrate reset` if needed (⚠️ deletes data)

---

## 📚 Additional Resources

- **Implementation Guide**: `OAUTH_IMPLEMENTATION_GUIDE.md`
- **API Testing Guide**: `API_TESTING_GUIDE.md`
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **LinkedIn OAuth Docs**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication

---

## ✨ Features Implemented

✅ Google OAuth authentication
✅ LinkedIn OAuth authentication  
✅ Token verification and validation
✅ User creation/update with OAuth data
✅ JWT token issuance (same as phone auth)
✅ OAuth token storage for revocation
✅ Logout with OAuth token revocation
✅ Separate accounts for different providers
✅ Role selection after OAuth login
✅ Manual profile creation

---

## 🎯 Next Steps

1. Add OAuth environment variables to `.env`
2. Get real OAuth credentials from Google and LinkedIn
3. Run database migration
4. Build and test the backend
5. Implement Flutter OAuth integration
6. Test end-to-end flow

---

**Need Help?** Refer to `OAUTH_IMPLEMENTATION_GUIDE.md` for detailed implementation and Flutter integration examples.
