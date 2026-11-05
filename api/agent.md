# AI Planning API (compatibility namespace)

The user interface calls this module the AI Workspace and Experiment Planning. The `/api/agent` namespace and execution-plan identifiers remain for client compatibility. The web workflow plans and reviews candidates, while every experiment is confirmed by the user in the Experiment Wizard.

`POST /api/agent/experiment-batches` and `POST /api/agent/execution-plans/{plan_id}/execute` are deprecated compatibility endpoints. Responses include `Deprecation: true` and `Warning: 299`; new clients should use the single-action confirm path through the Experiment Wizard.

## POST /api/agent/chat/stream

`POST /api/agent/chat/stream` creates a persistent streaming chat turn. The optional `web_search` boolean defaults to `false`; when true, the backend performs at most one Tavily Basic Search after verifying that the server key is on the free Researcher plan with remaining quota.

```json
{
  "conversation_id": "optional-existing-id",
  "provider_config_id": "prov-1",
  "content": "Answer this with current web sources",
  "language": "en",
  "max_tokens": 3000,
  "temperature": 0.3,
  "web_search": true
}
```

The SSE sequence can contain `meta`, `search`, `delta`, `done`, and `error` events. Search failures are reported through `search` and the final message's structured `web_search` field, then fall back to a normal answer. `GET /api/agent/web-search/status` returns configuration, availability, remaining free quota, and reset date without exposing the API key. Conversation messages retain numbered source records in history.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## POST /api/agent/experiment-design

- **Method**: `POST`
- **Path**: `/api/agent/experiment-design`
- **Auth**: Login required
- **Purpose**: Generate experiment design candidates via AI based on dataset context. Supports automatic repair retry on failure.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/experiment-design \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "Recommend the next three experiment configurations",
    "language": "en",
    "max_tokens": 2200
  }'
```

Request body:

```json
{
  "provider_config_id": "prov-1",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "Recommend the next three experiment configurations",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "en",
  "max_tokens": 2200
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "candidates": [
    {
      "id": "lane-1",
      "lane": "candidate-1",
      "title": "ESM2 + MLP baseline",
      "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
      "valid": true
    }
  ],
  "provider": "deepseek",
  "model": "deepseek-flash",
  "usage": { "total_tokens": 1800 },
  "context_manifest": { "context_chars": 4200 },
  "context_summary": "dataset: builtin-ppi-quick, task: pep_protein_interaction",
  "repair_attempted": false,
  "repair_succeeded": false,
  "warnings": []
}
```

Disabled provider returns `400`; configuration error returns `503`; provider or parse error returns `502`.

## POST /api/agent/experiment-batches

> Deprecated: currently retained for compatibility. Confirm one planning candidate through the Experiment Wizard instead.

- **Method**: `POST`
- **Path**: `/api/agent/experiment-batches`
- **Auth**: Login required
- **Purpose**: Create and submit a batch of 1-3 experiments. Each candidate is preflight-validated first; experiments are created only if all pass.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/experiment-batches \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "Compare three encoders",
    "candidates": [
      { "lane": "a", "title": "ESM2 baseline", "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" } },
      { "lane": "b", "title": "BoW + SVM baseline", "config": { "tokenizer": "kmer", "encoder": "bow", "model": "svm" } }
    ]
  }'
```

Request body:

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "Compare three encoders",
  "candidates": [
    { "lane": "a", "title": "ESM2 baseline", "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" } }
  ]
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "batch_id": "f0e1d2c3",
  "created_experiments": [
    {
      "candidate_id": "a-1",
      "lane": "a",
      "title": "ESM2 baseline",
      "experiment": { "id": "exp-1", "name": "Agent a: ESM2 baseline", "status": "queued" }
    }
  ],
  "warnings": []
}
```

Candidate count outside 1-3 returns `400`; preflight failure returns `400` (with rejected candidate details); quota exceeded returns `429`.

## POST /api/agent/campaigns

- **Method**: `POST`
- **Path**: `/api/agent/campaigns`
- **Auth**: Login required
- **Purpose**: Create an iterative optimization campaign with a dataset, task type, objective, and max rounds (1-20).

```bash
curl -X POST http://127.0.0.1:8081/api/agent/campaigns \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "Iteratively optimize peptide-protein interaction models",
    "max_rounds": 3
  }'
```

Request body:

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "Iteratively optimize peptide-protein interaction models",
  "max_rounds": 3
}
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "id": "camp-1",
  "task_type": "pep_protein_interaction",
  "dataset_id": "builtin-ppi-quick",
  "objective": "Iteratively optimize peptide-protein interaction models",
  "max_rounds": 3,
  "current_round_index": 0,
  "status": "active",
  "plans": []
}
```

Dataset task_type mismatch returns `400`.

## GET /api/agent/campaigns

