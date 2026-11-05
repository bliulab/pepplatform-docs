# Deployment Architecture

::: info Source availability
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

The supplied Docker Compose configuration defines three services. This page covers the overall architecture, service relationships, and production hardening.

## Service Topology

```text
Browser -> Nginx / Vue (:8080)
                | /api
                v
          FastAPI (:8000)
                |
                +-> PostgreSQL (:5432)
                +-> pep_runtime (datasets, experiments, models, versions)
```

## Service Details

### db — PostgreSQL 16

| Property | Value |
| --- | --- |
| Image | `postgres:16` |
| Port | `5432` (container-internal only, not published) |
| Volume | `postgres_data:/var/lib/postgresql/data` |
| Health check | `pg_isready`, interval 10s, timeout 5s, retries 5 |
| Default DB | `pepplatform` (configurable via `POSTGRES_DB`) |

### backend — FastAPI

| Property | Value |
| --- | --- |
| Build | `docker/backend.Dockerfile` (based on `python:3.10-slim`) |
| Port | `8000` (container-internal only) |
| Volume | `pep_runtime:/var/lib/pepplatform` |
| Depends on | `db` (after health check passes) |
| Start command | `alembic upgrade head && uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8000` |

::: info Single worker
The Dockerfile runs uvicorn with a single worker (no `--workers` flag). See [Operations](./operations) for the limitations of multiple application workers.
:::

### frontend — Nginx + Vue SPA

| Property | Value |
| --- | --- |
| Build | `docker/frontend.Dockerfile` (multi-stage: Node 22 build → Nginx 1.27 deploy) |
| Port | Container `80`, published to host `${PEP_HTTP_PORT:-8080}` |
| Config | `docker/nginx.conf` |
| Upload limit | `client_max_body_size 512m` (supports large dataset uploads) |

Nginx config highlights:
- `/api/` reverse-proxied to `http://backend:8000/api/` with `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` forwarded
- All other paths use SPA fallback: `try_files $uri $uri/ /index.html`

## Data Volumes

| Volume | Service | Contents | Backup priority |
| --- | --- | --- | --- |
| `postgres_data` | db | PostgreSQL database (users, experiments, model metadata) | **Highest** |
| `pep_runtime` | backend | Runtime data (datasets, experiment artifacts, model files) | **High** |


## Production Hardening

### 1. Replace Deployment Placeholders

```bash
# Generate random secrets
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export PEP_SESSION_SECRET=$(openssl rand -hex 32)
export PEP_INITIAL_ADMIN_EMAIL='admin@example.com'
export PEP_INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 16)
export PEP_LLM_KEY_ENCRYPTION_SECRET=$(openssl rand -hex 32)
```

Or write these into a `.env` file (see [Configuration Overview](../config/overview)).

### 2. HTTPS / TLS Termination

The PepPlatform Docker stack **does not handle TLS** — TLS is terminated by an external reverse proxy (e.g., Nginx, Caddy, Cloudflare). When deploying behind a TLS proxy:

```bash
export PEP_PUBLIC_BASE_URL='https://pep.example.com'
export PEP_COOKIE_SECURE=true
```

- `PEP_PUBLIC_BASE_URL` tells the backend the public origin for email links and cookie settings
- `PEP_COOKIE_SECURE=true` forces session cookies to only transmit over HTTPS

## Full Startup Sequence

```bash
# 1. Enter an authorized source checkout
cd /path/to/PepPlatform

# 2. Create .env file
cp .env.example .env
# Edit the configuration for the components you will use


# 3. Build and start
docker compose up --build

# 4. Verify
curl http://127.0.0.1:8080/api/health
# Expected: {"ok":true,...}
```

## Next Steps

- [Database Migrations](./migrations) — Alembic migration chain and commands
- [Backup & Restore](./backup-restore) — PostgreSQL and runtime data backup
- [Operations](./operations) — health checks, logging, performance tuning
- [Configuration](../config/overview) — complete environment variable reference
