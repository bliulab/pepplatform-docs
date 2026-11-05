# Environment Variables

This page lists platform configuration variables grouped by function. Backend defaults and Compose overrides can differ; values below state the relevant context. Each entry includes the variable name, default value, whether it's required, description, and source location.

## Auth & Session

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_AUTH_ENABLED` | `1` | No | Master auth toggle; set `0` to disable auth (dev only) | `pepplatform/web/auth.py` |
| `PEP_SESSION_SECRET` | Local: `dev-insecure-session-secret`; Compose: no default | Required by Compose and in production | Session signing secret; must be a long random string in production | `pepplatform/web/auth.py` |
| `PEP_PUBLIC_BASE_URL` | `http://127.0.0.1:5173` | Required for HTTPS | Public base URL; used for cookie secure flag and email link generation | `pepplatform/web/auth.py` |
| `PEP_COOKIE_SECURE` | Derived from `PEP_PUBLIC_BASE_URL` scheme | No | Force secure cookies; set `true` behind HTTPS | `pepplatform/web/auth.py` |
| `PEP_SESSION_DAYS` | `14` | No | Session lifetime in days (min 1) | `pepplatform/web/auth.py` |
| `PEP_EMAIL_CODE_TTL_MINUTES` | `10` | No | Email verification / password-reset code TTL (minutes) | `pepplatform/web/auth.py` |
| `PEP_EMAIL_CODE_MAX_ATTEMPTS` | `5` | No | Max wrong attempts before a code is invalidated | `pepplatform/web/auth.py` |
| `PEP_ENV` | Local: `development`; Compose: `production` | Required for public deployments | Deployment profile; `production` disables the plaintext code fallback | `pepplatform/web/auth.py` |
| `PEP_AUTH_DEBUG_CODES` | Local: `1` unless production; Compose: `0` | No | Return a plaintext `debug_code` when email delivery fails; overrides the `PEP_ENV` default | `pepplatform/web/auth.py` |
| `PEP_INITIAL_ADMIN_EMAIL` | — | No | Bootstrap admin email (created on startup) | `pepplatform/web/auth.py` |
| `PEP_INITIAL_ADMIN_PASSWORD` | — | No | Bootstrap admin password | `pepplatform/web/auth.py` |

::: warning debug_code vs. production
Register, resend-verification, password-reset, and admin resend return a plaintext `debug_code` when mail delivery fails, which keeps local development usable.
`PEP_ENV=production` disables that fallback by default. An explicit `PEP_AUTH_DEBUG_CODES` takes precedence; set it to `0` to omit debug codes. The supplied Compose defaults to `PEP_ENV=production` and `PEP_AUTH_DEBUG_CODES=0`, and forwards both settings. Check the effective backend environment when overriding them.
:::

## Database

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_DATABASE_URL` | Falls back to local SQLite (`.pepplatform_web/metadata.sqlite3`) | Required for PostgreSQL | SQLAlchemy connection URL, format `postgresql+psycopg://user:pass@host:port/db` | `pepplatform/web/app.py` |
| `POSTGRES_PASSWORD` | No default | Required by Compose | PostgreSQL container password | `docker-compose.yml` |
| `POSTGRES_USER` | `pepplatform` | No | PostgreSQL username | `docker-compose.yml` |
| `POSTGRES_DB` | `pepplatform` | No | PostgreSQL database name | `docker-compose.yml` |

::: tip Alembic Migrations
`alembic/env.py` reads `PEP_DATABASE_URL` first, falling back to the SQLite path in `alembic.ini`. The same `alembic.ini` works for both local SQLite and Docker PostgreSQL.
:::

## SMTP Email

