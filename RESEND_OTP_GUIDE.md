# Resend OTP API Documentation

## Overview

The Resend OTP endpoint allows users to request a new OTP code if they didn't receive the first one or if it expired. This is useful for improving user experience during authentication.

## Endpoint

```
POST /api/resend-otp
```

## How It Works

1. **Validates** the phone number format (must be Cambodian +855)
2. **Invalidates** any previous unused OTPs for that phone number
3. **Generates** a new 4-digit OTP
4. **Sends** the OTP via SMS (Plasgate)
5. **Rate limits** to prevent abuse (max 3 requests per hour per phone number)

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "phone": "+855964519228"
}
```

### Field Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `phone` | string | Yes | Must start with `+855` and have 8-9 digits |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "A new OTP has been sent to your phone"
}
```

### Error Responses

#### 400 Bad Request - Missing Phone

```json
{
  "error": "Phone number is required"
}
```

#### 400 Bad Request - Invalid Format

```json
{
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits"
}
```

#### 429 Too Many Requests - Rate Limit

```json
{
  "error": "Too many requests",
  "details": "Too many OTP requests. Please try again later."
}
```

**Rate Limit:** 3 requests per hour per phone number

#### 500 Internal Server Error - SMS Failed

```json
{
  "error": "Failed to send OTP",
  "details": "Unable to send SMS. Please check your phone number or try again later."
}
```

#### 500 Internal Server Error - General

```json
{
  "error": "Failed to resend OTP",
  "details": "An error occurred. Please try again."
}
```

## Usage Examples

### Example 1: Successful Resend

**Request:**
```bash
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "A new OTP has been sent to your phone"
}
```

### Example 2: Invalid Phone Format

**Request:**
```bash
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "964519228"
  }'
```

**Response:**
```json
{
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits"
}
```

### Example 3: Rate Limit Exceeded

**Request:**
```bash
# After 3 requests within 1 hour
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228"
  }'
```

**Response:**
```json
{
  "error": "Too many requests",
  "details": "Too many OTP requests. Please try again later."
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
async function resendOTP(phone: string) {
  try {
    const response = await fetch('/api/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error
      if (response.status === 429) {
        alert('Too many requests. Please wait before requesting another OTP.');
      } else {
        alert(data.details || data.error);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Resend OTP failed:', error);
    alert('Network error. Please check your connection.');
    return null;
  }
}

// Usage
const result = await resendOTP('+855964519228');
if (result?.success) {
  console.log('New OTP sent successfully!');
}
```

### React Example with Timer

```tsx
import { useState, useEffect } from 'react';

function OTPResendButton({ phone }: { phone: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('New OTP has been sent!');
        setCooldown(60); // 60 seconds cooldown
      } else {
        alert(data.details || data.error);
      }
    } catch (error) {
      alert('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={cooldown > 0 || isResending}
      className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
    >
      {cooldown > 0 
        ? `Resend OTP (${cooldown}s)` 
        : isResending 
        ? 'Sending...' 
        : 'Resend OTP'}
    </button>
  );
}
```

## Implementation Details

### Automatic Previous OTP Invalidation

When you call `resend-otp`, the system automatically:
1. Deletes all previous **unused** OTPs for that phone number
2. Generates a new OTP
3. Saves the new OTP to the database

This means:
- ✅ Old OTPs become invalid immediately
- ✅ Only the newest OTP can be used
- ✅ No confusion about which OTP to use

### Rate Limiting

The endpoint shares the same rate limit with `/api/sent-otp`:
- **Limit:** 3 OTP requests per hour per phone number
- **Scope:** Applies to both `sent-otp` and `resend-otp` combined
- **Reset:** Automatically resets after 1 hour

**Example:**
```
User requests: sent-otp (1/3)
User requests: resend-otp (2/3)
User requests: resend-otp (3/3)
User requests: resend-otp ❌ Rate limit exceeded!
```

### OTP Expiration

- **Validity:** 5 minutes from generation
- **Attempts:** Maximum 3 verification attempts per OTP
- **Format:** 4-digit numeric code

