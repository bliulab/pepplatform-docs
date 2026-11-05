# Datasets

The Datasets module manages listing, uploading, and deleting training data, and provides dataset report previews. With authentication enabled, registered built-in datasets are visible to authenticated accounts; uploaded datasets follow owner/administrator permissions. A dataset must have no experiment references before it can be deleted.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

## GET /api/datasets

- **Method**: `GET`
- **Path**: `/api/datasets`
- **Auth**: Login required
- **Purpose**: List datasets visible to the current user (built-in and own uploads).

```bash
curl http://127.0.0.1:8081/api/datasets \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
[
  {
    "id": "builtin-ppi-quick",
    "name": "Built-in peptide-protein interaction quick dataset",
    "task_type": "pep_protein_interaction",
    "source": "builtin",
    "format": "pair_split_dir",
    "owner_user_id": null
  },
  {
    "id": "upload-1",
    "name": "My dataset",
    "task_type": "pep_function",
    "source": "upload",
    "format": "sequence_dir",
    "owner_user_id": "a1b2c3d4"
  }
]
```

## POST /api/datasets/upload

- **Method**: `POST`
- **Path**: `/api/datasets/upload`
- **Auth**: Login required
- **Purpose**: Upload a `.zip` dataset archive (multipart upload); automatically unpacks and validates.

```bash
curl -X POST http://127.0.0.1:8081/api/datasets/upload \
  -b cookies.txt \
  -F "task_type=pep_function" \
  -F "name=My dataset" \
  -F "archive=@dataset.zip"
```

Request parameters (multipart/form-data):

| Field | Type | Description |
| --- | --- | --- |
| `task_type` | string | Task type, e.g. `pep_function`, `pep_protein_interaction` |
| `name` | string | Dataset name |
| `archive` | file | `.zip` archive file |

The ZIP may contain `labels.tsv`, `pairs.tsv`, or flat PPI / HLA-I tables `train.tsv`, `val.tsv`, and `test.tsv`; see the [format spec](../datasets/format#tsv-in-web-uploads) for layouts and columns. Uploads preserve the original TSV and convert it to canonical CSV. Existing same-name CSV files take precedence and are not overwritten. CSV parsing, API response formats, and direct CLI readers are unchanged.

Example response excerpt (`200`; values are illustrative): returns the newly created dataset object. Validation failure returns `400`.

## DELETE /api/datasets/{dataset_id}

- **Method**: `DELETE`
- **Path**: `/api/datasets/{dataset_id}`
- **Auth**: Login required
- **Purpose**: Delete an uploaded dataset. Only uploaded datasets can be deleted, and only when no experiments reference it.

**Path parameters**:

| Param | Description |
| --- | --- |
| `dataset_id` | Dataset ID |

```bash
curl -X DELETE http://127.0.0.1:8081/api/datasets/upload-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "dataset_id": "upload-1", "artifact_deleted": true }
```

Non-upload datasets return `409`; still referenced by experiments returns `409`; permission denied returns `403`; not found returns `404`.

## GET /api/datasets/{dataset_id}/report

- **Method**: `GET`
- **Path**: `/api/datasets/{dataset_id}/report`
- **Auth**: Login required
- **Purpose**: Build a dataset report with statistics summary and data preview.

**Path parameters**:

| Param | Description |
| --- | --- |
| `dataset_id` | Dataset ID |

**Query parameters**:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | int | 5 | Number of preview samples |

```bash
curl "http://127.0.0.1:8081/api/datasets/builtin-ppi-quick/report?limit=10" \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative): returns the dataset report object (with sample statistics, distributions, preview rows, etc.). Permission denied returns `403`; not found returns `404`.

## TXT Upload Conversion

New uploads additionally accept the documented `labels.txt`, `pairs.txt`, `seqs.txt` and supported flat split TXT tables. The backend retains originals and writes missing canonical CSV/FASTA files; existing higher-priority files are never silently replaced. See [TXT Format](../datasets/format) for exact filenames, precedence, delimiters and conversion provenance. This does not extend CLI input readers.
