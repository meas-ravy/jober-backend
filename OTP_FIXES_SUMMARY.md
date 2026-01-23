# OTP Authentication Fixes Summary

## Issues Fixed

### 1. ✅ Critical Bug: OTP Verification Always Failed
**Problem:** Parameter order mismatch in `hashOTP()` function caused hashes to never match.

**File:** `src/lib/otp.ts`

**Fix:**
```typescript
// BEFORE (Wrong)
const otpHash = hashOTP(otp, phone); // ❌

// AFTER (Correct)
const otpHash = hashOTP(phone, otp); // ✅
```

**Impact:** OTP verification now works correctly!

---

### 2. ✅ Missing Refresh Token in Response
**Problem:** `verify-otp` endpoint wasn't returning the refresh token, even though it was generated.

**File:** `src/app/api/(auth)/verify-otp/route.ts`

**Fix:**
```typescript
// BEFORE
return NextResponse.json({
  user: { ... },
  accessToken: tokens.accessToken,
  // ❌ Missing refreshToken
});

// AFTER
return NextResponse.json({
  success: true,
  message: "Authentication successful",
  user: { ... },
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken, // ✅ Added
});
```

---

### 3. ✅ Cambodian Phone Number Validation
**Problem:** No validation for phone number format.

**Files:** 
- `src/app/api/(auth)/sent-otp/route.ts`
- `src/app/api/(auth)/verify-otp/route.ts`

**Added:**
```typescript
function isValidCambodianPhone(phone: string): boolean {
  const phoneRegex = /^\+855\d{8,9}$/;
  return phoneRegex.test(phone);
}
```

**Accepted Formats:**
- ✅ `+855964519228` (9 digits after +855)
- ✅ `+85596451822` (8 digits after +855)
- ❌ `964519228` (missing +855)
- ❌ `+8559645192` (only 7 digits)
- ❌ `+8559645192289` (10 digits, too long)
- ❌ `+856964519228` (wrong country code)

**Validation Rules:**
- Must start with `+855` (Cambodia country code)
- Must be followed by 8 or 9 digits
- Total length: 12-13 characters (+855 + 8-9 digits)

---

### 4. ✅ Better Error Messages

#### **sent-otp endpoint:**

**Request Body Validation:**
```json
{
  "error": "Invalid request body"
}
```

**Phone Format Error:**
```json
{
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits (e.g., +855964519228)"
}
```

**SMS Sending Failed:**
```json
{
  "error": "Failed to send OTP",
  "details": "Unable to send SMS. Please check your phone number or try again later."
}
```

**Rate Limit:**
```json
{
  "error": "Too many requests",
  "details": "Too many OTP requests. Please try again later."
}
```

**Success:**
```json
{
  "success": true,
  "message": "OTP has been sent successfully to your phone"
}
```

#### **verify-otp endpoint:**

**OTP Length Validation:**
```json
{
  "error": "OTP code must be 4 digits"
}
```

**Invalid OTP:**
```json
{
  "error": "Invalid or expired OTP code",
  "details": "The OTP code is incorrect or has expired. Please request a new code."
}
```

**Too Many Attempts:**
```json
{
  "error": "Too many failed attempts",
  "details": "Maximum verification attempts exceeded. Please request a new OTP."
}
```

**Success:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cuid...",
    "phone": "+1234567890",
    "roles": []
  },
  "accessToken": "eyJ...",
  "refreshToken": "base64url..."
}
```

---

## Testing the Fixes

### 1. Send OTP
```bash
POST /api/sent-otp
Content-Type: application/json

{
  "phone": "+855964519228"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP has been sent successfully to your phone"
}
```

### 2. Verify OTP
```bash
POST /api/verify-otp
Content-Type: application/json

{
  "phone": "+855964519228",
  "otp": "1234"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cuid...",
    "phone": "+855964519228",
    "roles": []
  },
  "accessToken": "eyJ...",
  "refreshToken": "abc123..."
}
```

### 3. Test Invalid Phone Formats
```bash
# ❌ Missing +855
{ "phone": "964519228" }
→ "Invalid phone number format"

# ❌ Wrong country code
{ "phone": "+856964519228" }
→ "Invalid phone number format"

# ❌ Too short (only 7 digits)
{ "phone": "+8559645192" }
→ "Invalid phone number format"

# ❌ Too long (10 digits)
{ "phone": "+8559645192289" }
→ "Invalid phone number format"
```

---

## Additional Improvements

### Error Logging
- Added `console.error()` for debugging SMS and verification failures
- Errors logged include full context for troubleshooting

### Development vs Production Error Details
- **Development:** Full error messages shown in `details` field
- **Production:** Generic user-friendly messages

### SMS Sending Error Handling
- Separate try-catch for SMS sending
- Clearer distinction between OTP creation vs SMS delivery failures

---

## Files Modified

1. ✅ `src/lib/otp.ts` - Fixed parameter order bug
2. ✅ `src/app/api/(auth)/verify-otp/route.ts` - Added refresh token, validation, better errors
3. ✅ `src/app/api/(auth)/sent-otp/route.ts` - Added validation, better errors, SMS error handling

---

## What's Next?

Your OTP authentication flow is now fully functional! Users can:
1. ✅ Request OTP with valid Cambodian phone numbers (+855)
2. ✅ Verify OTP and receive both access + refresh tokens
3. ✅ Get clear error messages when something goes wrong
4. ✅ Be protected from rate limiting abuse

## Phone Number Requirements

**Accepted Format:** `+855` followed by 8 or 9 digits

**Valid Examples:**
- `+855964519228` (9 digits)
- `+85596451822` (8 digits)
- `+85512345678` (8 digits)
- `+855123456789` (9 digits)

**Invalid Examples:**
- `964519228` (missing +855 prefix)
- `+1234567890` (wrong country code)
- `+8559645` (too short)
- `+8559645192289` (too long)
