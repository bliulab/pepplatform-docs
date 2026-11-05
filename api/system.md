# System

The System module provides platform health checks, the capability manifest, and model leaderboard queries. The health check and capabilities endpoints are accessible without authentication.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## GET /api/health

- **Method**: `GET`
- **Path**: `/api/health`
- **Auth**: None
- **Purpose**: Health check, reporting the readiness of the profile-inference dependency.

```bash
curl http://127.0.0.1:8081/api/health
```

Response `200` (excerpt):

```json
{
  "ok": true,
  "dependencies": {
    "profile_inference": {
      "ready": false,
      "status": "blocked"
    }
  }
}
```

`profile_inference.ready` reflects the BLAST executable and profile smoke checks in this environment. It does not validate every model’s references, weights or complete inference path. HTTP 200 and `ok: true` do not establish readiness of all dependencies; inspect `checks` and `errors`.

## GET /api/capabilities

Public endpoint returning the current platform taxonomy and constraints. The following response is an excerpt captured from `build_capabilities()`; it is not a complete response or a statement that every Cartesian combination is supported. Use Preflight for a concrete experiment.

```bash
curl http://127.0.0.1:8081/api/capabilities
```

<!-- BEGIN CAPABILITIES EXCERPT -->
```json
{
  "tasks": [
    {
      "id": "pep_function",
      "label": "Therapeutic peptide function prediction"
    },
    {
      "id": "pep_protein_interaction",
      "label": "Peptide–protein interaction prediction"
    },
    {
      "id": "pep_hlaii",
      "label": "Peptide–HLA-II ligand presentation prediction"
    },
    {
      "id": "pep_hlai",
      "label": "Peptide–HLA-I ligand presentation prediction"
    }
  ],
  "feature_routes": [
    "pretrained",
    "classic"
  ],
  "pretrained_tokenizers": [
    "esm2",
    "protbert",
    "prott5",
    "esmc",
    "esm3"
  ],
  "classic_tokenizers": [
    "kmer",
    "dr",
    "top-n-gram",
    "dt",
    "bpe",
    "wordpiece",
    "unigram"
  ],
  "pair_strategies": [
    "single_stream",
    "two_stream"
  ],
  "pair_strategy_aliases": {
    "single_stream": "single_stream",
    "single-stream": "single_stream",
    "two_stream": "two_stream",
    "two-stream": "two_stream",
    "single_tower": "single_stream",
    "single-tower": "single_stream",
    "dual_tower": "two_stream",
    "dual-tower": "two_stream"
  },
  "modeling_architectures": {
    "sequence": [
      "cnn",
      "rnn",
      "gru",
      "lstm",
      "transformer"
    ],
    "chain_graph": [
      "gcn",
      "gat"
    ]
  },
  "classifiers": [
    "mlp",
    "svm",
    "rf",
    "extratrees",
    "histgb",
    "xgb",
    "lgb",
    "logreg"
  ],
  "training_modes": [
    "end_to_end",
    "export_embeddings"
  ],
  "selection_objectives": [
    {
      "id": "f1",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "binary"
      ],
      "metric": "f1",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "macro_f1",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "f1",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "sacc",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "multilabel"
      ],
      "metric": "sacc",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "auc",
      "direction": "max",
      "requires_predictions": false,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "auc",
      "requires_both_classes": true,
      "parameters": []
    },
    {
      "id": "aupr",
      "direction": "max",
      "requires_predictions": false,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "aupr",
      "requires_both_classes": true,
      "parameters": []
    },
    {
      "id": "dual_f1_sacc",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "multilabel"
      ],
      "metric": "dual_score",
      "requires_both_classes": false,
      "parameters": [
        "reference_f1",
        "reference_sacc"
      ]
    }
  ],
  "semantic_relation_types": [
    "intrinsic_label_jaccard",
    "interaction_profile_jaccard"
  ],
  "task_semantic_relation_type": {
    "pep_function": "intrinsic_label_jaccard",
    "pep_protein_interaction": "interaction_profile_jaccard",
    "pep_hlaii": "interaction_profile_jaccard",
    "pep_hlai": "interaction_profile_jaccard"
  }
}
```
<!-- END CAPABILITIES EXCERPT -->

The response also includes `route_families`, `encoder_specs`, `output_kinds`, `predictor_parts`, `defaults`, `classic_encoder_options`, `pretrained_models`, `tokenizer_constraints`, `classical_tuning`, `sequence_profile_contract`, `frequency_encoder_contract`, `covariance_encoder_contract`, `pdt_encoder_contract`, `pssm_covariance_encoder_contract`, `feature_transformations`, `pair_feature_transformations`, `lsa_contract`, `lda_contract`, `plsa_contract`, `svm_calibration`, `route_constraints`, interaction and semantic defaults. `sequence_models` is a compatibility field; new clients should read `modeling_architectures` and route constraints. Deprecated task-specific semantic-mode fields are no longer returned. See [Selection Objectives](../concepts/selection-objectives) and [Feature Routes](../concepts/routes).

## GET /api/leaderboard

- **Method**: `GET`
- **Path**: `/api/leaderboard`
- **Auth**: Login required
- **Purpose**: Query the model leaderboard with filtering by task type, dataset, metric, and split. Admins can view a global (cross-user) view.

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `task_type` | string | empty | Filter by task type |
| `dataset_id` | string | empty | Filter by dataset |
| `metric` | string | `f1` | Sort metric |
| `split` | string | `auto` | Evaluation split |
| `supports_inference` | bool | empty | Filter by inference support |
| `status` | string | `succeeded` | Filter by experiment status |
| `limit` | int | 200 | Max rows to return |
| `global_view` | bool | false | Admin global (cross-user) view |

```bash
curl "http://127.0.0.1:8081/api/leaderboard?task_type=pep_protein_interaction&metric=f1&limit=50" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "rows": [
    {
      "model_id": "model-1",
      "model_name": "ESM2 + MLP model",
      "experiment_id": "exp-1",
      "task_type": "pep_protein_interaction",
      "dataset_id": "builtin-ppi-quick",
      "metric": "f1",
      "split": "test",
      "score": 0.82,
      "supports_inference": true,
      "status": "succeeded"
    }
  ],
  "total": 1,
  "metric": "f1",
  "split": "auto",
  "filters": {
    "task_type": "pep_protein_interaction",
    "dataset_id": "",
    "supports_inference": null,
    "status": "succeeded",
    "limit": 50,
    "global_view": false
  }
}
```

Invalid metric value returns `400`.
