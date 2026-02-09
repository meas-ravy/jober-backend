# OAuth Implementation Guide

Complete guide for Google and LinkedIn OAuth authentication for Flutter mobile app.

---

## Overview

This implementation allows job seekers and recruiters to sign in using their Google or LinkedIn accounts. OAuth users are separate from phone-based users, but use the same JWT token system and role selection flow.

---

## Architecture

```mermaid
sequenceDiagram
    participant Flutter
    participant Backend
    participant OAuth Provider
    participant Database

    Flutter->>OAuth Provider: Sign in with Google/LinkedIn
    OAuth Provider->>Flutter: Return tokens (idToken/accessToken + refreshToken)
    Flutter->>Backend: POST /api/auth/oauth
    Backend->>OAuth Provider: Verify token
    OAuth Provider->>Backend: Valid user data
    Backend->>Database: Create/Update User + OAuthAccount
    Backend->>Backend: Generate JWT tokens
    Backend->>Flutter: Return JWT accessToken + refreshToken
    
    Note over Flutter,Backend: User continues with role selection
```

---

## Database Schema

### User Model (Updated)
```prisma
model User {
  id               String            @id @default(cuid())
  phone            String?           @unique  // Optional now
  email            String?           @unique  // NEW - for OAuth
  name             String?                    // NEW - from OAuth
  oauthAccounts    OAuthAccount[]             // NEW relation
  // ... other fields
}
```

### OAuthAccount Model (New)
```prisma
model OAuthAccount {
  id                   String        @id @default(cuid())
  userId               String
  provider             OAuthProvider
  providerId           String        // OAuth provider's user ID
  email                String
  name                 String?
  avatarUrl            String?
  providerAccessToken  String?       // For revocation
  providerRefreshToken String?       // For revocation
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
}

enum OAuthProvider {
  Google
  LinkedIn
}
```

---

## Environment Variables

Add to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-for-android.apps.googleusercontent.com"
GOOGLE_CLIENT_ID_IOS="your-google-client-id-for-ios.apps.googleusercontent.com"

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

### Getting OAuth Credentials

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Sign-In API"
4. Create OAuth 2.0 credentials for Android and iOS
5. Copy Client IDs

**LinkedIn:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Copy Client ID and Client Secret
5. Add redirect URIs for your app

---

## API Endpoint

### POST /api/auth/oauth

Authenticate user with OAuth provider.

**Request Body:**

For Google:
```json
{
  "provider": "Google",
  "idToken": "eyJhbGc...",
  "accessToken": "ya29...",      // Optional
  "refreshToken": "1//0g..."     // Optional
}
```

For LinkedIn:
```json
{
  "provider": "LinkedIn",
  "accessToken": "AQV...",
  "refreshToken": "AQW..."       // Optional
}
```

**Response (201 for new user, 200 for existing):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cm5xxx",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": null,
    "roles": []
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "abc123..."
}
```

**Error Responses:**
- `400` - Missing or invalid provider/token
- `401` - Invalid or expired OAuth token
- `500` - Server error

---

## Flutter Integration

### 1. Install Dependencies

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.5
  linkedin_login: ^2.2.2
  http: ^1.1.0
```

### 2. Google Sign-In Implementation

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // Sign in with Google
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) return null;

      // Get authentication tokens
      final GoogleSignInAuthentication auth = await account.authentication;
      
      // Send to backend
      final response = await http.post(
        Uri.parse('http://your-backend.com/api/auth/oauth'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'provider': 'Google',
          'idToken': auth.idToken,
          'accessToken': auth.accessToken,
          // Note: Google doesn't provide refresh token in mobile SDK
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        
        // Store JWT tokens
        await _storeTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        
        return data;
      }
      
      return null;
    } catch (e) {
      print('Google sign in error: $e');
      return null;
    }
  }

  Future<void> _storeTokens(String accessToken, String refreshToken) async {
    // Store in secure storage (use flutter_secure_storage)
    // await secureStorage.write(key: 'accessToken', value: accessToken);
    // await secureStorage.write(key: 'refreshToken', value: refreshToken);
  }
}
```

### 3. LinkedIn Sign-In Implementation

```dart
import 'package:linkedin_login/linkedin_login.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  Future<Map<String, dynamic>?> signInWithLinkedIn(BuildContext context) async {
    try {
      // LinkedIn OAuth configuration
      final config = LinkedInConfig(
        clientId: 'your-linkedin-client-id',
        clientSecret: 'your-linkedin-client-secret',
        redirectUrl: 'https://your-app.com/auth/linkedin/callback',
        scope: ['openid', 'profile', 'email'],
      );

      // Show LinkedIn login
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => LinkedInAuthCodeWidget(
            config: config,
            onGetAuthToken: (AuthorizationSucceededAction response) {
              // Handle success
              Navigator.pop(context, response);
            },
            onGetUserProfile: (GetUserProfileSucceededAction response) {
              // Optional: handle user profile
            },
          ),
        ),
      );

      if (result == null) return null;

      // Send to backend
      final response = await http.post(
        Uri.parse('http://your-backend.com/api/auth/oauth'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'provider': 'LinkedIn',
          'accessToken': result.token.accessToken,
          'refreshToken': result.token.refreshToken,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        
        // Store JWT tokens
        await _storeTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        
        return data;
      }
      
      return null;
    } catch (e) {
      print('LinkedIn sign in error: $e');
      return null;
    }
  }
}
```

### 4. UI Example

```dart
class LoginScreen extends StatelessWidget {
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Google Sign-In Button
            ElevatedButton.icon(
              onPressed: () async {
                final result = await _authService.signInWithGoogle();
                if (result != null) {
                  // Navigate to role selection or home
                  Navigator.pushReplacementNamed(context, '/select-role');
                }
              },
              icon: Icon(Icons.login),
              label: Text('Sign in with Google'),
            ),
            
