# Ensemble API

With authentication enabled, these endpoints require login and enforce dataset/model visibility. Ensembles use their dedicated creation endpoint; normal experiment creation rejects a `web_ensemble` configuration.

## GET /api/ensembles/capabilities

Returns `enabled`, `schema_version`, tasks, methods, weight sources, objectives and defaults. Methods are `probability_mean`, `logit_mean`, `rank_mean`; weight sources are `equal`, `custom`, `validation`. `evaluate_test` defaults to `false`.

## POST /api/ensembles/preflight

Example request; replace IDs with resources available to the current account:

```json
{
  "name": "Validation ensemble",
  "task_type": "pep_function",
  "dataset_id": "builtin-pep-function-quick",
  "member_ids": ["model-a", "model-b"],
  "method": "probability_mean",
  "weight_source": "equal",
  "objective": "macro_f1",
  "threshold_objective": "macro_f1",
  "grid_step": 0.05,
  "seed": 42,
  "evaluate_test": false
}
```

Omitting `schema_version` uses the definition format supported by the backend.

Custom weights add a `weights` array in member order. A `dual_f1_sacc` objective needs the corresponding `objective_params` or `threshold_objective_params` with both references. A successful report includes `valid`, `errors`, `error_codes`, normalized `definition`, `label_names`, `validation_count`, member summaries and `validation_policy`. Invalid preflight generally returns HTTP 200 with `valid: false`; inspect the report.

## POST /api/ensembles

Accepts the same fields, creates and queues an ordinary experiment, and returns the experiment object. Names contain 1–120 characters. Disabled creation returns 409, invalid definitions return 400, and creation enforces experiment quotas. Members require current evaluation metadata, matching labels and validation identities, and Web-managed storage; nested ensembles are rejected.

Inspect results through ordinary experiment, model and inference endpoints. `rank_mean` requires at least two rows in a complete inference batch and is batch-dependent. See the [Ensemble Guide](../web-ui/ensembles).
