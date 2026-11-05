# Database

PepPlatform's metadata (users, experiments, model records, etc.) supports two storage backends: PostgreSQL for production and SQLite by default for local development — no extra setup required.

## PostgreSQL (Production)

Docker Compose deployments use PostgreSQL 16 by default. The backend connects via `PEP_DATABASE_URL`, formatted as:

```
PEP_DATABASE_URL=postgresql+psycopg://user:password@host:port/dbname
```

The Docker Compose default is:

```bash
PEP_DATABASE_URL=postgresql+psycopg://pepplatform:pepplatform@db:5432/pepplatform
```

::: warning
For production, always replace the default weak password via the `POSTGRES_PASSWORD` environment variable. See [Docker Compose](./docker).
:::

## SQLite (Local Dev Default)

During local Web development, when `PEP_DATABASE_URL` is **not set**, the backend automatically uses SQLite with the database file at:

```
.pepplatform_web/metadata.sqlite3
```

No database service to install — works out of the box. See [Local Web Development](./local-web).

## Alembic Migrations

PepPlatform uses Alembic to manage database schema migrations.

- **Docker deployment**: The backend container runs `alembic upgrade head` automatically on startup (see the CMD in `docker/backend.Dockerfile`) — no manual action needed.
- **Local development**: If the schema has changed, run migrations manually before starting the backend:

```bash
alembic upgrade head
```

## Importing Legacy SQLite into PostgreSQL

Run from the platform source root in an environment with the Web dependencies installed and access to the target PostgreSQL instance. Export the target URL and administrator variables used below; this command does not load the project `.env`.

```bash
python -m scripts.import_legacy_sqlite \
  --source .pepplatform_web/metadata.sqlite3 \
  --target "$PEP_DATABASE_URL" \
  --admin-email "$PEP_INITIAL_ADMIN_EMAIL" \
  --admin-password "$PEP_INITIAL_ADMIN_PASSWORD"
```

::: info Argument reference

- `--source`: source SQLite file path
- `--target`: target PostgreSQL connection string
- `--admin-email` / `--admin-password`: administrator account for imported records
:::

Existing IDs are skipped. Newly imported records belong to the specified administrator.

## Next Steps

- After database configuration, refer to [Verify Installation](./verify) to confirm the connection works.
- For other tunable parameters, see [Optional Config](./optional-config).