- **Method**: `GET`
- **Path**: `/api/agent/campaigns`
- **Auth**: Login required
- **Purpose**: List campaigns, with filtering by dataset, task type, status, and pagination.

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `dataset_id` | string | empty | Filter by dataset |
| `task_type` | string | empty | Filter by task type |
| `status` | string | empty | Filter by status |
| `limit` | int | 20 | Page size (max 100) |
| `offset` | int | 0 | Offset |

```bash
curl "http://127.0.0.1:8081/api/agent/campaigns?status=active&limit=10" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "campaigns": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

## GET /api/agent/campaigns/{campaign_id}

- **Method**: `GET`
- **Path**: `/api/agent/campaigns/{campaign_id}`
- **Auth**: Login required
- **Purpose**: Get a single campaign with all its execution plans.

**Path parameters**:

| Param | Description |
| --- | --- |
| `campaign_id` | Campaign ID |

```bash
curl http://127.0.0.1:8081/api/agent/campaigns/camp-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the campaign object; the `plans` field contains all execution plans under this campaign. Not found returns `404`.

## POST /api/agent/campaigns/{campaign_id}/rounds

- **Method**: `POST`
- **Path**: `/api/agent/campaigns/{campaign_id}/rounds`
- **Auth**: Login required
- **Purpose**: Generate the next execution-plan round. Requires the previous round's experiments to be complete and reviewed, otherwise returns `409`.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/campaigns/camp-1/rounds \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "language": "en",
    "max_tokens": 2200
  }'
```

Request body (`provider_config_id` required, rest optional):

```json
{
  "provider_config_id": "prov-1",
  "objective": "Optimize based on previous round review",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "en",
  "max_tokens": 2200
}
```

Example response excerpt (`200`; values are illustrative): returns the newly generated execution plan. Campaign not active returns `409`; max rounds reached returns `409`; previous round unfinished or not reviewed returns `409`.

## POST /api/agent/execution-plans

- **Method**: `POST`
- **Path**: `/api/agent/execution-plans`
- **Auth**: Login required
- **Purpose**: Generate a standalone execution plan via AI (not bound to a campaign), containing create/cancel experiment actions.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "Plan the next approved experiment actions",
    "language": "en"
  }'
```

Request body:

```json
{
  "provider_config_id": "prov-1",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "Plan the next approved experiment actions",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "en",
  "max_tokens": 2200
}
```

Example response excerpt (`200`; values are illustrative): returns the execution plan object with `actions`, `context_manifest`, `trace`, etc.

## GET /api/agent/execution-plans

- **Method**: `GET`
- **Path**: `/api/agent/execution-plans`
- **Auth**: Login required
- **Purpose**: List execution plans, with filtering by dataset, task type, status, campaign, and pagination.

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `dataset_id` | string | empty | Filter by dataset |
| `task_type` | string | empty | Filter by task type |
| `status` | string | empty | Filter by status |
| `campaign_id` | string | empty | Filter by campaign |
| `limit` | int | 20 | Page size (max 100) |
| `offset` | int | 0 | Offset |

```bash
curl "http://127.0.0.1:8081/api/agent/execution-plans?status=draft&limit=10" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "plans": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

## DELETE /api/agent/execution-plans/{plan_id}

- **Method**: `DELETE`
- **Path**: `/api/agent/execution-plans/{plan_id}`
- **Auth**: Login required
- **Purpose**: Delete an execution plan. Rejects deletion if queued or running experiments still exist.

```bash
curl -X DELETE http://127.0.0.1:8081/api/agent/execution-plans/plan-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "plan_id": "plan-1", "deleted": true }
```

Unfinished experiments return `409`; not found returns `404`.

## GET /api/agent/execution-plans/{plan_id}

- **Method**: `GET`
- **Path**: `/api/agent/execution-plans/{plan_id}`
- **Auth**: Login required
- **Purpose**: Get a single execution plan, automatically refreshing the execution status of linked experiments.

```bash
curl http://127.0.0.1:8081/api/agent/execution-plans/plan-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the execution plan object (with `actions`, `execution`, `status`, etc.). Not found returns `404`.

## POST /api/agent/execution-plans/{plan_id}/refresh

- **Method**: `POST`
- **Path**: `/api/agent/execution-plans/{plan_id}/refresh`
- **Auth**: Login required
- **Purpose**: Refresh the plan's execution status, syncing the latest state of linked experiments and updating progress.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/refresh \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the refreshed execution plan. Not found returns `404`.

## PATCH /api/agent/execution-plans/{plan_id}/actions/{action_id}

- **Method**: `PATCH`
- **Path**: `/api/agent/execution-plans/{plan_id}/actions/{action_id}`
- **Auth**: Login required
- **Purpose**: Edit the config of a pending `create_experiment` action. Executed actions or non-create actions cannot be edited.

