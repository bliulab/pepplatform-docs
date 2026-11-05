# Experiments

The Experiments module is the core of PepPlatform's training workflow. It supports preflight validation before submission, creating and submitting training jobs, querying status, canceling, viewing logs and analysis results, and invoking AI to generate experiment analysis. After submission, experiments are executed asynchronously by the background Runner.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## GET /api/experiments

- **Method**: `GET`
- **Path**: `/api/experiments`
- **Auth**: Login required
- **Purpose**: List experiments visible to the current account, returning effective config (with default-value sources).

```bash
curl http://127.0.0.1:8081/api/experiments \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
[
  {
    "id": "exp-1",
    "name": "pep_protein_interaction experiment",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "status": "succeeded",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "requested_config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "config_parameter_sources": { "tokenizer": "explicit", "encoder": "explicit", "model": "explicit" },
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

## POST /api/experiments/preflight

- **Method**: `POST`
- **Path**: `/api/experiments/preflight`
- **Auth**: Login required
- **Purpose**: Validate experiment config before submission; returns the normalized config and validation result.

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/preflight \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
  }'
```

Request body:

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "valid": true,
  "errors": [],
  "error_codes": [],
  "normalized_config": {
    "task_type": "pep_protein_interaction",
    "tokenizer": "esm2",
    "encoder": "esm2",
    "model": "mlp"
  }
}
```

Preflight also returns fields such as `warnings`, `warning_codes` and `parameter_sources`. A valid report establishes only the checks performed: it does not prove that weights can be downloaded, memory is sufficient or every runtime is ready. For example, ESM3 checks its SDK during initialization.

## POST /api/experiments

- **Method**: `POST`
- **Path**: `/api/experiments`
- **Auth**: Login required
- **Purpose**: Create and submit a training experiment. Runs preflight first; on success, the Runner executes it asynchronously.

```bash
curl -X POST http://127.0.0.1:8081/api/experiments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "ESM2 + MLP experiment",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
  }'
```

Request body:

```json
{
  "name": "ESM2 + MLP experiment",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
}
```

Example response excerpt (`200`; values are illustrative): returns the new experiment object (with `status: "queued"`). Preflight failure returns `400`; quota exceeded returns `429`.

## GET /api/experiments/{experiment_id}

- **Method**: `GET`
- **Path**: `/api/experiments/{experiment_id}`
- **Auth**: Login required
- **Purpose**: Get a single experiment's details, including effective config and parameter sources.

**Path parameters**:

| Param | Description |
| --- | --- |
| `experiment_id` | Experiment ID |

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the experiment object (with `config`, `requested_config`, `config_parameter_sources`). Permission denied returns `403`; not found returns `404`.

## DELETE /api/experiments/{experiment_id}

- **Method**: `DELETE`
- **Path**: `/api/experiments/{experiment_id}`
- **Auth**: Login required
- **Purpose**: Delete an experiment and its artifacts (including associated model artifacts). Only finished (succeeded/failed/canceled) experiments can be deleted.

```bash
curl -X DELETE http://127.0.0.1:8081/api/experiments/exp-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "experiment_id": "exp-1",
  "artifact_deleted": true,
  "model_artifacts_deleted": 1
}
```

Experiment still running returns `409`; not found returns `404`.

## POST /api/experiments/{experiment_id}/cancel

- **Method**: `POST`
- **Path**: `/api/experiments/{experiment_id}/cancel`
- **Auth**: Login required
- **Purpose**: Cancel a queued or running experiment.

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/exp-1/cancel \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the updated experiment object (`status` becomes `canceled`). Uncancellable state returns `409`; not found returns `404`.

## GET /api/experiments/{experiment_id}/logs

- **Method**: `GET`
- **Path**: `/api/experiments/{experiment_id}/logs`
- **Auth**: Login required
- **Purpose**: Get the training log text.

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1/logs \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "content": "Epoch 1/10 - loss: 0.45 - val_loss: 0.50\n..." }
```

Returns an empty string when the log file does not exist.

## GET /api/experiments/{experiment_id}/analysis

