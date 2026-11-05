# Verify Installation

After completing installation, run the verification steps below for your chosen deployment path to confirm all components are working correctly.

## Docker Compose Verification

After running `docker compose up --build`, check that services are ready:

```bash
# Verify frontend is reachable
curl http://127.0.0.1:8080

# Verify backend health endpoint
curl http://127.0.0.1:8080/api/health
```

::: tip
An HTML response checks frontend reachability; a successful `/api/health` response checks backend liveness. Inspect dependency readiness separately; these responses do not verify all features. You can also just open <http://127.0.0.1:8080> in a browser.
:::

Check container status:

```bash
docker compose ps
```

Confirm all three services — `db`, `backend`, `frontend` — are in `running` / `healthy` state.

## Local Web Verification

After starting `uvicorn` in the backend terminal:

```bash
# Verify backend health check
curl http://127.0.0.1:8081/api/health
```

After starting `npm run dev` in the frontend terminal, open <http://127.0.0.1:5173> in a browser — you should see the PepPlatform UI.

## CLI Verification

Confirm the training scripts load correctly:

```bash
# Dispatcher help
python scripts/train_pipeline.py --help

# Single-sequence task script
python scripts/train_sequence_pipeline.py --help

# Pair-interaction task script
python scripts/train_pair_pipeline.py --help
```

::: tip
Successful `--help` output establishes only that the entry point and parser can load. Check the selected route’s dependencies, data and model resources separately; it does not validate training or inference. You can then run `python scripts/train_sequence_pipeline.py` to launch the single-sequence wizard, or `python scripts/train_pair_pipeline.py` for pair tasks.
:::

## Development and Tests

Run from the platform source root. The development file includes Web, pretrained
extensions and test/lint tools. For CPU, install matching PyTorch and torchvision:

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1" "torchvision==0.20.1"
python -m pip install -r requirements-dev.txt
python -m pip check
python -m pytest
python -m ruff check --select E9,F63,F7,F82 .
```

`pytest.ini` defines the test directory and strict marker checks. Use
`python -m ruff check .` for the full lint report, including existing style findings.

Frontend checks run inside `frontend/` with `npm ci`, `npm run test:unit` and
`npm run build`. Check and build the documentation site in its separate repository.

## Common Issues

### Port Already in Use

```
Error: [Errno 98] Address already in use
```

Fix: free the occupied port or start on a different one:

```bash
# Find the process using the port
lsof -i :8081

# Start backend on another port
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --port 8082
```

For Docker deployments, change the exposed port via `PEP_HTTP_PORT`:

```bash
PEP_HTTP_PORT=9090 docker compose up --build
```

### BLAST+ Not Found

```
FileNotFoundError: psiblast not found
```

PSSM / PSFM encoders depend on BLAST+. Install it:

```bash
sudo apt install ncbi-blast+
```

Verify `psiblast -version` outputs correctly afterward.

### Pretrained Model Download Failure

When the server cannot reach Hugging Face, it retries repeatedly. Fix:

1. Place pretrained model snapshots under the project `models/` directory
2. Enable offline mode:

```bash
export PEPPLATFORM_OFFLINE_MODE=1
```

See [CLI Only](./cli-only#step-5-offline-pretrained-models-optional).

### Python Version Mismatch

The supplied backend image and local setup instructions use Python 3.10. Check this baseline when diagnosing dependency installation or runtime errors:

```bash
python --version
```

Confirm the output is `Python 3.10.x`. Use conda or venv to create an isolated environment — see [CLI Only](./cli-only#step-2-prepare-the-python-environment).

## Next Steps

Once verification passes, you can:

- Read the [Concepts](../concepts/overview) to understand the platform design
- Check out [CLI Tools](../cli/tools) to start training
- Browse [Optional Config](./optional-config) to tune platform parameters