## Security Features

1. ✅ **Rate limiting** prevents SMS bombing
2. ✅ **Auto-invalidation** of old OTPs prevents confusion
3. ✅ **Phone validation** ensures only Cambodian numbers
4. ✅ **Hashed storage** OTPs are never stored in plain text
5. ✅ **Expiration** OTPs are only valid for 5 minutes
6. ✅ **Attempt limiting** Maximum 3 verification attempts

## Differences Between sent-otp and resend-otp

| Feature | sent-otp | resend-otp |
|---------|----------|------------|
| Purpose | First-time OTP request | Subsequent OTP requests |
| Response Message | "OTP has been sent successfully to your phone" | "A new OTP has been sent to your phone" |
| Rate Limit | Shared (3/hour) | Shared (3/hour) |
| Old OTP Handling | Invalidates old OTPs | Invalidates old OTPs |
| Use Case | Initial authentication | Didn't receive / OTP expired |

**Note:** Functionally, both endpoints work the same way. The main difference is semantic - use `sent-otp` for the initial request and `resend-otp` when the user needs another code.

## Testing

### Test Case 1: Basic Resend Flow

```bash
# 1. Send initial OTP
POST /api/sent-otp
{ "phone": "+855964519228" }
→ 200 OK

# 2. Resend OTP (old one becomes invalid)
POST /api/resend-otp
{ "phone": "+855964519228" }
→ 200 OK

# 3. Verify with NEW OTP
POST /api/verify-otp
{ "phone": "+855964519228", "otp": "1234" }
→ 200 OK (with tokens)
```

### Test Case 2: Rate Limiting

```bash
# Request 1
POST /api/resend-otp → 200 OK

# Request 2
POST /api/resend-otp → 200 OK

# Request 3
POST /api/resend-otp → 200 OK

# Request 4 (within same hour)
POST /api/resend-otp → 429 Too Many Requests
```

### Test Case 3: Invalid Phone

```bash
POST /api/resend-otp
{ "phone": "964519228" }
→ 400 Bad Request
```

## Common Issues & Solutions

### Issue 1: "Too many requests"

**Cause:** Exceeded 3 OTP requests per hour

**Solution:** Wait for the rate limit to reset (1 hour from first request)

### Issue 2: "Failed to send OTP"

**Cause:** SMS provider (Plasgate) is down or unreachable

**Solution:** 
- Check Plasgate service status
- Verify environment variables are set correctly
- Check network connectivity

### Issue 3: Old OTP still works

**Cause:** This shouldn't happen - resend automatically invalidates old OTPs

**Solution:** 
- Check database to ensure old OTPs have `consumedAt: null` set properly
- Verify `createOTP()` is deleting old records

## Environment Variables Required

```env
# Plasgate SMS Provider
PLASGATE_SECRET=your_plasgate_secret
PLASGATE_SENDER=your_sender_name
PLASGATE_BASE_URL=https://api.plasgate.com

# Database
DATABASE_URL=postgresql://...
```

## Related Endpoints

- [`POST /api/sent-otp`](./OTP_FIXES_SUMMARY.md) - Initial OTP request
- [`POST /api/verify-otp`](./OTP_FIXES_SUMMARY.md) - Verify OTP and authenticate
- [`POST /api/refresh-token`](./ROLE_SWITCHING_GUIDE.md) - Refresh access token

## Best Practices

1. **Add a cooldown timer** in your UI (30-60 seconds) before allowing resend
2. **Show remaining attempts** to help users understand rate limits
3. **Display OTP expiration** time to set user expectations
4. **Provide feedback** when OTP is sent successfully
5. **Handle rate limit errors** gracefully with clear messaging
6. **Log resend attempts** for fraud detection and analytics

## Monitoring Recommendations

Track these metrics:
- Resend request rate per user
- SMS delivery success rate
- Rate limit hit frequency
- Average time between send and resend

These can help identify:
- SMS delivery issues
- User experience problems
- Potential abuse patterns
