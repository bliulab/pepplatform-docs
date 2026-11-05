# Inference

The Inference module runs predictions against trained models. It supports two input modes — a sequences list or peptide-protein pairs — and enforces inference quota limits. Inference results can be exported as CSV or deleted.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## POST /api/models/{model_id}/predict

- **Method**: `POST`
- **Path**: `/api/models/{model_id}/predict`
- **Auth**: Login required
- **Purpose**: Run inference, accepting `sequences` for single-sequence models or `pairs` for pair models, enforcing inference quota.

**Path parameters**:

| Param | Description |
| --- | --- |
| `model_id` | Model ID |

```bash
# Single-sequence model
curl -X POST http://127.0.0.1:8081/api/models/model-1/predict \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sequences": ["ACDEFGHIKL", "MNPQRSTVWY"]
  }'

# Pair model
curl -X POST http://127.0.0.1:8081/api/models/model-1/predict \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "pairs": [
      {"peptide": "ACDEFGHIK", "protein": "MNPQRSTVWY"}
    ]
  }'
```

Request body (choose one shape according to model type):

```json
{
  "sequences": ["ACDEFGHIKL", "MNPQRSTVWY"],
  "pairs": [
    { "peptide": "ACDEFGHIK", "protein": "MNPQRSTVWY" }
  ]
}
```

::: tip Input modes
`sequences` accepts a string (auto-wrapped into a single-element list) or a list; `pairs` is a list of objects, each with `peptide` and `protein`. The backend only requires at least one input shape, but prediction consumes the shape that matches the model bundle type, so avoid mixing both in one request.
:::

::: tip Inference-ready routes
The inference endpoint supports routes that emitted reusable bundles during training: single-sequence models, pretrained embedding/classical models, pair vector/token/sequence/embedding models, and pair graph models with reference graph artifacts. Models marked `metrics only` or bundles missing required artifacts return `409`.
:::

::: warning Profile inference
Models using PSSM/PSFM profile features may generate profiles at inference time and include `diagnostics.profile` in the response. This requires BLAST+ on the backend and `profile_generation` metadata such as the subject FASTA / BLAST DB in the model bundle; otherwise the request returns `409` with the blocking reason.
:::

Example response excerpt (`200`; values are illustrative):

```json
{
  "labels": ["non_interaction", "interaction"],
  "thresholds": [0.41, 0.57],
  "score_kind": "probability",
  "legacy_evaluation_protocol": false,
  "predictions": [
    {
      "sequence": "ACDEFGHIKL",
      "scores": [0.32, 0.68],
      "predicted_labels": ["interaction"]
    }
  ],
  "run_id": "run-1"
}
```

For sequence classical classifiers, `score_kind` follows the actual downstream classifier: uncalibrated `svm` returns `margin`, while probability-based routes return `probability`. Both single-label and multi-label predictions use the validation operating point saved in the bundle.

Pair-model response example:

```json
{
  "model_id": "model-1",
  "labels": ["non_interaction", "interaction"],
  "predictions": [
    {
      "peptide": "ACDEFGHIK",
      "protein": "MNPQRSTVWY",
      "score": 0.82,
      "score_kind": "probability",
      "threshold": 0.5,
      "is_interaction": true,
      "prediction_label": "Interact",
      "scores": [0.82]
    }
  ],
  "run_id": "run-1"
}
```

Quota exceeded returns `429`; unsupported inference or missing inference artifacts return `409`; not found returns `404`.

## GET /api/inference-runs/{run_id}/csv

- **Method**: `GET`
- **Path**: `/api/inference-runs/{run_id}/csv`
- **Auth**: Login required
- **Purpose**: Download an inference run's predictions as a CSV file.

**Path parameters**:

| Param | Description |
| --- | --- |
| `run_id` | Inference run ID |

```bash
curl http://127.0.0.1:8081/api/inference-runs/run-1/csv \
  -b cookies.txt \
  -o predictions.csv
```

Example response excerpt (`200`; values are illustrative): returns a `text/csv` file (`Content-Disposition: attachment`); columns include `input_index`, `sequence` (or `peptide`/`protein`), `top_label`, `top_score`, `predicted_labels`, and per-label score and validation-threshold columns. Permission denied returns `403`; not found returns `404`.

## DELETE /api/inference-runs/{run_id}

- **Method**: `DELETE`
- **Path**: `/api/inference-runs/{run_id}`
- **Auth**: Login required
- **Purpose**: Delete an inference run record.

```bash
curl -X DELETE http://127.0.0.1:8081/api/inference-runs/run-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "run_id": "run-1", "deleted": true }
```

Permission denied returns `403`; not found returns `404`.

## POST /api/models/{model_id}/predict/stream

Uses the same request body and quota checks as ordinary `/predict`, returning `text/event-stream`. Events are `stage`, final `done` (complete prediction response with saved-history information), or `error`; idle connections may receive SSE comment heartbeats. Authentication/input failures before streaming still use ordinary HTTP errors. Once streaming begins, inspect the terminal event instead of treating HTTP 200 as proof of success.

Both prediction forms use saved validation thresholds and preserve account-scoped inference history. Rank-ensemble scores depend on the complete batch: do not split requests into individual rows or interpret rank scores as probabilities. Raw SVM margins are not calibrated probabilities either; see [Classifiers](../concepts/classifiers).
