# Quick Start

::: info Source availability
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

Use a deployed Web instance, the local CLI, or local frontend/backend development. Check available data and runtime resources before choosing a path.

## Path A: Deployed Web Instance

Use the PepPlatform service address provided by your administrator, then follow these steps.

1. Open the landing page and enter the workspace at `/dashboard`.
2. Guests can preview the interface. Personal data, upload, preflight, training, inference and AI calls require login.
3. Select an available built-in dataset or upload data in [Datasets](../web-ui/datasets). Entries appear only when their source files are deployed.
4. Use the [Experiment Wizard](../web-ui/experiment-wizard), select task/route, then review selection objectives and Preflight.
5. Confirm creation, monitor training and evaluation evidence, then use a resulting inference-capable model once its required resources are available.

## Path B: CLI Training

Use the current Python 3.10 deployment baseline. Install shared dependencies from the project root:

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements.txt
python scripts/train_sequence_pipeline.py --help
```

Prepare function-task data in the [supported format](../datasets/format), then run:

```bash
python scripts/train_sequence_pipeline.py --task_type pep_function \
  --data_dir /path/to/function-data --tokenizer kmer --encoder onehot \
  --model cnn --epochs 10 --batch_size 64 --lr 1e-3
```

If present, substitute `datasets/task_peptide_function/data_quick_384` for the example data path. The default full-data directory is different and is not guaranteed to accompany a clone. Training fits Train and uses Validation for checkpoint/threshold selection. Test results require an available test split and enabled test evaluation. Inspect the actual artifact directory for outputs.

No-argument task-specific scripts enter their wizards. Pair tasks use `scripts/train_pair_pipeline.py`. Pretrained routes need snapshots or download access; PSSM/PSFM routes additionally require BLAST and appropriate references/cache conditions. See [CLI Installation](../install/cli-only) and [Recipes](../cli/recipes).

## Path C: Local Web Development

In the backend terminal, install the Web layer and configure a stable AI-key encryption secret:

```bash
python -m pip install -r requirements-web.txt
export PEP_LLM_KEY_ENCRYPTION_SECRET='local-dev-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081
```

Frontend terminal, with Node.js 22 and npm:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Local SQLite is used when no database URL is configured. Prefer running without reload for training: backend restarts cancel active experiments. Use `PEP_AUTH_ENABLED=0` only when needed for isolated local development; `/` remains the landing page and `/dashboard` the workspace overview.

For production use [Docker Compose](../install/docker), then follow [Verification](../install/verify) and [Operations](../deploy/operations).
