# Auth

The Auth module handles user registration, email verification, login sessions, profile management, and password reset flows. PepPlatform uses cookie-based session authentication: after a successful login or email verification, the server sets a `pep_session` cookie that must be sent with subsequent requests.

## Website entry and guest preview

Both `/` and the compatibility address `/welcome` always show Welcome, providing a stable platform link for publications. The dashboard is available at `/dashboard`.

With authentication enabled, guests can explore tool interfaces, browse configuration steps, and fill ordinary form fields. Data access follows account ownership and administrator permissions; research-chat history is scoped to its owning account. Resource-specific links, account settings, and administration require sign-in. Uploads, preflight checks, training, ensemble creation, inference, and AI requests prompt for sign-in before execution; backend authentication and ownership checks remain in force.

Sign-in defaults to `/dashboard`. When initiated from a tool, the internal return address survives sign-in, registration, email verification, and password reset. Ordinary form drafts are stored temporarily in the current tab's `sessionStorage` and removed after restoration. Files, passwords, and API keys are excluded. Users click again to execute after signing in and reselect files as needed. Signing out returns to Welcome and clears personal query caches, chat state, and drafts.

The header uses an Account text menu for profile settings, AI services, and sign-out, with an additional administration entry for admins.

`PEP_AUTH_ENABLED=0` still permits direct local workspace use at `/dashboard`, while `/` continues to show Welcome. Public deployments should keep authentication enabled.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

::: warning Base URL
The local development base URL is `http://127.0.0.1:8081/api`; the Docker deployment uses `http://127.0.0.1:8080/api`. Examples below use the local dev URL.
:::

## POST /api/auth/register

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None
- **Purpose**: Register a new user. Email must be valid and password at least 8 characters; a verification email is sent after registration.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "auth_enabled": true,
  "user": {
    "id": "a1b2c3d4",
    "email": "user@example.com",
    "display_name": "user",
    "email_verified": false,
    "role": "user",
    "status": "active"
  },
  "quota": { "daily_experiment_limit": 10, "daily_concurrent_experiment_limit": 2, "daily_inference_request_limit": 50, "daily_inference_input_limit": 5000 },
  "usage": { "experiments_created": 0, "inference_requests": 0, "inference_inputs": 0 },
  "resource_counts": { "experiments": 0, "models": 0, "datasets": 0, "inference_runs": 0 },
  "verification_sent": true,
  "email": "user@example.com"
}
```

::: tip When SMTP is missing or delivery fails
`verification_sent` is `false` in both cases. In development (`PEP_ENV` not `production`) the response also carries a `debug_code`
field; production disables this fallback by default. An explicit `PEP_AUTH_DEBUG_CODES` overrides that default. See [Environment Variables](../config/environment#auth-session).
:::

## POST /api/auth/verify-email

- **Method**: `POST`
- **Path**: `/api/auth/verify-email`
- **Auth**: None
- **Purpose**: Verify email with a code. On success, creates a session and sets the cookie.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "user@example.com", "code": "123456"}'
```

Request body:

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

Example response excerpt (`200`; values are illustrative): returns an auth payload with `user`, `quota`, and `usage`, and sets the `pep_session` cookie via `Set-Cookie`. Invalid or expired code returns `400`.

## POST /api/auth/resend-verification

- **Method**: `POST`
- **Path**: `/api/auth/resend-verification`
- **Auth**: None
- **Purpose**: Resend the email verification code. Returns `verification_sent: false` if the email is already verified.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Request body:

```json
{ "email": "user@example.com" }
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "auth_enabled": true,
  "user": { "id": "a1b2c3d4", "email": "user@example.com", "email_verified": false, "role": "user", "status": "active" },
  "verification_sent": true,
  "email": "user@example.com"
}
```

## POST /api/auth/login

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None
- **Purpose**: Login with email and password. On success, sets the session cookie. Disabled accounts or unverified emails return `403`.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

Example response excerpt (`200`; values are illustrative): returns an auth payload (with `user`, `quota`, `usage`, `resource_counts`) and sets the cookie. Invalid credentials return `401`.

## POST /api/auth/logout

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth**: No valid session required; clears the supplied cookie
- **Purpose**: Revoke the current session and clear the cookie.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/logout \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "ok": true }
```

## GET /api/auth/me

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Login required
- **Purpose**: Get the current logged-in user info, including quota and usage.

```bash
curl http://127.0.0.1:8081/api/auth/me \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "auth_enabled": true,
  "user": {
    "id": "a1b2c3d4",
    "email": "user@example.com",
    "display_name": "User Name",
    "email_verified": true,
    "role": "user",
    "status": "active"
  },
  "quota": { "daily_experiment_limit": 10, "daily_concurrent_experiment_limit": 2, "daily_inference_request_limit": 50, "daily_inference_input_limit": 5000 },
  "usage": { "experiments_created": 0, "inference_requests": 0, "inference_inputs": 0 },
  "resource_counts": { "experiments": 0, "models": 0, "datasets": 0, "inference_runs": 0 }
}
```

## PATCH /api/auth/profile

- **Method**: `PATCH`
- **Path**: `/api/auth/profile`
- **Auth**: Login required
- **Purpose**: Update the current user's display name (max 40 characters, no control characters).

```bash
curl -X PATCH http://127.0.0.1:8081/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"display_name": "My Name"}'
```

Request body:

```json
{ "display_name": "My Name" }
```

Example response excerpt (`200`; values are illustrative): returns the updated auth payload.

## POST /api/auth/password-reset/request

- **Method**: `POST`
- **Path**: `/api/auth/password-reset/request`
- **Auth**: None
- **Purpose**: Request a password reset code by email. For an accepted request body, returns `200` for both known and unknown emails. Inspect `reset_sent`; the status alone does not establish delivery.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Request body:

```json
{ "email": "user@example.com" }
```

Example response excerpt (`200`; values are illustrative):

```json
{ "ok": true, "reset_sent": true, "email": "user@example.com" }
```

## POST /api/auth/password-reset/confirm

- **Method**: `POST`
- **Path**: `/api/auth/password-reset/confirm`
- **Auth**: None
- **Purpose**: Reset password with a code and a new password (min 8 characters). Invalid or expired code returns `400`.

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456", "password": "newpass456"}'
```

Request body:

```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "newpass456"
}
```

Example response excerpt (`200`; values are illustrative): returns an auth payload. Invalid code returns `400`.

## PATCH /api/auth/preferences

Updates the current account’s locale preference and requires an actual account session, including on deployments with general authentication disabled.

```json
{"preferred_locale": "zh"}
```

`preferred_locale` accepts only `zh` or `en`. Returns an authentication response like `/api/auth/me`; invalid values return 400. This differs from switching language only in the current browser.
