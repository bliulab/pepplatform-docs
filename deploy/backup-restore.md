# Backup & Restore

A usable backup needs matching metadata and files. The source distribution does not provide an automated backup or a verified recovery service; test your restoration procedure before relying on it.

## Backup Targets

| Target | Contents |
| --- | --- |
| PostgreSQL | Users, experiments, model records, history and version references |
| Complete `pep_runtime` volume | Datasets, experiments, models, inference outputs, visualization state and `versions/` content/dependencies |
| Deployment configuration | Compatible source/image version, configuration and the original stable `PEP_LLM_KEY_ENCRYPTION_SECRET` needed to read saved AI keys |

A `versions.json` download is a summary, not a restorable model bundle. Preserve file ownership and permissions as well as contents. Pause new submissions and application writes while taking a coordinated snapshot.

## PostgreSQL Backup

These examples use the default database and user, `pepplatform`. Adjust them for your actual configuration. Run from the Compose project root:

```bash
docker compose exec -T db pg_dump -U pepplatform pepplatform > backup.sql
```

For custom-format output:

```bash
docker compose exec -T db pg_dump -U pepplatform -Fc pepplatform > backup.dump
```

Inspect command exit status and retain the matching runtime/configuration snapshot. A dump file’s existence alone does not establish a successful or complete backup.

## PostgreSQL Restore

Prepare a compatible, empty target database and stop application writes. Restore commands below do not create a clean target or reconcile it with existing files:

```bash
docker compose stop backend
```

For a plain SQL dump:

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U pepplatform pepplatform < backup.sql
```

For a custom-format dump, use this instead:

```bash
docker compose exec -T db pg_restore --exit-on-error -U pepplatform -d pepplatform < backup.dump
```

Restore the matching runtime files before starting the backend. Confirm schema compatibility and inspect restore errors first:

```bash
docker compose start backend
```

## Docker Volume Backup

Volume names depend on the Compose project name. Inspect actual mounts rather than assuming a `pepplatform_` prefix:

```bash
docker inspect "$(docker compose ps -a -q backend)" --format '{{range .Mounts}}{{println .Name .Destination}}{{end}}'
```

Use a volume backup procedure appropriate for your storage. Stop processes writing to volumes being archived. A physical PostgreSQL-volume copy requires a stopped database or a separately validated database snapshot procedure; a live directory archive is not a substitute for `pg_dump`.

## Docker Volume Restore

Restore runtime snapshots while their writers are stopped, using the actual target volumes and preserved ownership. Keep the database and runtime from the same coordinated backup; restoring only one can leave missing model or version content.

## Verification and Retention

Retain backups separately from the runtime and choose retention for your operational needs. Rehearse restoration into an isolated environment, then check database access, dataset/model records, version content and the specific workflows you need. A successful health response checks liveness, not complete recoverability.

## Next Steps

- [Database Migrations](./migrations)
- [Operations](./operations)
