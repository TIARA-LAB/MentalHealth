# Mental Health API — Developer Documentation

Base URL: **`http://localhost:3000/api/v1`**  |  Interactive Swagger UI: **`http://localhost:3000/api/docs`**

> All endpoints require JSON `Content-Type: application/json` unless noted.
> Protected endpoints require an `Authorization: Bearer <accessToken>` header.

---

## 1. Authentication Flow

The API uses **JWT access + refresh tokens**.

| Token | Lifetime | Where used |
|-------|----------|-----------|
| `accessToken` | `15m` | Sent as `Authorization: Bearer <accessToken>` on protected routes |
| `refreshToken` | `7d` | Sent in the **body** of `POST /auth/refresh` to get a new token pair |

**Flow:**
1. Call `POST /auth/register` (or `POST /auth/login`) → receive `{ user, accessToken, refreshToken }`.
2. Store both tokens client-side (e.g., secure storage / memory).
3. Send `accessToken` on every protected call.
4. When the access token expires (401), call `POST /auth/refresh` with the `refreshToken` in the body to get a new pair.
5. On logout / password change / account deletion, all of the user's refresh tokens are revoked → they must log in again.

---

## 2. Common Responses

### Success
- `200 OK` / `201 Created` — body varies per endpoint.

### Errors
The API returns standard HTTP status codes with a JSON error body:

```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "error": "Bad Request"
}
```

| Code | Meaning |
|------|---------|
| `400` | Validation error (whitelist `forbidNonWhitelisted` is on — unknown fields are rejected) |
| `401` | Missing/invalid access token, or wrong credentials |
| `403` | Forbidden (e.g., invalid/revoked refresh token) |
| `404` | Resource not found |
| `409` | Conflict (e.g., email already in use, new password same as old) |
| `429` | Too many requests (rate limit: **10 requests / 60s** per IP) |

---

## 3. Auth Endpoints

### 3.1 Register — `POST /auth/register`

Creates a user and returns tokens.

**Request body:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | yes | must be a valid email |
| `password` | string | yes | min **8** characters |
| `name` | string | no | display name |

```json
{
  "email": "jane.doe@example.com",
  "password": "password123",
  "name": "Jane Doe"
}
```