Configure SMTP before enabling public registration. `smtp_configured` requires both `PEP_SMTP_HOST` and `PEP_SMTP_FROM` (`auth.py`).

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_SMTP_HOST` | — | Required for email | SMTP server hostname | `pepplatform/web/auth.py` |
| `PEP_SMTP_PORT` | `587` | No | SMTP port; `465`/`994` switch to implicit TLS automatically | `pepplatform/web/auth.py` |
| `PEP_SMTP_USER` | — | If required by the SMTP server | SMTP login account (full address for QQ/163/126) | `pepplatform/web/auth.py` |
| `PEP_SMTP_PASSWORD` | — | If required by the SMTP server | SMTP password or mailbox authorization code | `pepplatform/web/auth.py` |
| `PEP_SMTP_FROM` | Same as `PEP_SMTP_USER` | Required for email | Sender From address; QQ/163/126 require it to match the authenticated account | `pepplatform/web/auth.py` |
| `PEP_SMTP_SSL` | `auto` | No | Implicit-TLS switch. `auto` derives it from the port (on for 465/994), `1`/`0` force it | `pepplatform/web/auth.py` |
| `PEP_SMTP_STARTTLS` | `1` | No | STARTTLS upgrade switch (auto-disabled for implicit TLS); disable only for local MailHog-style servers | `pepplatform/web/auth.py` |
| `PEP_SMTP_TIMEOUT` | `15` | No | Connect/send timeout in seconds (min 1) | `pepplatform/web/auth.py` |

::: tip Transport choice
Both `587` + STARTTLS (default) and `465` + implicit TLS are supported. The handshake verifies the server certificate against the
system CA store (`ssl.create_default_context`) and fails loudly instead of silently downgrading. Check the provider’s current host, credentials and transport requirements; selecting port 465 controls the default TLS transport, not provider acceptance.
:::

::: tip QQ Mail example
```bash
PEP_SMTP_HOST=smtp.qq.com
PEP_SMTP_PORT=587
PEP_SMTP_USER=your_sender@qq.com
PEP_SMTP_PASSWORD='the authorization code generated under Settings → Account → Security'
PEP_SMTP_FROM=your_sender@qq.com
```
The password is the [mailbox authorization code](https://help.mail.qq.com/detail/106/985), not the QQ account password.
:::

## AI / LLM

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_LLM_KEY_ENCRYPTION_SECRET` | — | Required by supplied Compose; needed for saved AI keys | Encrypts user-saved AI API keys; min 16 chars; retain it for existing ciphertext | `pepplatform/web/ai.py` |
| `PEP_LLM_HTTP_TIMEOUT_SECONDS` | `60` | No | Per-request timeout (seconds) for AI provider HTTP calls | `pepplatform/web/ai.py` |
| `PEP_LLM_MAX_CONTEXT_CHARS` | `60000` | No | Max chars of JSON context sent to LLM (min 8000, truncated if exceeded) | `pepplatform/web/ai.py` |
| `PEP_TAVILY_API_KEY` | — | Required for web search | Server-level Tavily Free/Researcher key; PAYGO must remain disabled and the key is never returned to clients | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_ENABLED` | `true` | No | Master switch for Agent chat web search; search remains unavailable when no Tavily key is configured | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_TIMEOUT_SECONDS` | `12` | No | Timeout for Tavily usage and search requests, in seconds | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_USAGE_CACHE_SECONDS` | `300` | No | Cache duration for verified free-quota status, in seconds | `pepplatform/web/web_search.py` |

::: warning PEP_LLM_KEY_ENCRYPTION_SECRET
This secret encrypts all user-saved AI Provider API keys. **Rotating it makes all saved keys unreadable**. See [Configuration Overview](./overview#pep-llm-key-encryption-secret-stability-warning).
:::

## Web / Frontend

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `VITE_API_TARGET` | `http://127.0.0.1:8081` | No | Vite dev server `/api` proxy target; development-server proxy only, not included in the client build | `frontend/vite.config.ts` |
| `PEP_HTTP_PORT` | `8080` | No | Docker Compose frontend container published host port | `docker-compose.yml` |

