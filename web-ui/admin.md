# Admin Console

> An administrator workspace for platform operations and security, separated into overview, user management, and audit workflows.

## Information Architecture

The Admin Console is restricted to administrators. `/admin` redirects to `/admin/overview`, and the local navigation separates the workspace into three primary pages:

- **Overview** (`/admin/overview`) shows account scale, today's workload, trailing 24-hour security signals, and recent activity.
- **Users** (`/admin/users`) supports searching, filtering, sorting, and paginating accounts before opening a user detail.
- **Audit** (`/admin/audit`) is a dedicated audit workspace with keyword, event-type, and time-range filters.

This hierarchy keeps the user list, edit forms, quotas, session records, and audit logs out of one crowded panel. Desktop uses a compact local sidebar and full-width data area. On mobile, the navigation becomes a horizontal selector and data tables become scannable lists.

## Overview

The overview follows an operational priority order:

- User metrics: total, active, disabled, unverified, and new users in the last seven days. Each metric links to a pre-filtered user list.
- Workload: experiments created today, active experiments, inference requests today, and inference inputs today.
- Security signals: failed logins, administrator actions, session revocations, and user deletions in the trailing 24 hours, with links into matching audit results.
- Recent activity: the latest audit events with actor and target summaries.

"Today" uses a UTC calendar day and the UI states that scope explicitly. Trailing 24-hour security metrics use a rolling time window.

## User Directory

The Users page provides email/display-name search plus role, status, and email-verification filters. Filters, sorting, page number, and page size are written to the URL query, so refreshes, shared links, and returning from a detail preserve the same view.

The desktop table shows identity, access and verification, account status, current UTC-day usage, resource counts, and creation date. Users can be sorted by identity, email, role, status, or creation date. Mobile uses a compact user list.

Selecting a user opens `/admin/users/{user_id}/account`. The back control carries the original directory URL, preserving search and pagination state.

## User Detail

The user header keeps identity, status, verification, and resource counts visible. Four deep-linkable tabs separate the detail workflows:

- **Account** (`account`) shows read-only account data, role and status controls, and verification-email resend. Disabling a user automatically revokes their sessions.
- **Usage & quotas** (`usage`) places current UTC-day consumption, resource counts, and the four quota limits together, with an independent save action.
- **Security** (`security`) shows session and verification-code records, supports revoking active sessions, and exposes deletion when the account is eligible.
- **Activity** (`activity`) lists audit events where this user was either the actor or the target.

Administrators cannot remove their own admin role, disable themselves, revoke their own sessions, or delete their own account. Admin accounts and users that still own datasets, experiments, models, or inference records cannot be deleted.

## Audit Workspace

The Audit page supports:

- Keyword search across event type, IP, metadata, and actor/target email or display name.
- Filtering by event types that actually exist in the log.
- Time ranges for the trailing 24 hours, 7 days, 30 days, or all time.
- Paginated event time, type, actor, target, IP, and metadata.

The Activity tab in user detail reuses the same audit table while automatically scoping results to the current user.

## Sensitive Actions

The console uses tiered application dialogs instead of browser-native confirmation prompts:

1. **Revoke sessions** states the number of active sessions affected and executes after confirmation.
2. **Delete user** requires typing the target user's full email address before the destructive action is enabled.

Account changes and quota changes save independently. Success or error feedback stays with the relevant section, so a failed action does not disturb unrelated edits.

## Related Pages

- [Account & Authentication](./account) - user-facing profile and authentication
- [API: Admin](../api/admin) - programmatic admin endpoints