**Response `201`**
```json
{
  "user": {
    "id": "uuid",
    "email": "jane.doe@example.com",
    "name": "Jane Doe"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

**Errors:** `409` if email already registered.

---

### 3.2 Login — `POST /auth/login`

Authenticates a user and returns tokens.

**Request body:**
| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

```json
{
  "email": "jane.doe@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "user": {
    "id": "uuid",
    "email": "jane.doe@example.com",
    "name": "Jane Doe"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

**Errors:** `401` invalid credentials.

---

### 3.3 Refresh Tokens — `POST /auth/refresh`

Exchanges a valid, non-revoked refresh token for a **new token pair** (rotation — the old refresh token is revoked).

> **Important:** Send the `refreshToken` in the **request body**. Do **not** send the `accessToken` in the `Authorization` header on this call — the server validates any Bearer header token against the *refresh* secret, so an access token in the header would be rejected with a `401`. (Putting the refresh token itself in the header also works, but the body is the canonical way.)

**Request body:**
| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | yes |

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response `200`**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

**Errors:** `401` / `403` if the token is invalid, expired, or revoked.

---

### 3.4 Logout — `POST /auth/logout`

**Auth required:** `Authorization: Bearer <accessToken>`

Revokes **all** active refresh tokens for the authenticated user. No body needed.

**Response `200`**
```json
{
  "message": "Logged out successfully"
}
```

---

## 4. User Endpoints (all require `Authorization: Bearer <accessToken>`)

### 4.1 Get My Profile — `GET /users/me`

Returns the authenticated user's profile.

**Response `200`**
```json
{
  "id": "uuid",
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

> `password` and `deletedAt` are never exposed.

---

### 4.2 Update My Profile — `PATCH /users/me`

Updates the authenticated user's `name` and/or `email` (partial update — only send fields to change).

**Request body:** (all fields optional)
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | no | — |
| `email` | string | no | must be a valid email |

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

**Response `200`** — updated profile (same shape as Get My Profile)

**Errors:** `409` if the email is already in use by another (non-deleted) user; `400` if email is invalid.

---

### 4.3 Change My Password — `PATCH /users/me/password`

Changes the authenticated user's password. **All refresh tokens are revoked** on success (re-login required).

**Request body:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `currentPassword` | string | yes | — |
| `newPassword` | string | yes | min **8** characters; must differ from current |

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

**Response `200`**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:** `401` incorrect current password; `409` new password equals current.

---

### 4.4 Delete My Account — `DELETE /users/me`

Soft-deletes the authenticated user's account and revokes all refresh tokens. No body needed.

**Response `200`**
```json
{
  "message": "Account deleted successfully"
}
```

> After deletion the user can no longer log in. Data is soft-deleted (`deletedAt` set).

---

## 5. Profile Endpoints (all require `Authorization: Bearer <accessToken>`)

> A `Profile` row is auto-created when a user registers. The `streakCount` / `lastCheckInAt` fields are updated by the check-in endpoints.

### 5.1 Get User Profile — `GET /profile`

Returns the authenticated user's profile **and streak details**.

**Response `200`**
```json
{
  "id": "uuid",
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "profile": {
    "bio": "A short bio about me",
    "avatarUrl": "https://example.com/avatar.png",
    "streakCount": 3,
    "lastCheckInAt": "2026-09-07T00:00:00.000Z",
    "preferences": { "theme": "dark", "notificationsEnabled": true },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-09-07T00:00:00.000Z"
  }
}
```

---

### 5.2 Update Profile Settings — `PATCH /profile/settings`

Updates the authenticated user's profile settings (partial update — only send fields to change).

**Request body:** (all fields optional)
| Field | Type | Validation |
|-------|------|-----------|
| `bio` | string | max 500 chars |
| `avatarUrl` | string | — |
| `preferences` | object | arbitrary JSON object |

```json
{
  "bio": "A short bio about me",
  "avatarUrl": "https://example.com/avatar.png",
  "preferences": { "theme": "dark", "notificationsEnabled": true }
}
```

**Response `200`** — updated profile (same shape as Get User Profile).

---

## 6. Check-in Endpoints (all require `Authorization: Bearer <accessToken>`)

### 6.1 Get Check-in History — `GET /check-ins`

Returns all check-in records for the authenticated user, ordered by `date` descending.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "mood": "THREE",
    "notes": "Felt productive and calm today",
    "date": "2026-09-07T00:00:00.000Z",
    "createdAt": "2026-09-07T08:00:00.000Z"
  }
]
```

---

### 6.2 Create Check-in — `POST /check-ins`

Submits a new daily check-in. **One check-in per day** — the `date` is normalized to UTC midnight and is unique per user.

**Request body:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `mood` | string | yes | one of `ONE`, `TWO`, `THREE`, `FOUR`, `FIVE` |
| `notes` | string | no | max 2000 chars |
| `date` | string | no | ISO date (e.g. `2026-09-07`); defaults to today (UTC) |

```json
{
  "mood": "THREE",
  "notes": "Felt productive and calm today",
  "date": "2026-09-07"
}
```

**Response `201`** — the created check-in record (same shape as above).

**Streak behavior:**
- First check-in → `streakCount = 1`
- Check-in on the day **after** the previous one → `streakCount + 1`
- Gap of more than one day → `streakCount` resets to `1`
- `profile.lastCheckInAt` is updated to the new check-in date

**Errors:** `409` Conflict if a check-in already exists for that day; `400` if `mood` is invalid.

---

## 7. Journal Endpoints (all require `Authorization: Bearer <accessToken>`)

### 7.1 List Journal Entries — `GET /journal`

Returns all journal entries written by the authenticated user, ordered by `createdAt` descending.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Morning reflections",
    "content": "Today I felt calm and focused...",
    "mood": "FOUR",
    "tags": ["reflection", "work"],
    "createdAt": "2026-09-07T08:00:00.000Z",
    "updatedAt": "2026-09-07T08:00:00.000Z"
  }
]
```

---

### 7.2 Create Journal Entry — `POST /journal`

Creates a new journal entry.

**Request body:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `title` | string | yes | max 200 chars |
| `content` | string | yes | — |
| `mood` | string | no | one of `ONE`..`FIVE` |
| `tags` | string[] | no | max 10 tags, each max 30 chars |

```json
{
  "title": "Morning reflections",
  "content": "Today I felt calm and focused.",
  "mood": "FOUR",
  "tags": ["reflection", "work"]
}
```

**Response `201`** — the created journal entry (same shape as above).

---

## 8. Quick Reference (Endpoint Summary)

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/api/v1/auth/register` | No | `{ email, password, name? }` |
| POST | `/api/v1/auth/login` | No | `{ email, password }` |
| POST | `/api/v1/auth/refresh` | No* | `{ refreshToken }` |
| POST | `/api/v1/auth/logout` | Bearer | — |
| GET | `/api/v1/users/me` | Bearer | — |
| PATCH | `/api/v1/users/me` | Bearer | `{ name?, email? }` |
| PATCH | `/api/v1/users/me/password` | Bearer | `{ currentPassword, newPassword }` |
| DELETE | `/api/v1/users/me` | Bearer | — |
| GET | `/api/v1/profile` | Bearer | — |
| PATCH | `/api/v1/profile/settings` | Bearer | `{ bio?, avatarUrl?, preferences? }` |
| GET | `/api/v1/check-ins` | Bearer | — |
| POST | `/api/v1/check-ins` | Bearer | `{ mood, notes?, date? }` |
| GET | `/api/v1/journal` | Bearer | — |
| POST | `/api/v1/journal` | Bearer | `{ title, content, mood?, tags? }` |