::: tip No import.meta.env
The frontend code does **not** use `import.meta.env.*`. The only Vite variable `VITE_API_TARGET` is consumed in `vite.config.ts` for the dev proxy and never appears in the client bundle.
:::

## BLAST / Profile

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` | `300` | No | Subprocess timeout (seconds) for PSI-BLAST / makeblastdb during profile-encoder inference; increase for large subject FASTA | `pepplatform/web/inference.py` |
| `PEP_TOP_NGRAM_MAX_RESIDUES` | `10000` | No | Maximum residues per sequence for Top-n-gram; this limit does not affect other experiment routes on the same dataset | `pepplatform/top_ngram.py` |

## Inference

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEPPLATFORM_INFERENCE_BATCH_SIZE` | Model metadata `inference_batch_size` / `predict_batch_size` / `batch_size`, then `64` | No | Override for general Web inference batch size; must be a positive integer | `pepplatform/web/inference.py` |
| `PEPPLATFORM_GRAPH_INFERENCE_BATCH_SIZE` | Current request size | No | Override for graph-predictor inference batch size; must be a positive integer and is capped by the current request size | `pepplatform/web/inference.py` |

## Runtime

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEP_RUNTIME_ROOT` | `<project>/.pepplatform_web` | No | Root directory for runtime data (datasets, experiments, models, SQLite); set to `/var/lib/pepplatform` in Docker | `pepplatform/web/paths.py` |

## Offline Mode / Hugging Face

| Variable | Default | Required | Description | Source |
| --- | --- | --- | --- | --- |
| `PEPPLATFORM_OFFLINE_MODE` | — | No | Set to `1`/`true`/`yes`/`on` to force local-only pretrained models; fails fast if a model isn't local | `pepplatform/web/preflight.py` |
| `PEPPLATFORM_HF_ENDPOINT` | `https://hf-mirror.com` | No | PepPlatform-specific HF mirror endpoint; lower priority than `HF_ENDPOINT` | `pepplatform/web/preflight.py` |
| `HF_ENDPOINT` | — | No | Standard Hugging Face endpoint; higher priority than `PEPPLATFORM_HF_ENDPOINT` | `pepplatform/web/preflight.py` |
| `HF_HOME` | — | No | Hugging Face home dir; `<HF_HOME>/hub` is searched for cached pretrained models | `pepplatform/workflow.py` |
| `HUGGINGFACE_HUB_CACHE` | — | No | Hugging Face hub cache dir; searched first | `pepplatform/workflow.py` |

::: info Training subprocess injected env vars
`ExperimentRunner.build_subprocess_env()` (`pepplatform/web/runner.py`) automatically injects the following into training subprocesses — no manual configuration needed:

| Variable | When injected |
| --- | --- |
| `HF_HUB_OFFLINE=1` | When offline mode is on |
| `TRANSFORMERS_OFFLINE=1` | When offline mode is on |
| `HF_HUB_DISABLE_XET=1` | Always (if not already set) |
| `HF_HUB_DOWNLOAD_TIMEOUT=120` | Always (if not already set) |
| `HF_HUB_ETAG_TIMEOUT=30` | Always (if not already set) |
:::

## Next Steps

- [Configuration Overview](./overview) — configuration sources, `.env` loading, secret generation
- [Deployment & Operations](../deploy/overview) — production deployment and hardening

## Ensemble and ESM3 Runtime

| Variable | Default | Meaning | Source |
| --- | --- | --- | --- |
| `PEP_WEB_ENSEMBLES_ENABLED` | `1` | Controls new ensemble creation; existing inference/history remain available | `pepplatform/web/ensemble_service.py` |
| `PEPPLATFORM_ESM3_IDLE_TTL_SECONDS` | `300` | Idle ESM3 inference runtime lifetime in seconds, minimum 1; invalid numbers fall back to 300 | `pepplatform/web/inference.py` |

Compose passes the ensemble switch explicitly. It does not currently forward the ESM3 idle override; add it to the backend container environment when configuring that deployment.