- **Method**: `GET`
- **Path**: `/api/experiments/{experiment_id}/analysis`
- **Auth**: Login required
- **Purpose**: Get the experiment analysis result (with evaluation metrics). Returns an empty analysis structure with a warning if the analysis artifact cannot be read.

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1/analysis \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

Read the generated `metrics`, `curves`, projection/importance results and `warnings`. Missing analyses can be represented by `available: false` or empty structures; inspect the actual fields. Example values are not platform performance results.

## POST /api/experiments/{experiment_id}/ai-analysis

- **Method**: `POST`
- **Path**: `/api/experiments/{experiment_id}/ai-analysis`
- **Auth**: Login required
- **Purpose**: Invoke AI to generate an experiment analysis and summary, with customizable prompt and language.

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/exp-1/ai-analysis \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "prompt": "Summarize this experiment, explain the strongest evidence in the metrics, and recommend the next experiment to run.",
    "language": "en"
  }'
```

Request body:

```json
{
  "provider_config_id": "prov-1",
  "prompt": "Summarize this experiment, explain the strongest evidence in the metrics, and recommend the next experiment to run.",
  "include": {},
  "language": "en",
  "max_tokens": 1200
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "answer": "This experiment used ESM2 + MLP...",
  "provider": "deepseek",
  "model": "deepseek-flash",
  "usage": { "total_tokens": 900 },
  "context_manifest": { "sections": [] },
  "warnings": []
}
```

Disabled provider returns `400`; configuration error returns `503`; provider error returns `502`.

## POST /api/experiments/{experiment_id}/resume-downstream

Creates a downstream resume run for a failed SVM experiment. The source must be visible, have status `failed`, and retain an intact resume bundle. The classifier and calibration mode stay SVM-compatible. Creation performs ordinary Preflight and experiment quota checks.

```json
{"overrides": {"svm_max_iter": 10000, "svm_convergence_policy": "bounded_retry"}}
```

Allowed override fields are `svm_c`, `svm_class_weight`, `svm_max_iter`, `svm_tol`, `svm_kernel`, `svm_gamma`, `svm_convergence_policy`, `ml_scaler`, `ml_reduction`, `ml_reduction_dim`, `pca_dense_memory_limit_gib`, `kpca_memory_limit_gib`, `kpca_kernel`, `kpca_gamma`, `ml_auto_tune`, `ml_tuning_budget`, `ml_tuning_objective`, `ml_tuning_mode`, `ml_tuning_max_candidates`, `ml_cv_folds`. Unknown fields return 400; unsuitable source state or bundles return 409. Success returns a new experiment without overwriting the source. `resume` records source, stage and bundle identity.

## Experiment Diagnostic Conversations

Endpoints enforce account/experiment visibility. Diagnostic history is stored separately from general research chat.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/experiments/{experiment_id}/analysis/conversations` | List using `q`, `limit=50`, `offset=0` |
| GET | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | Messages using `limit=100`, `before_ordinal` |
| PATCH | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | Rename with `title` or pin with `pinned` |
| DELETE | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | Delete the conversation and messages |
| GET | `/api/experiments/{experiment_id}/analysis/messages/{message_id}` | Read a message and structured report |
| POST | `/api/experiments/{experiment_id}/analysis/stream` | Generate an initial report or follow-up |

Streaming request:

```json
{"provider_config_id": "prov-1", "content": "Explain the validation evidence", "language": "en", "max_tokens": 4000, "include": {}}
```

Add `conversation_id` for follow-up. Running and terminal experiments are accepted; queued experiments return 409. The first turn produces a structured report and may emit `stage`; follow-up chat emits `delta`. `meta` provides conversation/message records, `done` returns the persisted message, and `error` reports failures and persistence state. Diagnostics do not search the web or create training candidates directly. Handoff to AI planning still requires user confirmation.

See [Version API](./versions) and [Visualization API](./visualizations).

## PATCH /api/experiments/{experiment_id}

Rename a visible experiment with `{"name": "New name"}`. The trimmed name must contain 1–120 characters and no control characters. Returns the updated experiment. Invalid input returns 400. This updates the name without modifying its training configuration.
