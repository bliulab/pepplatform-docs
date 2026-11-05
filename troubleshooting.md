# Troubleshooting

Grouped by problem domain. Each issue is a collapsible card with the **symptom, cause, and solution**. If your issue is not listed, start with [Requirements](./install/requirements) and [Local Web Development](./install/local-web).

## Installation & Startup

::: details Port already in use (:8081 backend / :5173 frontend)
**Symptom**: Starting the backend or frontend reports `Address already in use` or `EADDRINUSE`.

**Cause**: Port 8081 / 5173 is already occupied by another process.

**Solution**:

```bash
# Find the process using 8081
lsof -i :8081

# Kill it (replace <PID>)
kill <PID>

# Or start the backend on a different port
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8082
```

To change the frontend port, run `npm run dev -- --port 5174` inside `frontend/`. If the backend port changes, update the proxy target as described in [Local Web Development](./install/local-web#configure-frontend-proxy).
:::

::: details Python version mismatch
**Symptom**: `SyntaxError` or dependency install failures asking for a newer Python.

**Cause**: The source/image baseline uses Python 3.10; an older interpreter or an incompatible dependency build can cause this error.

**Solution**:

```bash
python --version
# Should print Python 3.10.x

# If not, create a 3.10 env with conda or pyenv
conda create -n pepplatform python=3.10
conda activate pepplatform
```
:::

::: details ModuleNotFoundError: No module named 'pepplatform'
Run the documented entry point from the platform source root. See [CLI Installation](./install/cli-only) for dependency setup and the [Database import guide](./install/database#importing-legacy-sqlite-into-postgresql) for the legacy SQLite import command.
:::

::: details pip install fails
**Symptom**: `pip install` errors out or hangs.

**Cause**: pip is outdated, or the Python version does not satisfy package requirements.

**Solution**:

```bash
python -m pip install --upgrade pip
python --version  # confirm 3.10
python -m pip install -r requirements-web.txt
```
:::

## BLAST+

::: details command not found: psiblast
**Symptom**: Using `--encoder pssm` or `--encoder psfm` raises `command not found: psiblast`.

**Cause**: BLAST+ command-line tools are not installed.

**Solution**:

```bash
# Ubuntu / Debian
sudo apt install ncbi-blast+

# CentOS / RHEL
sudo dnf install ncbi-blast+

# Verify
psiblast -version
```
:::

::: details Profile inference timeout
For Web inference, `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` controls BLAST subprocess timeouts (default 300 seconds). Set it in the backend environment:

```bash
export PEP_PROFILE_BLAST_TIMEOUT_SECONDS=600
```

Profile-cache construction uses the selected tool's timeout option instead; see [CLI Tools](./cli/tools).
:::

::: details PSSM/PSFM cache missing
Check the cache path and data split selected in the training configuration. For cache-building tools and their input/output parameters, see [CLI Tools](./cli/tools).
:::

## Pretrained Models

::: details Model download fails / network timeout
**Symptom**: Fetching ESM2/ProtBERT and other pretrained models times out or fails.

**Cause**: Hugging Face Hub is unreachable.

**Solution**: Enable offline mode with a local model snapshot:

```bash
PEPPLATFORM_OFFLINE_MODE=1 python scripts/train_sequence_pipeline.py \
  --task_type pep_function \
  --tokenizer esm2 \
  --esm2_model ./models/esm2 \
  --model cnn \
  --epochs 10
```
:::

::: details OSError: model not found
Check the model source selected for this run and whether its required files are available. For local snapshot locations and offline mode, see [CLI Installation](./install/cli-only#step-5-offline-pretrained-models-optional).
:::

::: details Hugging Face Hub unreachable
**Symptom**: Training waits a long time and then fails with a network error.

**Cause**: The server cannot reach huggingface.co directly.

**Solution**: Set an HF mirror endpoint, or download manually and run offline:

```bash
# Use a mirror (the platform also supports PEPPLATFORM_HF_ENDPOINT, defaulting to https://hf-mirror.com)
export HF_ENDPOINT=https://hf-mirror.com

# Or go fully offline
export PEPPLATFORM_OFFLINE_MODE=1
```
:::

## GPU / CUDA

::: details CUDA not available
**Symptom**: `torch.cuda.is_available()` returns `False` and training runs on CPU.

**Cause**: CUDA toolkit is missing or mismatched with the PyTorch version.

**Solution**:

```bash
nvidia-smi  # confirm the GPU driver is healthy
python -c "import torch; print(torch.version.cuda, torch.cuda.is_available())"
```

Reinstall PyTorch with the command matching your local CUDA from the [PyTorch website](https://pytorch.org/).
:::

::: details Out of memory (OOM)
**Symptom**: Training raises `CUDA out of memory`.

**Cause**: batch size or sequence length is too large for the GPU.

**Solution**:

```bash
# Reduce batch size
python scripts/train_sequence_pipeline.py --batch_size 16 ...

# Reduce max sequence length
python scripts/train_sequence_pipeline.py --max_length 512 ...
```
:::

::: details Slow training on CPU
**Symptom**: Without a GPU, training is very slow.

**Cause**: Large models are compute-heavy on CPU; this is expected.

**Solution**: Use a GPU, or switch to a smaller model (e.g. `--model cnn` instead of `transformer`, or the classic route instead of the pretrained route).
:::

## Web Authentication

::: details Email verification code not received
Inspect backend logs and the effective SMTP host, port, credentials, sender address and spam folder. The backend reads configuration at startup; apply changes during a suitable restart window. Restarting does not resume unfinished training automatically.

Use the transport and sender settings required by your mail provider. Compose does not forward every host environment variable; required overrides must reach the backend container. See [Environment Variables](./config/environment#smtp-email) and [Docker Configuration](./install/docker).

A registration response with `verification_sent: false` means delivery did not succeed. Development debug codes are controlled by `PEP_AUTH_DEBUG_CODES` and do not establish delivery of a real email.
:::

::: details Forgot password
**Symptom**: Cannot log in.

**Solution**: Use the password-reset endpoint:

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
```

Then follow the email instructions to finish the reset.
:::

::: details Want to skip login during development
**Symptom**: You don't want to log in every time during local development.

**Solution**:

```bash
PEP_AUTH_ENABLED=0 python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081
```
:::

## Web Training Experiments

::: details A new experiment is canceled / stopped within seconds
**Symptom**: A freshly created experiment ends within seconds, `train.log` stops at
`[web-runner] Preparing training resources and input versions.`, and the experiment
error reads `Training was stopped because the web service restarted before this experiment finished.`

**Cause**: The backend was started with a bare `--reload`, so the reloader watches the whole
project tree. Starting an experiment stages a source snapshot into
`.pepplatform_web/versions/staging/<tmp>/files/pepplatform/*.py`; WatchFiles treats those
`.py` writes as code changes, restarts the backend, and the startup
`cancel_active_experiments` call marks the unfinished experiment as canceled. The account,
dataset, and model route are not involved.

**Diagnose**: The backend log shows it directly.

```text
WARNING:  WatchFiles detected changes in '.pepplatform_web/versions/staging/.../pepplatform/*.py'. Reloading...
```

**Solution**: Scope reloading to the real source directories, or turn reload off while
training, then restart the backend.

```bash
# Keep the backend hot reload, but watch source only
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081

# Or run without hot reload during training
python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

Prefer `--reload-dir` to limit watched directories. Exclusion-glob behavior depends on the installed Uvicorn/Watchfiles versions and configuration. A canceled experiment cannot be resumed; resubmit it after changing
the startup flags.
:::

## Database

::: details Alembic migration fails
Inspect the specific error, connection settings and current migration revision:

```bash
alembic current
alembic history
```

See [Database Migrations](./deploy/migrations) and [Database Configuration](./install/database).
:::

::: details SQLite → PostgreSQL import
Follow the [Database import guide](./install/database#importing-legacy-sqlite-into-postgresql) for the command, dependencies and record-ownership behavior.
:::

## AI Provider

::: details Saved API keys unreadable after restart
**Symptom**: After restarting the backend, previously saved AI Provider API keys cannot be decrypted.

**Cause**: `PEP_LLM_KEY_ENCRYPTION_SECRET` changed, so old keys can no longer be decrypted.

**Solution**: Keep `PEP_LLM_KEY_ENCRYPTION_SECRET` stable across all restarts. If the original value is lost, reconfigure each provider's API key.
:::

::: details Provider test fails
**Symptom**: The AI Provider connection test fails in the Web UI.

**Cause**: The API key is invalid, the network is down, or the provider endpoint is unreachable.

**Solution**:

1. Verify the API key is correct and not expired.
2. Confirm the server can reach the provider endpoint (test with `curl`).
3. If a proxy is required, configure the relevant env vars and restart the backend.
:::