\* Refresh does not use the `accessToken` — it uses the `refreshToken` in the body. Do not send the `accessToken` in the `Authorization` header on this endpoint.

---

## 9. Postman

Import `postman/mental-health-api.postman_collection.json` into Postman. Scripts auto-save tokens into collection variables `accessToken` and `refreshToken`.

**Suggested test order:**
1. `Login` or `Register`
2. `Get My Profile` → `Update My Profile` → `Change My Password` (all use the saved access token)
3. `Profile` → `Get My Profile` / `Update Profile Settings`
4. `Check-ins` → `Create Check-in` (drives the streak) → `Get Check-in History`
5. `Journal` → `Create Journal Entry` → `Get Journal Entries`
6. `Refresh Tokens` (also updates saved tokens)
7. `Logout` or `Delete My Account`

> **Note:** `Change My Password`, `Delete My Account`, and `Logout` revoke refresh tokens. Call `Refresh Tokens` *before* any of these, and re-`Login` afterward for a fresh pair.
> **Note:** `Create Check-in` returns `409` if the same date is submitted twice. Use a new date (or omit `date` to use today) when re-testing.

---

## 10. Environment / Notes for Frontend Team

- Rate limit: **10 requests per 60 seconds per IP** (global). Handle `429` with backoff.
- CORS is enabled.
- Stricter `ValidationPipe` rejects unknown/extra fields with `400` (`whitelist` + `forbidNonWhitelisted`).
- On `401` from a protected endpoint, the frontend should call `/auth/refresh` to get a new access token, then retry the original request.
- Always send the `refreshToken` in the **body** of `/auth/refresh` (never send the `accessToken` in the `Authorization` header on that call — the refresh strategy validates a Bearer header against the refresh secret).
