# Docker Compose

::: info Source availability
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

The supplied Docker Compose configuration builds a PostgreSQL database, FastAPI backend, Nginx-served Vue frontend. Prepare configuration, data and any route-specific model resources before using the corresponding features. A successful build does not establish that every training or inference route is ready.

## Prerequisites

- Docker and Docker Compose installed
- Environment meets the [Requirements](./requirements)

## Step 1: Obtain Source and Configure Secrets

```bash
git clone https://github.com/AlbertTeslaWizard/PepPlatform.git
cd PepPlatform
cp .env.example .env
openssl rand -hex 32
```

Edit `.env` and generate a separate value for each of `POSTGRES_PASSWORD`, `PEP_SESSION_SECRET` and `PEP_LLM_KEY_ENCRYPTION_SECRET`; run the generator once per value. Compose rejects empty required secrets. Use a URL-safe database password, such as the generated hexadecimal string.

To create an administrator on first startup, fill both `PEP_INITIAL_ADMIN_EMAIL` and `PEP_INITIAL_ADMIN_PASSWORD`. They are blank by default. Without SMTP, create the administrator before startup so you can sign in. Email registration and password resets still require working SMTP.

::: warning Keep encryption secrets stable
`PEP_LLM_KEY_ENCRYPTION_SECRET` encrypts user-saved AI API keys. Retain it across restarts and backups; changing it makes existing ciphertext unreadable. Keep the session secret stable as well. Do not commit `.env`.
:::

## Step 2: Start the Stack

```bash
docker compose up --build
```

Once started, open <http://127.0.0.1:8080> in your browser to use the platform.

::: info Port configuration
The default exposed port is `8080`, configurable via the `PEP_HTTP_PORT` environment variable.
:::

## Service Architecture

`docker-compose.yml` defines 3 services:

| Service | Image / Build | Description |
| --- | --- | --- |
| **db** | `postgres:16` | Metadata database, persisted in the `postgres_data` volume |
| **backend** | local build `docker/backend.Dockerfile` | FastAPI backend, runs `alembic upgrade head` on startup |
| **frontend** | local build `docker/frontend.Dockerfile` | Nginx-served Vue production build, exposes port 80 |

## SMTP Configuration

Before enabling public registration, fill in working SMTP settings in `.env`. Replace these example values:

```bash
PEP_SMTP_HOST='smtp.example.com'
PEP_SMTP_PORT='587'
PEP_SMTP_USER='your-smtp-user'
PEP_SMTP_PASSWORD='your-smtp-password'
PEP_SMTP_FROM='noreply@example.com'
```

## HTTPS Deployment

Behind a TLS reverse proxy, set the real external URL in `.env`. When `PEP_COOKIE_SECURE` is unset, HTTPS automatically enables secure cookies; an explicit setting is also supported:

```bash
PEP_PUBLIC_BASE_URL='https://pep.example.com'
PEP_COOKIE_SECURE=true
```

## Importing Legacy SQLite Data

Follow the [Database import guide](./database#importing-legacy-sqlite-into-postgresql) to import legacy SQLite metadata into PostgreSQL.

## Next Steps

After deployment, refer to [Verify Installation](./verify) to confirm all services are healthy. To adjust optional settings, see [Optional Config](./optional-config).

## Current Docker Resources

The image installs a CPU build of PyTorch and Compose does not currently request GPUs. A GPU host alone does not enable GPU training inside these containers. GPU deployment needs a compatible PyTorch/CUDA image and explicit GPU access. Pretrained snapshots under `models/` are excluded from the build context and must be provided through a separately configured mount/cache or online download. The source distribution contains no datasets, and `datasets/` is excluded from the Docker build context; see [Built-in Datasets](../datasets/builtin).

## Container Environment Overrides

Compose forwards `PEP_ENV=production` and `PEP_AUTH_DEBUG_CODES=0` by default, so failed email delivery does not expose debug verification codes. Public registration still needs SMTP. For local development that needs debug codes, set both `PEP_ENV=development` and `PEP_AUTH_DEBUG_CODES=1` in `.env`. SMTP SSL, STARTTLS and timeout switches are also forwarded.

## Model Mounts and Download Cache

Hugging Face downloads persist in the `pep_runtime` volume under `/var/lib/pepplatform/huggingface`. Set `HF_TOKEN` in `.env` for models that require authorization, after obtaining access from the model provider.

For prepared local model snapshots, create `compose.models.yaml` in the repository root:

```yaml
services:
  backend:
    volumes:
      - ./models:/app/models:ro
    environment:
      PEPPLATFORM_OFFLINE_MODE: "1"
```

Start with `docker compose -f docker-compose.yml -f compose.models.yaml up --build`. The relative mount resolves from the base Compose directory; see [offline CLI models](./cli-only#step-5-offline-pretrained-models-optional) for the directory layout. Enable offline mode only when the required snapshots are complete.
