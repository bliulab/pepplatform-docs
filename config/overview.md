# Configuration Overview

PepPlatform uses environment variables for configuration. Loading behavior differs between the Web backend, CLI commands and Docker Compose.

## Configuration Sources and Priority

The Web backend resolves configuration in the following order — **first match wins**:

```
1. Process environment variables
       ↓ if not set
2. Project root .env file
       ↓ if not set
3. Hardcoded defaults in source code
```

The `.env` file only fills in variables not already set in the process environment.

## `.env` Auto-Loading

On startup, the Web backend loads `.env` from the project root. It accepts `KEY=VALUE` and `export KEY=VALUE` lines without overwriting existing process variables.

This means you can:

```bash
# Option 1: create a .env file
cp .env.example .env
# edit .env with your secrets, then start directly
python -m uvicorn pepplatform.web.app:app --port 8081

# Option 2: export environment variables (higher priority, overrides .env)
export PEP_LLM_KEY_ENCRYPTION_SECRET='replace-with-a-stable-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --port 8081
```

## Docker vs Local Differences

| Scenario | Configuration method | Notes |
| --- | --- | --- |
| Docker Compose | Shell variables or project `.env` supply values for `docker-compose.yml` | Shell variables take precedence over `.env`; only explicitly configured variables reach the container |
| Local web dev | `.env` file or `export` | Backend auto-loads `.env`; frontend uses `frontend/.env.local` for Vite proxy |
| CLI training and Alembic | `export` | Read process environment variables; do not automatically load the project `.env` |

See [Container Environment Overrides](../install/docker#container-environment-overrides) when adding backend settings to Compose.

::: warning Default Value Differences
Some variables have different defaults in code vs `docker-compose.yml`:

- `PEP_SESSION_SECRET`: code default `dev-insecure-session-secret`, compose default `change-me-before-production`
- `PEP_PUBLIC_BASE_URL`: code default `http://127.0.0.1:5173` (Vite port), compose default `http://127.0.0.1:8080` (frontend container port)

Always set these explicitly in production.
:::

## Production Deployment Settings

Replace the deployment placeholders for the components you use. Initial-administrator setup is optional; provide its email and password together.

| Setting | Value or generation |
| --- | --- |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `PEP_SESSION_SECRET` | `openssl rand -hex 32` |
| `PEP_INITIAL_ADMIN_PASSWORD` | `openssl rand -base64 16` |
| `PEP_LLM_KEY_ENCRYPTION_SECRET` | `openssl rand -hex 32` |
| `PEP_INITIAL_ADMIN_EMAIL` | Admin email address |

```bash
# Generate random secrets
openssl rand -hex 32    # for PEP_SESSION_SECRET / PEP_LLM_KEY_ENCRYPTION_SECRET
openssl rand -base64 32 # for POSTGRES_PASSWORD
openssl rand -base64 16 # for PEP_INITIAL_ADMIN_PASSWORD
```

## PEP_LLM_KEY_ENCRYPTION_SECRET Stability Warning

::: danger Must not be rotated
`PEP_LLM_KEY_ENCRYPTION_SECRET` encrypts user-saved AI Provider API keys (PBKDF2-HMAC-SHA256 + XOR stream + HMAC).

- **At least 16 characters**; recommended `openssl rand -hex 32`.
- **Must remain stable across restarts and backups** — this value lives in the environment variable, not in the database.
- **Rotating it makes all saved AI Provider keys unreadable** — every AI key must be reconfigured.
- Docker Compose enforces setting this variable at startup (`${...:?}` syntax in `docker-compose.yml`).
:::

## Next Steps

- [Environment Variables](./environment) — complete reference for all environment variables
- [Deployment & Operations](../deploy/overview) — production deployment and hardening