```bash
curl -X PATCH http://127.0.0.1:8081/api/agent/execution-plans/plan-1/actions/act-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "title": "Adjusted experiment"
  }'
```

Request body:

```json
{
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
  "title": "Adjusted experiment"
}
```

Example response excerpt (`200`; values are illustrative): returns the updated execution plan. Action not found returns `404`; non-editable state returns `409`; `config` not an object returns `400`.

## POST /api/agent/execution-plans/{plan_id}/actions/{action_id}/confirm

- **Method**: `POST`
- **Path**: `/api/agent/execution-plans/{plan_id}/actions/{action_id}/confirm`
- **Auth**: Login required
- **Purpose**: Confirm one pending `create_experiment` action from the Experiment Wizard. The backend reruns Preflight on the final configuration, validates task, dataset, plan ownership, and quota, creates the experiment, and updates plan progress.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/actions/act-1/confirm \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Human-reviewed Agent candidate",
    "task_type": "pep_function",
    "dataset_id": "dataset-1",
    "config": { "tokenizer": "kmer", "encoder": "index", "model": "cnn" }
  }'
```

Example response excerpt (`200`; values are illustrative): returns the queued experiment. Retrying the same confirmed action returns the original experiment without creating a duplicate. Final Preflight failure returns `400`; context or action-state conflicts return `409`; quota exceeded returns `429`.

## POST /api/agent/execution-plans/{plan_id}/execute

> Deprecated: currently retained for compatibility. Use `/actions/{action_id}/confirm` instead.

- **Method**: `POST`
- **Path**: `/api/agent/execution-plans/{plan_id}/execute`
- **Auth**: Login required
- **Purpose**: Compatibility endpoint for older batch-execution clients. The current Web UI does not call it; new integrations should send one candidate through the Wizard and use the `confirm` endpoint above.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/execute \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "approved_action_ids": ["act-1", "act-2"] }'
```

Request body:

```json
{ "approved_action_ids": ["act-1", "act-2"] }
```

Example response excerpt (`200`; values are illustrative): returns the updated execution plan; `execution` includes `created_experiments` and `canceled_experiments`. Missing or invalid approved actions return `400`; quota exceeded returns `429`.

## POST /api/agent/execution-plans/{plan_id}/review

- **Method**: `POST`
- **Path**: `/api/agent/execution-plans/{plan_id}/review`
- **Auth**: Login required
- **Purpose**: AI-review an executed plan, generating a summary and next-step recommendations. Requires all experiments to be complete.

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/review \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "prompt": "Review this executed plan and recommend the next approved actions",
    "language": "en"
  }'
```

Request body:

```json
{
  "provider_config_id": "prov-1",
  "prompt": "Review this executed plan and recommend the next approved actions",
  "include": {},
  "language": "en",
  "max_tokens": 1600
}
```

Example response excerpt (`200`; values are illustrative): returns the updated execution plan; the `review` field contains the AI-generated summary, recommendations, and risk assessment. Unfinished experiments return `409`; no report available returns `409`; provider errors return `502`/`503`.

## Streaming Planning and Review

| Method | Path | Non-streaming counterpart |
| --- | --- | --- |
| POST | `/api/agent/execution-plans/stream` | Generate a plan |
| POST | `/api/agent/campaigns/{campaign_id}/rounds/stream` | Create the next campaign round |
| POST | `/api/agent/execution-plans/{plan_id}/review/stream` | Review a plan |

Requests and permissions follow the corresponding non-streaming endpoints. Responses use SSE, primarily `stage` and final `done`; the final event data contains `plan`. Heartbeats are SSE comments and failures use `error`. Progress does not establish that a complete plan was saved. Planning/review does not execute experiments automatically; candidates still follow the confirmation-to-wizard workflow. Research-chat `delta` events are a separate protocol.

## POST /api/agent/chat

Compatibility non-streaming chat. Requires login, an enabled `provider_config_id` and a nonempty `messages` list containing message objects. It returns a complete answer without creating persistent conversation history. New clients should use the streaming endpoint for account-scoped history.

## Research Chat History

Chat history is account-scoped, with model/provider snapshots on each assistant message. A conversation can switch providers/models between turns. Model context is bounded to the last 40 nonempty messages and 60,000 characters; saved history remains available beyond that context window. Disconnecting preserves the generated portion as stopped. Administrators cannot read another account’s private conversations.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/agent/chat/conversations` | Search with `q`, paginate with `limit=50`, `offset=0` |
| GET | `/api/agent/chat/conversations/{conversation_id}` | Read messages with `limit=100`, `before_ordinal` |
| PATCH | `/api/agent/chat/conversations/{conversation_id}` | Rename with `title` or pin with `pinned` |
| DELETE | `/api/agent/chat/conversations/{conversation_id}` | Delete the conversation and messages |
| GET | `/api/agent/web-search/status` | Availability, free quota and reset date, without exposing credentials |
