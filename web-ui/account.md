# Account, AI Services and Authentication

Account pages manage display name, quotas and external AI connections. Login, registration, email verification and password reset use separate pages. Trained artifacts remain in the Model Library.

## Profile `/account/profile`

Edit a display name up to 40 characters. Email, role and verification state are read-only. Save changes and inspect success/error feedback. The quota panel displays account usage.

The header uses an Account text menu, and the profile page supports display-name changes.

## AI Services `/account/ai-services`

Configure account-scoped providers for [research chat and experiment planning](./agent) and experiment diagnostics. Supply provider, configuration name, base URL, model ID and API key. Advanced options include JSON-object support, reasoning and output-token settings. Connections support add/edit/test/enable/disable/delete. Saved keys only expose their last four characters.

Saving a connection does not prove provider/model availability; use Test Connection. AI requests depend on provider configuration, network access and provider-side limits. Creating training runs separately consumes the platform experiment quota.

## Login and Registration

| Route | Operation |
| --- | --- |
| `/login` | Email/password login; Remember Email stores the email, not the password |
| `/register` | Submit an email and a password of at least 8 characters, then verify email |
| `/verify-email` | Submit email and a 6-digit code, or resend the code |
| `/password-reset` | Request a code, then submit email, code and new password |

With authentication enabled, guests can still preview parts of the workspace and edit ordinary configuration. Personal-resource queries, training, inference and AI requests prompt login. Resource detail, account and administration pages are protected. Registration/reset mail requires SMTP. See [Authentication API](../api/auth) and [Configuration](../config/environment) for development debug codes and production settings.

## Common Operations

1. Edit and save your display name in Profile.
2. Add and test a provider in AI Services, then select it in the workspace.
3. Verify email after registration; use the code-based reset flow for forgotten passwords.
4. Administrators can enter [Administration](./admin) from the account menu; ordinary accounts do not see that entry.

See [Authentication API](../api/auth) and [AI Provider API](../api/ai).
