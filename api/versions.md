# Version API

Version access follows experiment visibility. Reading a content version requires access to at least one referencing experiment; inaccessible versions return 404. Responses filter local paths, commands and internal errors and do not download raw server files.

## GET /api/experiments/{experiment_id}/versions

Returns the run’s version record, content versions and relations. `download=true` sends the same filtered JSON as a `versions.json` attachment. Inaccessible source experiments produce the corresponding visibility error. Rerun/representation-reuse relations to invisible experiments are filtered too.

Statuses may include `not_recorded`, recording in progress, `sealed` or sealing failures. Read the actual `status`; missing records on a legacy experiment do not establish successful verification.

## GET /api/versions/{version_id}

Returns identity and metadata for a visible content version. IDs represent content identity and are not local filesystem names.

## GET /api/versions/{version_id}/runs

Returns visible experiments referencing that version:

```json
{
  "items": [
    {"id": "exp-1", "name": "Example run", "status": "succeeded"}
  ]
}
```

See [Versions and Downstream Resume](../web-ui/versions-and-resume).
