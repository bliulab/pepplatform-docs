# Local Web Development

::: info Source availability
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

For local training and frontend/backend development. The backend command below runs without automatic reload, while the frontend uses the Vite dev server. Both can be debugged independently.

## Prerequisites

- Python 3.10 (conda or venv isolation recommended)
- Node.js 22 + npm
- BLAST+ when generating profiles (`sudo apt install ncbi-blast+`); other routes do not require it
- Environment meets the [Requirements](./requirements)

## Start the Backend

In one terminal:

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements-web.txt
export PEP_LLM_KEY_ENCRYPTION_SECRET='replace-with-a-stable-local-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

Keep `--reload` disabled during training: source changes restart the backend and cancel unfinished tasks.
For backend debugging only, append `--reload --reload-dir pepplatform --reload-dir scripts`
to restrict watching to runtime source directories.

New Web runs pin the actual dataset splits and required resources, and write generated caches into
their own experiment directories. Historical feature caches are not snapshotted wholesale or
overwritten. Existing version objects and saved runs retain their recorded integrity checks.

Pretrained routes also need the model snapshots and extensions. For CPU:

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torchvision==0.20.1"
python -m pip install -r requirements-pretrained.txt
```

Install `requirements-dev.txt` to run tests; see [Development and Tests](./verify#development-and-tests).

### Auth and Database

- Local development **enables auth by default** (`PEP_AUTH_ENABLED=1`).
- When `PEP_DATABASE_URL` is not set, metadata is stored automatically in the SQLite file `.pepplatform_web/metadata.sqlite3` — no extra database setup needed.
- Do **not** set `PEP_COOKIE_SECURE=true` when testing over local HTTP; the backend infers it from the `PEP_PUBLIC_BASE_URL` scheme. See [Database](./database).

### .env Auto-loading

The backend auto-loads `.env` from the project root. If `.env` already contains `PEP_LLM_KEY_ENCRYPTION_SECRET`, the `export` above can be omitted. Generate one with:

```bash
openssl rand -hex 32
```

::: tip Keep the secret stable
When testing AI Providers locally, keep `PEP_LLM_KEY_ENCRYPTION_SECRET` the same across backend restarts, otherwise previously saved API keys become unreadable.
:::

### Temporarily Disable Auth

To skip login during development:

```bash
PEP_AUTH_ENABLED=0 python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

## Start the Frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Then open <http://127.0.0.1:5173>.

### Configure Frontend Proxy

If the backend uses a port other than the default 8081, configure the proxy before starting Vite:

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_API_TARGET=http://127.0.0.1:8000
```

Then restart `npm run dev`.

## Next Steps

- Refer to [Verify Installation](./verify) to confirm frontend and backend are running.
- To use offline pretrained models, see [Optional Config](./cli-only).
