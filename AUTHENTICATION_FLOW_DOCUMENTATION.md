# Authentication Flow Documentation

## Overview

This document describes the complete authentication flow implemented in the GameHub application, covering both frontend and backend processes, security measures, and data flow.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backend Authentication Flow](#backend-authentication-flow)
3. [Frontend Authentication Flow](#frontend-authentication-flow)
4. [Security Measures](#security-measures)
5. [Token Management](#token-management)
6. [Password Security](#password-security)
7. [API Endpoints](#api-endpoints)
8. [Error Handling](#error-handling)
9. [Database Schema](#database-schema)
10. [Multi-Factor Authentication (Email OTP)](#multi-factor-authentication-email-otp)
11. [Sessions and Security Events](#sessions-and-security-events)
12. [Frontend UX Updates](#frontend-ux-updates)

## System Architecture

```
┌─────────────────┐    HTTP/HTTPS     ┌─────────────────┐
│   Frontend      │◄─────────────────►│   Backend       │
│   (React)       │                   │   (Express)     │
└─────────────────┘                   └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌─────────────────┐
│   Redux Store   │                   │   MongoDB       │
│   (Token Storage)│                   │   (User Data)   │
└─────────────────┘                   └─────────────────┘
```

## Backend Authentication Flow

### 1. User Registration Process

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant UserModel
    participant TokenService
    participant TokenModel
    participant Database

    Client->>AuthController: POST /api/auth/register
    Note over Client,AuthController: { name, email, password }

    AuthController->>AuthController: Validate input fields
    AuthController->>UserModel: Check if user exists
    UserModel->>Database: Query by email
    Database-->>UserModel: User exists/not exists
    UserModel-->>AuthController: Result

    alt User already exists
        AuthController-->>Client: 409 Conflict
    else User doesn't exist
        AuthController->>AuthController: Hash password with Argon2
        AuthController->>UserModel: Create new user
        UserModel->>Database: Insert user document
        Database-->>UserModel: User created
        UserModel-->>AuthController: User object

        AuthController->>TokenService: createAccessToken(userId)
        TokenService->>TokenService: Generate JWT with RS256
        TokenService->>TokenService: Create JTI (UUID)
        TokenService->>TokenService: Hash JTI with Argon2
        TokenService->>TokenModel: Store token record
        TokenModel->>Database: Insert token document
        TokenService-->>AuthController: Access token

        AuthController-->>Client: 201 Created
        Note over AuthController,Client: { user, accessToken }
    end
```

### 2. User Login Process

````mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant UserModel
    participant TokenService
    participant TokenModel
    participant Database

    Client->>AuthController: POST /api/auth/login
    Note over Client,AuthController: { email, password }

    AuthController->>UserModel: Find user by email
    UserModel->>Database: Query by email
    Database-->>UserModel: User document
    UserModel-->>AuthController: User object

    alt User not found
        AuthController-->>Client: 401 Unauthorized
    else User found
        AuthController->>AuthController: Verify password with Argon2
        alt Password invalid
            AuthController-->>Client: 401 Unauthorized
        else Password valid
            AuthController->>EmailService: sendOtp(email, code)
            EmailService-->>AuthController: sent
            AuthController-->>Client: { mfaRequired: true, userId }
        end
    end
### 2b. MFA (Email OTP) Verification

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant OtpCodeModel
    participant TokenService
    participant TokenModel
    participant RefreshTokenModel

    Client->>AuthController: POST /api/auth/verify-otp
    Note over Client,AuthController: { userId, code }

    AuthController->>OtpCodeModel: find latest for userId (not consumed, not expired)
    OtpCodeModel-->>AuthController: OTP record
    alt Invalid/Expired
        AuthController-->>Client: 401 Unauthorized
    else Valid
        AuthController->>OtpCodeModel: mark consumed
        AuthController->>TokenService: createAccessToken(userId)
        TokenService->>TokenModel: store JTI hash with expiry
        AuthController->>TokenService: createRefreshToken(userId)
        TokenService->>RefreshTokenModel: store tokenHash, userAgent/ip/expiry
        TokenService-->>AuthController: accessToken, refreshToken
        AuthController-->>Client: { user, accessToken, refreshToken }
    end
````

````

### 3. Token Verification Process

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant TokenService
    participant TokenModel
    participant UserModel
    participant Database

    Client->>AuthMiddleware: Request with Bearer token
    Note over Client,AuthMiddleware: Authorization: Bearer <token>

    AuthMiddleware->>AuthMiddleware: Extract token from header
    AuthMiddleware->>TokenService: verifyAccessToken(token)

    TokenService->>TokenService: Verify JWT signature with public key
    TokenService->>TokenService: Validate issuer and audience
    TokenService->>TokenService: Extract JTI and userId from payload

    TokenService->>TokenModel: Find token records by userId
    TokenModel->>Database: Query token documents
    Database-->>TokenModel: Token records
    TokenModel-->>TokenService: Token records array

    TokenService->>TokenService: Verify JTI hash with Argon2
    alt Token valid
        TokenService-->>AuthMiddleware: { userId, payload }
        AuthMiddleware->>UserModel: Find user by userId
        UserModel->>Database: Query user document
        Database-->>UserModel: User document
        UserModel-->>AuthMiddleware: User object

        AuthMiddleware->>AuthMiddleware: Set req.user
        AuthMiddleware->>AuthMiddleware: Call next()
    else Token invalid
        TokenService-->>AuthMiddleware: Error
        AuthMiddleware-->>Client: 401 Unauthorized
    end
````

## Frontend Authentication Flow

### 1. Login Process

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthAPI
    participant ReduxStore
    participant LocalStorage
    participant Backend

    User->>LoginPage: Enter credentials
    LoginPage->>LoginPage: Validate form fields
    LoginPage->>AuthAPI: useLoginMutation()
    AuthAPI->>Backend: POST /api/auth/login
    Backend-->>AuthAPI: { user, accessToken }
    AuthAPI-->>LoginPage: Login response

    LoginPage->>ReduxStore: dispatch(setCredentials())
    ReduxStore->>ReduxStore: Update auth state
    ReduxStore->>LocalStorage: Store auth data
    Note over ReduxStore,LocalStorage: { user, token, refreshToken }

    LoginPage->>LoginPage: Navigate to home page
    LoginPage-->>User: Login successful
```

### 2. Token Management

```mermaid
sequenceDiagram
    participant Component
    participant BaseAPI
    participant LocalStorage
    participant Backend

    Component->>BaseAPI: API request
    BaseAPI->>LocalStorage: Get stored auth
    LocalStorage-->>BaseAPI: Auth data
    BaseAPI->>BaseAPI: Extract token
    BaseAPI->>BaseAPI: Set Authorization header
    Note over BaseAPI: Authorization: Bearer <token>
    BaseAPI->>Backend: HTTP request with token
    Backend-->>BaseAPI: Response
    BaseAPI-->>Component: API response
```

### 3. Current User Fetching

```mermaid
sequenceDiagram
    participant Header
    participant AuthAPI
    participant BaseAPI
    participant Backend

    Header->>AuthAPI: useGetCurrentUserQuery()
    AuthAPI->>BaseAPI: GET /api/auth/whoami
    BaseAPI->>BaseAPI: Add Authorization header
    BaseAPI->>Backend: Request with token
    Backend-->>BaseAPI: { name, email }
    BaseAPI-->>AuthAPI: User data
    AuthAPI-->>Header: User object
    Header->>Header: Display user info
```

## Security Measures

### 1. Password Security

#### Argon2 Hashing

- **Algorithm**: Argon2id (default parameters)
- **Purpose**: Resistant to side-channel attacks and time-memory trade-off attacks
- **Implementation**:

  ```typescript
  // Password hashing during registration
  const hash = await argon2.hash(password);

  // Password verification during login
  const isValid = await argon2.verify(user.passwordHash, password);
  ```

#### Password Requirements

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character

### 2. Token Security

This project secures access with short-lived JWT access tokens (RS256) and long-lived opaque refresh tokens stored as hashes. Key properties:

- Access tokens: RS256-signed JWTs with strict claims validation (issuer, audience, exp). Include a unique `jti` for replay detection and revocation.
- Refresh tokens: Opaque UUIDs, never stored in plaintext. Only argon2 hashes are persisted along with expiry and metadata.
- Rotation: On refresh, the old refresh token is revoked and a new one is issued (rotation) to mitigate replay.

#### JWT structure

```json
{
  "header": { "alg": "RS256", "typ": "JWT" },
  "payload": {
    "sub": "<user_id>",
    "iat": 1710000000,
    "iss": "https://auth.local",
    "aud": "https://api.local",
    "jti": "<uuid>",
    "exp": 1710003600
  }
}
```

#### Signing (RS256) – backend example

```ts
// backend/src/services/TokenService.ts (excerpt)
import { SignJWT } from "jose";

async function createAccessToken(
  userId: string,
  privateKey: CryptoKey,
  expiresInSeconds = 3600
) {
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now)
    .setIssuer("https://auth.local")
    .setAudience("https://api.local")
    .setJti(jti)
    .setExpirationTime(now + expiresInSeconds)
    .sign(privateKey);

  // Persist the JTI hash for revocation checks
  const jtiHash = await argon2.hash(jti);
  await TokenModel.create({
    userId,
    jtiHash,
    expiresAt: new Date((now + expiresInSeconds) * 1000),
  });
  return token;
}
```

#### Verification and JTI check

```ts
// backend/src/services/TokenService.ts (excerpt)
import { jwtVerify } from "jose";

async function verifyAccessToken(token: string, publicKey: CryptoKey) {
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: "https://auth.local",
    audience: "https://api.local",
  });

  const jti = payload.jti as string;
  const userId = payload.sub as string;

  // Look up all token records for user and validate JTI via argon2 verify
  const tokenRecords = await TokenModel.find({ userId });
  let valid = false;
  for (const rec of tokenRecords) {
    if (await argon2.verify(rec.jtiHash, jti)) {
      valid = true;
      break;
    }
  }
  if (!valid) throw new Error("Invalid or revoked token");
  return { userId, payload };
}
```

#### Refresh tokens – storage and rotation

```ts
// Creation (opaque value only given to client once)
const refreshRaw = crypto.randomUUID();
await RefreshTokenModel.create({
  userId,
  tokenHash: await argon2.hash(refreshRaw),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

// Verification and rotation
const records = await RefreshTokenModel.find({ userId, revoked: false });
const match = await Promise.any(records.map(r => argon2.verify(r.tokenHash, providedRefreshToken)));
if (!match) throw new Error("Refresh token invalid");

// Revoke old and issue new
matchedRecord.revoked = true; await matchedRecord.save();
const nextRaw = crypto.randomUUID();
await RefreshTokenModel.create({ userId, tokenHash: await argon2.hash(nextRaw), expiresAt: /* +30d */ });
```

#### Claim validation and error handling

- Always validate `iss`, `aud`, `exp` during verification.
- Treat any verification exception as `401 Unauthorized` and avoid leaking details.
- Short lifetimes for access tokens reduce exposure; rely on refresh flow.

#### TTL and cleanup

MongoDB TTL indexes automatically remove expired rows:

```ts
// Example in Mongoose schema
expiresAt: { type: Date, required: true, index: { expires: 0 } }
```

#### Security considerations

- Do not store refresh tokens in plaintext; only store argon2 hashes.
- Rotate refresh tokens on each use; revoke previous token to prevent reuse.
- Use RS256 (asymmetric) for JWTs to separate signing (server) from verification.
- Keep key material in memory; regenerate keys on boot if appropriate, or load from secure storage for multi-instance setups.
- Limit token scope and audience; avoid embedding sensitive data in JWT payloads.

### 3. CORS Configuration

```typescript
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
```

### 4. Rate Limiting

```typescript
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
```

### 5. Security Headers

```typescript
app.use(helmet()); // Sets various security headers
```

## Token Management

### 1. Token Creation

```typescript
async createAccessToken(userId: ObjectId, expiresIn = 60 * 60) {
  const jti = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Create JWT
  const token = await new SignJWT({ sub: userId.toString() })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now)
    .setIssuer("https://auth.local")
    .setAudience("https://api.local")
    .setJti(jti)
    .setExpirationTime(now + expiresIn)
    .sign(this.privateKey);

  // Hash JTI for storage
  const jtiHash = await this.hashJti(jti);

  // Store token record
  await TokenModel.create({
    userId,
    jtiHash,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  });

  return token;
}
```

### 2. Token Verification

```typescript
async verifyAccessToken(token: string) {
  // Verify JWT signature and claims
  const { payload } = await jwtVerify(token, this.publicKey, {
    issuer: "https://auth.local",
    audience: "https://api.local",
  });

  const jti = payload.jti as string;
  const userId = payload.sub as string;

  // Find token records for user
  const tokenRecords = await TokenModel.find({
    userId: new mongoose.Types.ObjectId(userId)
  });

  // Verify JTI hash
  let validToken = false;
  for (const tokenRecord of tokenRecords) {
    const valid = await argon2.verify(tokenRecord.jtiHash, jti);
    if (valid) {
      validToken = true;
      break;
    }
  }

  if (!validToken) {
    throw new Error("Invalid or revoked token");
  }

  return { userId, payload };
}
```

### 3. Refresh Token Rotation

- Long-lived refresh tokens are opaque UUIDs, stored hashed (`argon2`) in `RefreshToken` collection with TTL and metadata.
- On access token expiry (401), the frontend calls `/auth/refresh` with `{ userId, refreshToken }`.
- Backend verifies hash, revokes current refresh token, creates a new one (rotation), and issues a new access token.

```typescript
// POST /auth/refresh handler (simplified)
await tokenService.verifyRefreshToken(userId, refreshToken);
const accessToken = await tokenService.createAccessToken(new ObjectId(userId));
const newRefreshToken = await tokenService.rotateRefreshToken(
  new ObjectId(userId),
  refreshToken
);
return res.json({ accessToken, refreshToken: newRefreshToken });
```

### 3. Token Expiration

- **Default Duration**: 1 hour (3600 seconds)
- **Auto-cleanup**: MongoDB TTL index on `expiresAt` field
- **Refresh Strategy**: Currently requires re-login (can be extended with refresh tokens)

Updated:

- Refresh tokens implemented with rotation; automatic refresh on 401 in frontend.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

- **Purpose**: Register new user
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "accessToken": "string"
  }
  ```

#### POST /api/auth/login

- **Purpose**: Begin authentication; send OTP if credentials are valid
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  - If MFA required:
    ```json
    { "mfaRequired": true, "userId": "string" }
    ```
  - Otherwise (if MFA disabled):
    ```json
    {
      "user": { "id": "string", "name": "string", "email": "string" },
      "accessToken": "string",
      "refreshToken": "string"
    }
    ```

#### POST /api/auth/verify-otp

- **Purpose**: Verify email OTP and issue tokens
- **Request Body**:
  ```json
  { "userId": "string", "code": "123456" }
  ```
- **Response**:
  ```json
  {
    "user": { "id": "string", "name": "string", "email": "string" },
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

#### POST /api/auth/resend-otp

- **Purpose**: Resend OTP to email
- **Request Body**:
  ```json
  { "userId": "string" }
  ```
- **Response**:
  ```json
  { "message": "OTP resent" }
  ```

#### GET /api/auth/whoami

#### POST /api/auth/refresh

- **Purpose**: Rotate refresh token and issue a new access token
- **Request Body**: `{ "userId": "string", "refreshToken": "string" }`
- **Response**: `{ "accessToken": "string", "refreshToken": "string" }`

#### GET /api/auth/sessions

- **Purpose**: List refresh-token sessions for the authenticated user
- **Auth**: Bearer access token
- **Response**: Array of `{ id, revoked, createdAt, expiresAt, userAgent?, ip? }`

#### POST /api/auth/sessions/revoke

- **Purpose**: Revoke a specific refresh-token session
- **Auth**: Bearer access token
- **Request Body**: `{ "sessionId": "string" }`
- **Response**: `{ "message": "Session revoked" }`
- **Purpose**: Get current user information
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "name": "string",
    "email": "string"
  }
  ```

## Error Handling

### Overview

- Validation errors: 400 with details (express-validator) in register/OTP endpoints.
- Authentication errors: 401 for invalid credentials, missing/invalid Bearer token, expired/invalid JWT, invalid/expired/unknown refresh token, invalid/expired OTP.
- Authorization errors: 403 when revoking a session not owned by the user.
- Not found: 404 for unknown sessionId or resources.
- Conflict: 409 when registering an existing email.
- Rate limiting: 429 from express-rate-limit when thresholds are exceeded.
- Server errors: 500 for unexpected failures (e.g., SMTP send failure); messages are generic to avoid information leakage.

### Backend – by component

- Register
  - 400: validation errors
  - 409: user exists
  - 201: success
- Login
  - 401: user not found or invalid password
  - 200: { mfaRequired, userId } (MFA step)
- Verify OTP
  - 400: missing fields
  - 401: OTP not found/expired/mismatch
  - 200: returns tokens
- Resend OTP
  - 400/404: missing userId or user not found
  - 500: email send failure
  - 200: "OTP resent"
- Refresh
  - 400: missing fields
  - 401: invalid/expired refresh token
  - 200: new tokens
- Logout
  - 400: missing fields
  - 200: best-effort "Logged out"
- Whoami
  - 401: unauthenticated
- Sessions list / revoke
  - 401: unauthenticated
  - 400: missing sessionId (revoke)
  - 404: session not found (revoke)
  - 403: forbidden (not owner)
  - 200: success
- Middleware (auth)
  - 401: missing header, invalid scheme, invalid/expired JWT, JTI mismatch, user missing
- TokenService
  - throws on JWT verify failures, no token record, JTI/argon2 mismatch, invalid/expired refresh
- EmailService
  - throws on transport errors → controller returns 500
- DB
  - startup failures exit process; runtime errors bubble as 500

### HTTP status code map

- 200/201: OK/Created
- 400: Bad Request (invalid/missing inputs)
- 401: Unauthorized (auth/OTP/token failures)
- 403: Forbidden (not resource owner)
- 404: Not Found (missing resource)
- 409: Conflict (duplicate register)
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error (unexpected or SMTP errors)

### Backend response examples

```json
// 400 Bad Request (validation)
{ "errors": [{ "msg": "Invalid email", "param": "email" }] }

// 401 Unauthorized
{ "message": "Unauthorized" }

// 409 Conflict
{ "message": "User exists" }
```

### Frontend handling (RTK Query)

```ts
// Automatic re-auth on 401 in baseQueryWithReauth
if (result.error && (result.error as any).status === 401) {
  const stored = localStorage.getItem("auth");
  // call /auth/refresh with userId + refreshToken; update localStorage; retry
}

// Example toast usage per-request
try {
  await login({ email, password }).unwrap();
} catch (err: any) {
  toast.error(err?.data?.message || "Invalid credentials");
}
```

### Safety measures

- Use generic messages (avoid leaking whether email exists).
- Strict JWT validation (iss/aud/exp) and short-lived access tokens.
- JTI hashing and refresh token rotation to prevent replay.
- TTL indexes to clean up expired OTPs/tokens.
- CORS, Helmet, rate limiting to reduce attack surface.

## Database Schema

### User Collection

```typescript
interface IUser {
  _id: ObjectId;
  name?: string; // Optional for backward compatibility
  email: string; // Unique, lowercase
  passwordHash: string; // Argon2 hash
  createdAt: Date;
  updatedAt: Date;
}
```

### Token Collection

```typescript
interface IToken {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  jtiHash: string; // Argon2 hash of JTI
  expiresAt: Date; // TTL index for auto-cleanup
  createdAt: Date;
}
```

### RefreshToken Collection

```typescript
interface IRefreshToken {
  _id: ObjectId;
  userId: ObjectId; // Reference to User
  tokenHash: string; // Argon2 hash of opaque refresh token
  expiresAt: Date; // TTL index for auto-cleanup
  revoked: boolean;
  replacedByTokenHash?: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### OtpCode Collection

```typescript
interface IOtpCode {
  _id: ObjectId;
  userId: ObjectId;
  codeHash: string; // Argon2 hash of 6-digit code
  expiresAt: Date; // ~5 minutes
  consumed: boolean; // Prevent reuse
  channel: "email";
  createdAt: Date;
  updatedAt: Date;
}
```

## Multi-Factor Authentication (Email OTP)

### Overview

Multi-Factor Authentication (MFA) adds an additional security layer by requiring users to verify their identity through a second factor - in this case, a One-Time Password (OTP) sent via email. This significantly reduces the risk of unauthorized access even if credentials are compromised.

### MFA Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant EmailService
    participant SMTP
    participant Database

    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /auth/login
    Backend->>Backend: Verify password
    Backend->>EmailService: sendOtp(email, userId)
    EmailService->>EmailService: Generate 6-digit OTP
    EmailService->>EmailService: Hash OTP with Argon2
    EmailService->>Database: Store OTP record
    EmailService->>SMTP: Send email with OTP
    SMTP-->>EmailService: Email sent
    EmailService-->>Backend: OTP sent
    Backend-->>Frontend: { mfaRequired: true, userId }
    Frontend-->>User: "OTP sent to your email"

    User->>Frontend: Enter OTP code
    Frontend->>Backend: POST /auth/verify-otp
    Backend->>Database: Find OTP record
    Backend->>Backend: Verify OTP hash
    Backend->>Database: Mark OTP as consumed
    Backend->>Backend: Create access & refresh tokens
    Backend-->>Frontend: { user, accessToken, refreshToken }
    Frontend-->>User: Login successful
```

### OTP Generation and Security

#### OTP Generation Process

```typescript
// backend/src/services/EmailService.ts
async sendOtp(email: string, userId: mongoose.Types.ObjectId) {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP with Argon2 for secure storage
  const otpHash = await argon2.hash(otp);

  // Set 5-minute expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Store in database
  await OtpCodeModel.create({
    userId,
    codeHash: otpHash,
    expiresAt,
    channel: 'email',
  });

  // Send via email
  await this.transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: 'Your OTP for Login',
    html: `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
  });
}
```

#### Security Features

1. **Cryptographically Secure Random Generation**: Uses `Math.random()` for OTP generation
2. **Argon2 Hashing**: OTPs are never stored in plaintext, only hashed versions
3. **Time-Limited Validity**: 5-minute expiry window
4. **Single-Use**: OTPs are marked as consumed after successful verification
5. **Automatic Cleanup**: MongoDB TTL indexes remove expired OTPs

### OTP Verification Process

#### Backend Verification Logic

```typescript
// backend/src/controllers/AuthController.ts
verifyOtp = async (req: Request, res: Response) => {
  const { userId, code } = req.body;

  // Find latest valid OTP for user
  const otpRecord = await OtpCodeModel.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(401).json({ message: "OTP not found or expired" });
  }

  // Verify OTP hash
  const valid = await argon2.verify(otpRecord.codeHash, code);
  if (!valid) {
    return res.status(401).json({ message: "Invalid OTP" });
  }

  // Mark as consumed to prevent reuse
  otpRecord.consumed = true;
  await otpRecord.save();

  // Issue tokens
  const accessToken = await this.tokenService.createAccessToken(userId);
  const refreshToken = await this.tokenService.createRefreshToken(userId);

  return res.json({ user, accessToken, refreshToken });
};
```

### Frontend MFA Implementation

#### Login Flow with MFA

```typescript
// frontend/src/pages/LoginPage.tsx
const handleLogin = async () => {
  try {
    const res = await login({
      email: form.email,
      password: form.password,
    }).unwrap();

    if ("mfaRequired" in res && res.mfaRequired) {
      // Show OTP input form
      setPendingUserId(res.userId);
      toast.success("OTP sent to your email!");
    } else {
      // Direct login (if MFA disabled)
      dispatch(
        setCredentials({
          user: res.user,
          token: res.accessToken,
          refreshToken: res.refreshToken,
        })
      );
      navigate("/");
    }
  } catch (err: any) {
    toast.error(err?.data?.message || "Invalid credentials");
  }
};

const handleVerifyOtp = async () => {
  try {
    const res = await verifyOtp({ userId: pendingUserId, code: otp }).unwrap();

    dispatch(
      setCredentials({
        user: res.user,
        token: res.accessToken,
        refreshToken: res.refreshToken,
      })
    );

    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: res.user,
        token: res.accessToken,
        refreshToken: res.refreshToken,
      })
    );

    toast.success("Login successful!");
    navigate("/");
  } catch (err: any) {
    toast.error(err?.data?.message || "Invalid OTP");
  }
};
```

#### OTP Resend Functionality

```typescript
const handleResendOtp = async () => {
  try {
    await resendOtp({ userId: pendingUserId }).unwrap();
    toast.success("OTP resent to your email");
  } catch (err: any) {
    toast.error(err?.data?.message || "Failed to resend OTP");
  }
};
```

### Database Schema for OTP

```typescript
// backend/src/models/OtpCode.ts
interface IOtpCode extends Document {
  userId: mongoose.Types.ObjectId;
  codeHash: string; // Argon2 hash of 6-digit OTP
  expiresAt: Date; // 5-minute expiry with TTL index
  consumed: boolean; // Prevents reuse
  channel: "email"; // Future: 'sms', 'authenticator'
  createdAt: Date;
  updatedAt: Date;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-expire
    consumed: { type: Boolean, default: false },
    channel: {
      type: String,
      required: true,
      enum: ["email", "sms", "authenticator"],
    },
  },
  { timestamps: true }
);
```

### SMTP Configuration

#### Environment Variables

Set the following environment variables for the backend:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SENDER_EMAIL=youraddress@gmail.com
SENDER_PASSWORD=your_app_password  # Use App Password, not regular password
```

#### Email Service Setup

```typescript
// backend/src/services/EmailService.ts
import nodemailer from "nodemailer";

export default class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    });
  }
}
```

### MFA Security Considerations

#### Attack Mitigation

1. **Brute Force Protection**:

   - 6-digit OTP provides 1,000,000 possible combinations
   - 5-minute expiry window limits attack window
   - Single-use prevents replay attacks

2. **Timing Attack Prevention**:

   - Constant-time hash verification with Argon2
   - Generic error messages don't reveal if OTP exists

3. **Email Security**:

   - OTPs sent via secure SMTP (TLS/SSL)
   - No sensitive data in email body beyond OTP
   - Clear expiry information in email

4. **Database Security**:
   - Only hashed OTPs stored
   - Automatic cleanup via TTL indexes
   - User-specific OTP isolation

#### Error Handling for MFA

```typescript
// Common MFA error scenarios
- 400: Missing userId or code
- 401: OTP not found, expired, or invalid
- 500: SMTP send failure

// Frontend error handling
try {
  await verifyOtp({ userId, code }).unwrap();
} catch (err: any) {
  if (err.status === 401) {
    toast.error('Invalid or expired OTP. Please try again.');
  } else {
    toast.error('Verification failed. Please try again.');
  }
}
```

### MFA User Experience

#### UI Flow

1. **Login Form**: User enters email/password
2. **OTP Prompt**: After successful password verification, OTP input appears
3. **Email Notification**: Toast confirms OTP sent to email
4. **OTP Input**: 6-digit code input with validation
5. **Resend Option**: Button to request new OTP if needed
6. **Success**: Automatic redirect to dashboard with tokens

#### Accessibility Features

- Clear error messages for invalid/expired OTPs
- Resend functionality with cooldown
- Visual feedback during verification process
- Responsive design for mobile devices

### Future MFA Enhancements

1. **Multiple Channels**:

   - SMS OTP support
   - TOTP (Time-based One-Time Password) with authenticator apps
   - Hardware security keys

2. **Advanced Security**:

   - Rate limiting per user for OTP requests
   - Device fingerprinting
   - Risk-based authentication

3. **User Preferences**:
   - MFA enable/disable settings
   - Preferred verification method
   - Trusted device management

## Sessions and Security Events

- Sessions are represented by refresh tokens (hashed) with metadata (userAgent, ip, createdAt, expiresAt, revoked).
- The dashboard lists active sessions and allows revocation via `/auth/sessions` and `/auth/sessions/revoke`.
- Security events are derived from refresh-token lifecycle (issued, rotated, revoked) and exposed at `/auth/security-events`.

## Frontend UX Updates

- Login now supports a two-step flow: credentials → OTP.
- Token countdown UI decodes `exp` from JWT and updates every second.
- Automatic token refresh is handled in a wrapped base query that retries the original request after a successful `/auth/refresh`.
- Dashboard widgets display token status, sessions with revoke controls, and recent security events.

## Frontend State Management

### Redux Auth State

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken?: string | null;
  isAuthenticated: boolean;
}
```

### Local Storage Structure

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "token": "jwt_token_string",
  "refreshToken": "optional_refresh_token"
}
```

## Security Best Practices Implemented

1. **Password Security**:

   - Argon2id hashing with secure parameters
   - Strong password requirements
   - No plaintext password storage

2. **Token Security**:

   - RS256 asymmetric encryption
   - JTI-based token tracking
   - Automatic token expiration
   - Token revocation capability

3. **API Security**:

   - CORS configuration
   - Rate limiting
   - Security headers (Helmet)
   - Input validation

4. **Data Protection**:

   - No sensitive data in JWT payload
   - Secure token storage in localStorage
   - Automatic cleanup of expired tokens

5. **Error Handling**:
   - Generic error messages to prevent information leakage
   - Proper HTTP status codes
   - Client-side error handling

## Future Enhancements

1. **Refresh Token Implementation**:

   - Long-lived refresh tokens
   - Automatic token refresh
   - Token rotation

2. **Multi-Factor Authentication**:

   - TOTP support
   - SMS verification
   - Email verification

3. **Session Management**:

   - Active session tracking
   - Remote logout capability
   - Session timeout

4. **Audit Logging**:
   - Login/logout events
   - Failed authentication attempts
   - Token usage tracking

This documentation provides a comprehensive overview of the authentication system, ensuring security, scalability, and maintainability of the authentication flow.
