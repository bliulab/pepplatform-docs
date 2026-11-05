# Database Migrations

PepPlatform uses Alembic to manage database schema migrations. This page covers the migration chain, commands, and differences between Docker and local development.

## Migration Chain

The current source defines 12 linear migrations, with head `20260918_0012`. The table is derived from revision declarations under `alembic/versions/`.

| Change | Revision | Previous |
| --- | --- | --- |
| initial auth and metadata schema | `20260605_0001` | — |
| add user profile fields | `20260607_0002` | `20260605_0001` |
| add admin quotas and audit logs | `20260608_0003` | `20260607_0002` |
| add AI provider configs | `20260609_0004` | `20260608_0003` |
| add agent execution plans | `20260610_0005` | `20260609_0004` |
| add agent campaigns | `20260611_0006` | `20260610_0005` |
| add agent chat history | `20260719_0007` | `20260611_0006` |
| persist agent chat web search metadata | `20260719_0008` | `20260719_0007` |
| add locale preferences and generated-name metadata | `20260720_0009` | `20260719_0008` |
| add experiment analysis conversations | `20260720_0010` | `20260720_0009` |
| add structured experiment names | `20260721_0011` | `20260720_0010` |
| Add independent content versions without rewriting historical experiments. | `20260918_0012` | `20260721_0011` |

A downgrade function does not guarantee lossless rollback. Inspect the target migration and keep a database/runtime backup before changing schema.

## Commands

### Upgrade to latest

```bash
# Docker: automatic (backend.Dockerfile CMD on container start)
# No manual action needed

# Local dev: run manually
alembic upgrade head
```

### View migration history

```bash
alembic history
```

### Rollback one version

```bash
alembic downgrade -1
```

### Rollback to a specific version

```bash
alembic downgrade 20260608_0003
```

## Docker vs Local Development

| Scenario | Migration execution | Connection string source |
| --- | --- | --- |
| Docker Compose | Automatic — `alembic upgrade head` runs on container start (`docker/backend.Dockerfile`) | `PEP_DATABASE_URL` env var (set to PostgreSQL in `docker-compose.yml`) |
| Local dev (SQLite) | Manual `alembic upgrade head` | `alembic.ini` `sqlalchemy.url = sqlite:///.pepplatform_web/metadata.sqlite3` |
| Local dev (PostgreSQL) | Manual `alembic upgrade head` | `PEP_DATABASE_URL` env var |

::: tip env.py logic
`alembic/env.py` reads `PEP_DATABASE_URL` from the process environment, falling back to the SQLite path in `alembic.ini`. It does not load the project `.env`; export the connection URL when selecting another database.

Alembic uses `pool.NullPool` (`alembic/env.py`) during migration runs — appropriate for one-shot execution.
:::

## Runtime Compensation

In addition to Alembic migrations, `MetadataStore.init_schema()` (`pepplatform/web/store.py`) performs lightweight compensation on every startup:

1. `STORE_METADATA.create_all(engine)` — creates missing tables
2. `_ensure_user_profile_columns()` — idempotent column adds for user profiles
3. `_ensure_owner_columns()` — idempotent owner column adds
4. `_ensure_agent_columns()` — idempotent Agent-related column adds
5. `_ensure_localization_columns()` — locale preferences and generated-name metadata
6. `_ensure_experiment_failure_column()` — structured training failures
7. `_ensure_experiment_resume_column()` — downstream resume metadata


These startup helpers create missing tables and selected columns. They do not establish compatibility with every historical database schema.

::: warning Compensation does not replace Alembic
Runtime compensation creates missing tables and selected columns; it is not a general replacement for schema or data migrations. Production must rely on the Alembic migration chain.
:::

## Migration Failure Troubleshooting

### Check database connection

```bash
# PostgreSQL
pg_isready -U pepplatform -d pepplatform

# Verify PEP_DATABASE_URL
echo $PEP_DATABASE_URL
```

### Check current version

```bash
alembic current
```

### View full chain

```bash
alembic history --verbose
```

### Common issues

| Problem | Cause | Solution |
| --- | --- | --- |
| `Can't load plugin: sqlalchemy.dialects:postgresql.psycopg` | Missing psycopg driver | `pip install psycopg[binary]` |
| `Connection refused` | PostgreSQL not running or wrong connection string | Check `PEP_DATABASE_URL` and `pg_isready` |
| `Target database is not up to date` | Intermediate migrations not applied | Run `alembic upgrade head` first |
| `sqlalchemy.exc.OperationalError` | Permissions or network issue | Check database user permissions and connectivity |

## Migrating from Legacy SQLite to PostgreSQL

Follow the [Database import guide](../install/database#importing-legacy-sqlite-into-postgresql) for the command, dependencies and record-ownership behavior.

## Next Steps

- [Backup & Restore](./backup-restore) — database backup procedures
- [Operations](./operations) — day-to-day operations and health checks
