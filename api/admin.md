# Admin

The Admin module provides user management, quota adjustments, session control, and audit log queries. All endpoints require admin privileges (`role: admin`); authenticated non-admin access returns `403`; unauthenticated access with authentication enabled returns `401`.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## GET /api/admin/overview

- **Method**: `GET`
- **Path**: `/api/admin/overview`
- **Auth**: Admin required
- **Purpose**: Return the user, workload, and trailing 24-hour security metrics shown on the admin overview.

```bash
curl http://127.0.0.1:8081/api/admin/overview \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "generated_at": "2026-07-20T12:00:00+00:00",
  "usage_date": "2026-07-20",
  "users": {
    "total": 42,
    "active": 39,
    "disabled": 3,
    "unverified": 5,
    "new_last_7_days": 7
  },
  "workload": {
    "experiments_created_today": 18,
    "inference_requests_today": 230,
    "inference_inputs_today": 14500,
    "active_experiments": 4
  },
  "security_24h": {
    "failed_logins": 2,
    "admin_actions": 6,
    "session_revoke_events": 1,
    "user_deletions": 0
  }
}
```

`usage_date` and workload fields ending in `today` use UTC calendar days. Security metrics cover the trailing 24 hours from request time.

## GET /api/admin/users

- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Auth**: Admin required
- **Purpose**: List users with search and filtering by role/status/email-verification, plus pagination.

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `search` | string | empty | Fuzzy search by email/display name |
| `role` | string | empty | `admin` or `user` |
| `status` | string | empty | `active` or `disabled` |
| `email_verified` | bool | empty | Filter by email verification status |
| `sort` | string | `created_at` | Sort field: `created_at`, `display_name`, `email`, `role`, or `status` |
| `order` | string | `desc` | Sort direction: `asc` or `desc` |
| `limit` | int | 50 | Page size, up to 200 |
| `offset` | int | 0 | Offset |

```bash
curl "http://127.0.0.1:8081/api/admin/users?role=user&status=active&limit=20" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns a paginated user list (with `items`, `total`, `limit`, `offset`). Each summary includes quota, current UTC-day usage, and resource counts. Invalid role, status, sort, or order values return `400`.

## GET /api/admin/users/{user_id}

- **Method**: `GET`
- **Path**: `/api/admin/users/{user_id}`
- **Auth**: Admin required
- **Purpose**: Get detailed user info (including resource counts, quota, session counts).

**Path parameters**:

| Param | Description |
| --- | --- |
| `user_id` | User ID |

```bash
curl http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the user detail object. Not found returns `404`.

## PATCH /api/admin/users/{user_id}

- **Method**: `PATCH`
- **Path**: `/api/admin/users/{user_id}`
- **Auth**: Admin required
- **Purpose**: Update a user's role or status. Disabling a user auto-revokes all their sessions. You cannot remove your own admin access.

```bash
curl -X PATCH http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"role": "admin", "status": "active"}'
```

Request body (fields optional):

```json
{ "role": "admin", "status": "active" }
```

Example response excerpt (`200`; values are illustrative): returns the updated user summary. Invalid values return `400`; attempting to remove your own admin access returns `400`; not found returns `404`.

## POST /api/admin/users/{user_id}/revoke-sessions

- **Method**: `POST`
- **Path**: `/api/admin/users/{user_id}/revoke-sessions`
- **Auth**: Admin required
- **Purpose**: Revoke all sessions for a user. You cannot revoke your own sessions.

```bash
curl -X POST http://127.0.0.1:8081/api/admin/users/a1b2c3d4/revoke-sessions \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "user": { "id": "a1b2c3d4", "email": "user@example.com" },
  "revoked_sessions": 3
}
```

Attempting to revoke your own sessions returns `400`; not found returns `404`.

## POST /api/admin/users/{user_id}/resend-verification

- **Method**: `POST`
- **Path**: `/api/admin/users/{user_id}/resend-verification`
- **Auth**: Admin required
- **Purpose**: Resend the email verification code for a user. Already-verified users return `verification_sent: false`.

```bash
curl -X POST http://127.0.0.1:8081/api/admin/users/a1b2c3d4/resend-verification \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "user": { "id": "a1b2c3d4", "email": "user@example.com" },
  "verification_sent": true
}
```

Not found returns `404`.

## DELETE /api/admin/users/{user_id}

- **Method**: `DELETE`
- **Path**: `/api/admin/users/{user_id}`
- **Auth**: Admin required
- **Purpose**: Delete a user (without their resources). You cannot delete yourself. Returns `409` if the user still has resources.

```bash
curl -X DELETE http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "user_id": "a1b2c3d4",
  "email": "user@example.com",
  "deleted": true,
  "deleted_counts": { "sessions": 3 }
}
```

Attempting to delete yourself returns `400`; user has resources returns `409`; not found returns `404`.

## PATCH /api/admin/users/{user_id}/quotas

- **Method**: `PATCH`
- **Path**: `/api/admin/users/{user_id}/quotas`
- **Auth**: Admin required
- **Purpose**: Update a user's quota limits.

```bash
curl -X PATCH http://127.0.0.1:8081/api/admin/users/a1b2c3d4/quotas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "daily_experiment_limit": 20,
    "daily_concurrent_experiment_limit": 4,
    "daily_inference_request_limit": 100,
    "daily_inference_input_limit": 10000
  }'
```

Request body:

```json
{
  "daily_experiment_limit": 20,
  "daily_concurrent_experiment_limit": 4,
  "daily_inference_request_limit": 100,
  "daily_inference_input_limit": 10000
}
```

Example response excerpt (`200`; values are illustrative): returns the updated full quota object. Invalid params return `400`; not found returns `404`.

## GET /api/admin/audit-logs

- **Method**: `GET`
- **Path**: `/api/admin/audit-logs`
- **Auth**: Admin required
- **Purpose**: Query audit logs with full-text search and filtering by event type, user scope, and date range, plus pagination.

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `event_type` | string | empty | Filter by event type (e.g. `auth.login_failed`) |
| `actor_user_id` | string | empty | Filter by acting user |
| `target_user_id` | string | empty | Filter by target user |
| `user_id` | string | empty | Match either actor or target user; used by the user activity view |
| `search` | string | empty | Search event type, IP, metadata, and actor/target email or display name |
| `created_from` | string | empty | Start date (ISO format) |
| `created_to` | string | empty | End date (ISO format) |
| `limit` | int | 50 | Page size |
| `offset` | int | 0 | Offset |

```bash
curl "http://127.0.0.1:8081/api/admin/audit-logs?event_type=auth.login_failed&limit=20" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns a paginated audit log result (with `items`, `total`, `limit`, `offset`). Each item also includes resolved `actor` and `target` user summaries, or `null` if that user has been deleted.

## GET /api/admin/audit-event-types

- **Method**: `GET`
- **Path**: `/api/admin/audit-event-types`
- **Auth**: Admin required
- **Purpose**: Return event types currently present in the audit log for filter controls.

```bash
curl http://127.0.0.1:8081/api/admin/audit-event-types \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns `{ "items": [{ "event_type": "auth.login_failed", "count": 12 }] }`. Event types are deduplicated and sorted by descending occurrence count, then by name for ties.
