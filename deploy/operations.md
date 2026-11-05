# Operations

This page covers day-to-day PepPlatform operations: health checks, log viewing, performance tuning, and version upgrades.

## Health Checks

### `/api/health` Endpoint

```bash
curl http://127.0.0.1:8080/api/health
```

Example response (excerpt; checks omitted):

```json
{
  "ok": true,
  "dependencies": {
    "profile_inference": {
      "ready": true,
      "status": "ready",
      "checked_at": "2026-06-24T10:00:00Z",
      "checks": [],
      "errors": []
    }
  }
}
```

::: warning Liveness only
The `ok` field is always `true` — this is a liveness check that returns `true` as long as the FastAPI process is running. The `ready` field inside `profile_inference` is the actual readiness check, reflecting whether BLAST+ is available.

This endpoint **does not** return a non-200 status code when `profile_inference` is unavailable.
:::

### `profile_environment_readiness()` Checks

`pepplatform/web/profile_runtime.py` checks:

1. Whether `makeblastdb` and `psiblast` binaries exist
2. If both present, runs a BLAST smoke test (builds a temporary database and produces a PSSM)
3. Results are cached in a module global; `force=True` refreshes

### Per-Model Inference Readiness

```bash
curl http://127.0.0.1:8080/api/models/{model_id}/inference-readiness
```

Returns whether a specific model can run inference from raw sequences (prebuilt DB vs build-on-demand vs blocked).

### Docker Service Status

```bash
# View all service statuses
docker compose ps

# Expected: 3 services (db/backend/frontend) all running
# db should show "healthy"
```

## Logging

### View Service Logs

```bash
# View all service logs
docker compose logs

# View specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Follow logs in real time
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail 100 backend

# View logs since a specific time
docker compose logs --since 2026-06-24T00:00:00 backend
```

::: tip Log output
The backend container sets `PYTHONUNBUFFERED=1` (`docker/backend.Dockerfile`), ensuring logs stream in real time to stdout/stderr. Use `docker compose logs` to view the full output.
:::

### Training Experiment Logs

Each experiment row stores a `log_path` pointing to a log file in the experiment's experiment directory. Training subprocess output is written to this file, not to a centralized logging system.

To view a specific experiment's logs, access the artifact directory in the `pep_runtime` volume.

## Performance Tuning

### Single worker and training lifecycle

Keep the current single Uvicorn worker. Each application process owns an in-memory training queue, a runner thread and visualization jobs; application initialization also marks unfinished experiments as canceled. Adding `--workers` or multiple backend replicas does not provide coordinated scheduling and can interfere with active experiments. A shared database does not turn these queues or connection pools into shared process state.

For development, restrict reload to source directories:

```bash
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --port 8081
```

Run without `--reload` when training must survive. Restarting the backend does not resume interrupted training; a new run or the supported downstream-SVM resume workflow is required. See [Versions and Resume](../web-ui/versions-and-resume).

### Database Connection Pool

Connection pooling depends on the SQLAlchemy engine configuration, database dialect and driver. The application does not expose pool-size environment settings. Increasing Uvicorn workers does not share or coordinate training queues.

### BLAST Timeout

The PSI-BLAST / makeblastdb subprocess timeout for profile-encoder inference is controlled by `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` (default 300 seconds). Large subject FASTA databases require increasing this value:

```bash
export PEP_PROFILE_BLAST_TIMEOUT_SECONDS=600
```

### Upload Size Limit

`docker/nginx.conf` sets `client_max_body_size 512m` to support large dataset uploads. To adjust, modify the config and rebuild the frontend container.


## Version Upgrades

### Upgrade Process

```bash
# 1. Backup (see Backup & Restore)
docker compose exec -T db pg_dump -U pepplatform pepplatform > backup_before_upgrade.sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild and start (alembic upgrade head runs automatically)
docker compose up --build -d

# 4. Verify
docker compose ps
curl http://127.0.0.1:8080/api/health
```

### Rollback

First verify the target revision’s compatibility with the current database and retain a coordinated backup. Stop application writes while keeping the database reachable:

```bash
docker compose stop frontend backend
# Select the previously validated source revision.
git checkout <previous-commit>
docker compose up -d db
# If schema restoration is necessary, follow Backup & Restore before restarting backend.
docker compose up --build -d
```

Do not pipe a database restore into a DB container removed by `docker compose down`. Schema downgrade and backup restore are alternative recovery procedures chosen for the specific migration; neither should be blindly combined with application restart.

::: warning Migration rollback
Not all migrations support safe rollback. Check `alembic history` before rolling back, and verify the target version's `downgrade()` logic is reversible.
:::

## Next Steps

- [Backup & Restore](./backup-restore) — data backup procedures
- [Database Migrations](./migrations) — Alembic migration commands
- [Configuration](../config/overview) — environment variable reference
