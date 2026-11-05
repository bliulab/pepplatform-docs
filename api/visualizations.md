# Visualization API

The base path is `/api/experiments/{experiment_id}/visualizations`. Endpoints enforce login and experiment visibility. They read frozen evidence from successful Web-managed runs without training, inference or threshold refitting.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/experiments/{experiment_id}/visualizations/capabilities` | Available splits, labels, analysis kinds and reasons for unavailability |
| POST | `/api/experiments/{experiment_id}/visualizations/jobs` | Submit or reuse cached work for identical evidence and parameters |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}` | Read job status |
| POST | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/cancel` | Cancel queued/running work |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/result` | Read paged results using `row_offset`, `column_offset`, `search` |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/export` | `format=csv` downloads the full aggregate table; `format=json` returns metadata without large matrices |

## Request Parameters

```json
{"split": "validation", "kind": "stratified", "metric": "aupr"}
```

Choose `split` from capabilities. Kinds are `stratified`, `labels`, `patterns`. Stratified metrics are `acc`, `f1`, `auc`, `aupr`, `count`, `prevalence`, with `aupr` as default. Pattern analysis accepts `pattern` values `truth`, `prediction`, `false_negative`, `false_positive` and `scale` values `count`, `jaccard`. Other request fields are rejected.

Statuses include `queued`, `running`, `succeeded`, `failed`, `canceled`, `interrupted`. Restarting the service marks unfinished work interrupted. Results page by 50 rows/columns. CSV exports the complete aggregate table; JSON exports provenance and parameter metadata. PNG export is implemented by the frontend.

Errors use `detail.code`: missing jobs return 404, a full queue 429, invalid parameters/evidence 422. Capabilities can return unavailability reasons in a successful response, so check each kind before submitting. See [Experiment Detail](../web-ui/experiment-detail).
