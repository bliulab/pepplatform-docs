# Custom Upload

In addition to the [built-in datasets](./builtin), you can upload your own datasets for training and evaluation. Uploads go through the Web API; the system validates the archive structure and normalizes it as needed.

## Upload Endpoint

```
POST /api/datasets/upload
Content-Type: multipart/form-data
```

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `task_type` | string | yes | Task type: `pep_function` / `pep_protein_interaction` / `pep_hlaii` / `pep_hlai` |
| `name` | string | yes | Dataset name |
| `archive` | file | yes | A `.zip` archive |

See [Data Format Spec](./format) for the field-level requirements.

## CSV, TSV, and TXT inputs

The following tables inside the ZIP may use the same basename with lowercase `.tsv` or `.txt`: `labels.csv`, `pairs.csv`, and `train.csv`, `val.csv`, `test.csv` in flat PPI / HLA-I bundles. TXT tables require a header and comma or tab delimiters; single-column label tables are supported. Sequence files may use `seqs.txt` with one sequence per line; labels must still be supplied separately.

For example, a peptide function upload may contain:

```text
my-dataset.zip
  train/
    seqs.txt
    labels.txt
  val/
    seqs.txt
    labels.txt
```

Example `seqs.txt`:

```text
ACDEFGHIK
LMNPQRSTV
```

TXT tables have the same field requirements as CSV. For example, a pair task's `pairs.txt` may contain:

```text
peptide,protein,label
ACDEFGHIK,LMNPQRSTV,1
LMNPQRSTV,ACDEFGHIK,0
```

TXT uses UTF-8 (optional BOM) and supports LF / CRLF. After trimming leading and trailing whitespace, each `seqs.txt` line must contain only ASCII letters, with no empty records, internal whitespace, or FASTA headers. Order, duplicate sequences, and letter case are preserved. Table delimiters are determined from unquoted commas or tabs in the header; a header containing both is rejected. Use CSV-style quoting for fields containing delimiters, newlines, or double quotes.

For the same basename in the same directory, priority is **CSV > TSV > TXT** for tables and **FASTA > TXT** for sequences. Invalid higher-priority files do not trigger fallback. The system keeps the original TXT files, generates canonical CSV / FASTA, and applies existing validation. It does not generate labels or split the data. See the [format specification](./format).

## ZIP Structure by Task Type

### pep_function (sequence_dir)

```
my-dataset.zip
  train/
    seqs.fasta
    labels.csv
  val/
    seqs.fasta
    labels.csv
  test/               # optional
    seqs.fasta
    labels.csv
```

### pep_protein_interaction / pep_hlai

**Option A — pair_split_dir:**

```
my-dataset.zip
  train/
    pairs.csv
    labels.csv
  val/
    pairs.csv
    labels.csv
```

**Option B — pair_dir (flat CSVs):**

```
my-dataset.zip
  train.csv
  val.csv
  test.csv            # optional
```

The system auto-normalizes Option B into the `normalized/{split}/` subdirectory.

### pep_hlaii (pair_split_dir + require_sequence_view)

```
my-dataset.zip
  train/
    pairs.csv         # must include: peptide, pair_pseudo, label
    labels.csv
    seqs.fasta        # required
  val/
    pairs.csv
    labels.csv
    seqs.fasta
```

::: warning HLA-II must include seqs.fasta
The `pep_hlaii` task enables `require_sequence_view=True`, so every split must provide `seqs.fasta` (which may be converted from `seqs.txt`), and the canonical `pairs.csv` must include the `peptide`, `pair_pseudo`, and `label` columns — otherwise validation fails.
:::

## Upload Process

1. Prepare a ZIP archive matching the format for your task type;
2. Upload it via the Web UI (Datasets page → Upload) or the API;
3. The system validates the archive structure and normalizes it if needed;
4. The dataset appears in your dataset list with `source: upload`.

::: tip Auto-unwrap
You may wrap all files in a single root directory inside the ZIP — the system will auto-unwrap it and locate the real data root, so you don't have to flatten it manually.
:::

::: tip Optional split
The `test` split is optional for every task. If you only provide `train` / `val`, the platform handles evaluation accordingly.
:::

## Deleting a Dataset

```
DELETE /api/datasets/{dataset_id}
```

**Deletion rules:**

- Only custom datasets with `source: upload` can be deleted; [built-in datasets](./builtin) cannot be deleted;
- A dataset cannot be deleted while any experiment still references it — remove the references first.

## Next Steps

- Learn the field requirements for each format: [Data Format Spec](./format)
- Browse available built-in data: [Built-in Datasets](./builtin)
- Installation and deployment: [Installation](../install/requirements)