            SizedBox(height: 16),
            
            // LinkedIn Sign-In Button
            ElevatedButton.icon(
              onPressed: () async {
                final result = await _authService.signInWithLinkedIn(context);
                if (result != null) {
                  // Navigate to role selection or home
                  Navigator.pushReplacementNamed(context, '/select-role');
                }
              },
              icon: Icon(Icons.work),
              label: Text('Sign in with LinkedIn'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Authentication Flow

### 1. Initial Login

```
User taps "Sign in with Google/LinkedIn"
    ↓
Flutter SDK handles OAuth flow
    ↓
Flutter receives tokens from provider
    ↓
Flutter sends tokens to POST /api/auth/oauth
    ↓
Backend verifies with provider
    ↓
Backend creates/updates User + OAuthAccount
    ↓
Backend returns JWT tokens
    ↓
Flutter stores JWT tokens
    ↓
User continues to role selection
```

### 2. Role Selection

After OAuth login, users must select their role (same as phone users):

```dart
// Call existing role selection API
final response = await http.post(
  Uri.parse('http://your-backend.com/api/select-role'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $accessToken',
  },
  body: jsonEncode({
    'role': 'Job_finder', // or 'Recruiter'
  }),
);
```

### 3. Profile Creation

OAuth users still need to create profiles manually:

- **Job Seekers**: POST /api/profile
- **Recruiters**: POST /api/company

OAuth data (name, email, avatar) is stored in the User table but doesn't auto-create profiles.

---

## Logout with Token Revocation

### Updated Logout Flow

```
User taps "Logout"
    ↓
Flutter sends POST /api/logout with accessToken + refreshToken
    ↓
Backend extracts userId from accessToken
    ↓
Backend finds all OAuthAccounts for user
    ↓
Backend revokes Google tokens (if any)
    ↓
Backend clears LinkedIn tokens (no official revoke)
    ↓
Backend revokes JWT refresh token
    ↓
Flutter clears stored tokens
    ↓
User logged out
```

### Flutter Logout Implementation

```dart
Future<void> logout() async {
  try {
    final accessToken = await _getStoredAccessToken();
    final refreshToken = await _getStoredRefreshToken();

    // Call logout API
    await http.post(
      Uri.parse('http://your-backend.com/api/logout'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({
        'refreshToken': refreshToken,
      }),
    );

    // Clear local tokens
    await _clearStoredTokens();
    
    // Sign out from Google SDK
    await _googleSignIn.signOut();
    
    // Navigate to login
    Navigator.pushReplacementNamed(context, '/login');
  } catch (e) {
    print('Logout error: $e');
  }
}
```

---

## Token Refresh

OAuth users use the **same JWT refresh flow** as phone users:

```dart
Future<String?> refreshAccessToken() async {
  final refreshToken = await _getStoredRefreshToken();
  
  final response = await http.post(
    Uri.parse('http://your-backend.com/api/refresh-token'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'refreshToken': refreshToken,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    await _storeAccessToken(data['accessToken']);
    return data['accessToken'];
  }
  
  return null;
}
```

---

## Security Considerations

### 1. Token Storage
- Store OAuth provider tokens securely in database (encrypted at rest)
- Store JWT tokens in Flutter secure storage
- Never expose provider tokens to client

### 2. Token Validation
- Always verify OAuth tokens server-side
- Check token audience/client ID matches your app
- Handle expired tokens gracefully

### 3. Account Separation
- OAuth accounts are separate from phone accounts
- Same email with different providers = different accounts
- Users cannot link accounts (by design)

### 4. Revocation
- Google tokens are revoked on logout
- LinkedIn has no official revoke endpoint
- JWT refresh tokens are always revoked

---

## Testing

### 1. Test Google OAuth
```bash
# Use Postman or curl
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "Google",
    "idToken": "your-google-id-token"
  }'
```

### 2. Test LinkedIn OAuth
```bash
curl -X POST http://localhost:3000/api/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "LinkedIn",
    "accessToken": "your-linkedin-access-token"
  }'
```

### 3. Test Logout with Revocation
```bash
curl -X POST http://localhost:3000/api/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-access-token" \
  -d '{
    "refreshToken": "your-jwt-refresh-token"
  }'
```

---

## Troubleshooting

### Google Token Verification Fails
- Check CLIENT_ID matches your app
- Ensure iOS CLIENT_ID is also configured
- Verify token hasn't expired (1 hour lifetime)

### LinkedIn Token Verification Fails
- Check access token is valid
- Ensure app has "Sign In with LinkedIn" product enabled
- Verify redirect URI matches configuration

### User Creation Fails
- Check database constraints (unique email)
- Verify Prisma schema is migrated
- Check provider/providerId uniqueness

### Logout Doesn't Revoke Tokens
- Ensure Authorization header is sent
- Check userId extraction from JWT
- Verify OAuth tokens are stored in database

---

## Migration

Run Prisma migration to apply schema changes:

```bash
npx prisma migrate dev --name add_oauth_support
npx prisma generate
```

---

## Additional Resources

- [Google Sign-In for Flutter](https://pub.dev/packages/google_sign_in)
- [LinkedIn Login for Flutter](https://pub.dev/packages/linkedin_login)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
