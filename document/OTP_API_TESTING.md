# OTP API Testing Guide

Quick reference for testing the complete OTP authentication flow.

## Prerequisites

- Server running on `http://localhost:3000`
- Valid Cambodian phone number: `+855XXXXXXXX`
- Plasgate SMS service configured

## Complete Flow Test

### Step 1: Send Initial OTP

```bash
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP has been sent successfully to your phone"
}
```

### Step 2: Resend OTP (Optional)

If user didn't receive the OTP or it expired:

```bash
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "A new OTP has been sent to your phone"
}
```

**Note:** Previous OTP is now invalid!

### Step 3: Verify OTP

```bash
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228",
    "otp": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": "cm5abc123",
    "phone": "+855964519228",
    "roles": []
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123def456..."
}
```

## Error Testing

### Test 1: Invalid Phone Format

```bash
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "964519228"
  }'
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Invalid phone number format",
  "details": "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits"
}
```

### Test 2: Rate Limit

```bash
# Send request 1
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# Send request 2
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# Send request 3
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# Send request 4 (should fail)
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'
```

**Expected (4th request):** `429 Too Many Requests`
```json
{
  "error": "Too many requests",
  "details": "Too many OTP requests. Please try again later."
}
```

### Test 3: Invalid OTP

```bash
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228",
    "otp": "9999"
  }'
```

**Expected:** `401 Unauthorized`
```json
{
  "error": "Invalid or expired OTP code",
  "details": "The OTP code is incorrect or has expired. Please request a new code."
}
```

### Test 4: Old OTP After Resend

```bash
# 1. Send initial OTP (let's say it's 1234)
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# 2. Resend OTP (new OTP is 5678, old 1234 is now invalid)
curl -X POST http://localhost:3000/api/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# 3. Try to verify with OLD OTP (should fail)
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228",
    "otp": "1234"
  }'
```

**Expected:** `401 Unauthorized`
```json
{
  "error": "Invalid or expired OTP code",
  "details": "The OTP code is incorrect or has expired. Please request a new code."
}
```

### Test 5: OTP Expiration

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# 2. Wait 6 minutes (OTP expires after 5 minutes)

# 3. Try to verify (should fail)
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+855964519228",
    "otp": "1234"
  }'
```

**Expected:** `401 Unauthorized`
```json
{
  "error": "Invalid or expired OTP code",
  "details": "The OTP code is incorrect or has expired. Please request a new code."
}
```

### Test 6: Maximum Verification Attempts

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/sent-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228"}'

# 2. Wrong attempt 1
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228", "otp": "1111"}'

# 3. Wrong attempt 2
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228", "otp": "2222"}'

# 4. Wrong attempt 3
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228", "otp": "3333"}'

# 5. Fourth attempt (should be blocked even with correct OTP)
curl -X POST http://localhost:3000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+855964519228", "otp": "XXXX"}'
```

**Expected (4th attempt):** `429 Too Many Requests`
```json
{
  "error": "Too many failed attempts",
  "details": "Maximum verification attempts exceeded. Please request a new OTP."
}
```

## Using with Postman

### Import Collection

Create a Postman collection with these endpoints:

1. **Send OTP**
   - Method: `POST`
   - URL: `{{baseUrl}}/api/sent-otp`
   - Body: 
     ```json
     {
       "phone": "{{phone}}"
     }
     ```

2. **Resend OTP**
   - Method: `POST`
   - URL: `{{baseUrl}}/api/resend-otp`
   - Body: 
     ```json
     {
       "phone": "{{phone}}"
     }
     ```

3. **Verify OTP**
   - Method: `POST`
   - URL: `{{baseUrl}}/api/verify-otp`
   - Body: 
     ```json
     {
       "phone": "{{phone}}",
       "otp": "{{otp}}"
     }
     ```

### Environment Variables

```
baseUrl = http://localhost:3000
phone = +855964519228
otp = 1234
```

## Testing Checklist

- [ ] ✅ Send OTP with valid phone number
- [ ] ✅ Receive SMS with OTP code
- [ ] ✅ Verify OTP successfully
- [ ] ✅ Receive access token and refresh token
- [ ] ✅ Resend OTP invalidates old one
- [ ] ✅ Invalid phone format rejected
- [ ] ✅ Rate limit works (max 3 per hour)
- [ ] ✅ Wrong OTP rejected
- [ ] ✅ Expired OTP rejected (after 5 minutes)
- [ ] ✅ Max 3 verification attempts enforced
- [ ] ✅ Old OTP doesn't work after resend
- [ ] ✅ New user created on first verification
- [ ] ✅ Existing user authenticated on subsequent verifications

## Database Verification

Check the database after testing:

```sql
-- Check OTP records
SELECT * FROM "PhoneOtp" 
WHERE phone = '+855964519228' 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- Check user creation
SELECT * FROM "User" 
WHERE phone = '+855964519228';

-- Check refresh tokens
SELECT * FROM "RefreshToken" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE phone = '+855964519228'
);
```

## Common Issues

### Issue: SMS not received

**Check:**
1. Plasgate configuration in `.env`
2. Plasgate service status
3. Phone number format
4. Network connectivity

### Issue: OTP verification fails with correct code

**Check:**
1. Parameter order bug (should be fixed)
2. OTP expiration (5 minutes)
3. Maximum attempts exceeded (3 max)
4. Phone number matches exactly

### Issue: Rate limit hit immediately

**Check:**
1. Previous test runs within last hour
2. Database has old OTP records
3. Clear old records or wait 1 hour

**Clear old records:**
```sql
DELETE FROM "PhoneOtp" WHERE phone = '+855964519228';
```

## Performance Testing

### Load Test Script (Node.js)

```javascript
const sendOTP = async (phone) => {
  const response = await fetch('http://localhost:3000/api/sent-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return response.json();
};

// Test with multiple phone numbers
const phones = [
  '+855964519228',
  '+855964519229',
  '+855964519230',
];

Promise.all(phones.map(sendOTP))
  .then(results => console.log('Results:', results))
  .catch(err => console.error('Error:', err));
```

## Monitoring

Monitor these in production:

1. **OTP Send Rate**
   - Track sends per minute/hour
   - Alert on unusual spikes

2. **Verification Success Rate**
   - Track successful vs failed verifications
   - Alert if success rate drops below threshold

3. **SMS Delivery Rate**
   - Monitor Plasgate response codes
   - Alert on delivery failures

4. **Rate Limit Hits**
   - Track how often rate limits are hit
   - May indicate abuse or UX issues

5. **Resend Frequency**
   - Track resend-to-send ratio
   - High ratio may indicate delivery issues
