# Models

The Models module manages trained models, supporting listing, viewing details, checking inference readiness, renaming, deleting, and listing inference runs.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## GET /api/models

- **Method**: `GET`
- **Path**: `/api/models`
- **Auth**: Login required
- **Purpose**: List model records visible to the current account under owner/administrator permissions.

```bash
curl http://127.0.0.1:8081/api/models \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
[
  {
    "id": "model-1",
    "name": "ESM2 + MLP model",
    "experiment_id": "exp-1",
    "task_type": "pep_protein_interaction",
    "supports_inference": true,
    "bundle_path": "/path/to/bundle",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

## GET /api/models/{model_id}

- **Method**: `GET`
- **Path**: `/api/models/{model_id}`
- **Auth**: Login required
- **Purpose**: Get a single model's details.

**Path parameters**:

| Param | Description |
| --- | --- |
| `model_id` | Model ID |

```bash
curl http://127.0.0.1:8081/api/models/model-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the model object. Permission denied returns `403`; not found returns `404`.

## GET /api/models/{model_id}/inference-readiness

- **Method**: `GET`
- **Path**: `/api/models/{model_id}/inference-readiness`
- **Auth**: Login required
- **Purpose**: Check the model's inference readiness, reporting whether it can run inference from raw sequences.

```bash
curl http://127.0.0.1:8081/api/models/model-1/inference-readiness \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "model_id": "model-1",
  "ready": true,
  "profile_required": false,
  "status": "not_required",
  "mode": "standard",
  "checks": [],
  "errors": [],
  "warnings": []
}
```

::: warning Profile dependency
Routes relying on PSSM/PSFM profile encoders check runtime profile-generation readiness. If the model bundle includes `profile_generation` artifacts and BLAST+ is available on the backend, inference can generate PSSM/PSFM on demand; older bundles without those artifacts are marked unavailable, with details in `errors` / `warnings`.
:::

::: tip Pair and graph models
Pair-model readiness depends on whether training emitted a reusable bundle. `sample_graph` routes also require graph reference features such as `graph_reference.pt` plus the matching model state; missing graph artifacts are reported as blocking checks.
:::

Not found returns `404`.

The readiness report covers the checks implemented for the bundle and its profile/graph dependencies. It does not execute a complete prediction or establish that every pretrained runtime, weight download and memory requirement is satisfied.

## PATCH /api/models/{model_id}

- **Method**: `PATCH`
- **Path**: `/api/models/{model_id}`
- **Auth**: Login required
- **Purpose**: Rename a model (max 120 characters).

```bash
curl -X PATCH http://127.0.0.1:8081/api/models/model-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Best ESM2 model"}'
```

Request body:

```json
{ "name": "Best ESM2 model" }
```

Example response excerpt (`200`; values are illustrative): returns the updated model object. Empty name returns `400`; name too long returns `400`; not found returns `404`.

## DELETE /api/models/{model_id}

- **Method**: `DELETE`
- **Path**: `/api/models/{model_id}`
- **Auth**: Login required
- **Purpose**: Delete a model and its artifact files.

```bash
curl -X DELETE http://127.0.0.1:8081/api/models/model-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "model_id": "model-1", "artifact_deleted": true }
```

Artifact deletion failure returns `500`; not found returns `404`.

## GET /api/models/{model_id}/inference-runs

- **Method**: `GET`
- **Path**: `/api/models/{model_id}/inference-runs`
- **Auth**: Login required
- **Purpose**: List inference runs for a given model.

```bash
curl http://127.0.0.1:8081/api/models/model-1/inference-runs \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns a list of inference run records. Model not found returns `404`.
