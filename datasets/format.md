# Data Format Spec

PepPlatform uses different directory formats depending on the task type. This page details the 4 supported formats, the field requirements for each task, and how special files are handled. Both [built-in datasets](./builtin) and [custom uploads](./upload) are ultimately normalized into one of these formats.

## Format Overview

The platform supports 4 data formats:

| Format | Applicable tasks | Directory layout | Key files |
| --- | --- | --- | --- |
| `sequence_dir` | `pep_function` | `{root}/{train,val,test}/` | `seqs.fasta` + `labels.csv` |
| `pair_split_dir` | `pep_protein_interaction` / `pep_hlai` / `pep_hlaii` | `{root}/{train,val,test}/` | `pairs.csv` + `labels.csv` (+ `seqs.fasta`) |
| `pair_root` | Legacy/raw compatibility format | `{root}/processed/*.csv` | Raw CSVs; normalize to `pair_split_dir` before use |
| `pair_dir` | Flat uploaded bundle | `{root}/{train,val,test}.csv` | Normalized into `normalized/{split}/` after upload |

::: tip Terminology
In this page `{root}` denotes the dataset root directory and `{split}` denotes one of the `train` / `val` / `test` splits. The `test` split is optional in every format.
:::

## TSV in Web uploads

Web dataset uploads still use `.zip` archives. These input tables may replace `.csv` with lowercase `.tsv`, using the same headers and field requirements:

- `labels.tsv` and `pairs.tsv` in `train/`, `val/`, and optional `test/` directories.
- `train.tsv`, `val.tsv`, and optional `test.tsv` in flat PPI / HLA-I bundles.

TSV uses tabs as delimiters and CSV-style quoting for fields containing tabs, newlines, or double quotes. Single-column label tables may also use `.tsv`. Tables may mix CSV and TSV; when both extensions exist for the same name in the same directory, CSV takes precedence, even if that CSV fails validation.

The upload preserves each original TSV and creates its missing CSV counterpart before existing validation and normalization. Existing CSV files are not rewritten or sniffed. The layouts below, reports, and experiment readers still use canonical CSV; FASTA requirements and sample order are unchanged. This support is limited to Web uploads: it does not extend direct CLI readers or built-in dataset formats, and other auxiliary TSV files are not converted.

The inference panel also accepts `.tsv` directly. Sequence tables require a `sequence`, `seq`, or `peptide` column; pair tables require `peptide` / `pep` and a partner column supported by the current task. `.csv` always uses commas and `.tsv` always uses tabs. For `.txt` or extensionless inputs, only unquoted delimiters in the first nonempty line are checked: commas take precedence, otherwise tabs are used. One delimiter applies to the entire file. Inference result downloads remain CSV.

## TXT in Web uploads

ZIP archives support `labels.txt`, `pairs.txt`, and `seqs.txt` in `train/`, `val/`, and optional `test/` directories. PPI / HLA-I also support flat `train.txt`, `val.txt`, and `test.txt`. Use lowercase filenames. TXT uses UTF-8 (optional BOM), with LF or CRLF line endings.

- TXT tables require a header and at least one data row, with the same fields as their CSV equivalents. Every row must have the same number of cells as the header. Unquoted commas or tabs in the header determine the delimiter; both together are rejected, and no delimiter means a single-column table. CSV-style quoting, including quoted multiline fields, is supported.
- Each `seqs.txt` line contains one sequence. After trimming leading and trailing whitespace, only ASCII letters are allowed. Empty records, internal whitespace, digits, and FASTA headers are rejected with a line number. Order, duplicates, and letter case are preserved; deterministic FASTA headers `>s1`, `>s2`, etc. are generated. Supply labels separately in the same row order.
- Same-name priority is CSV > TSV > TXT for tables and FASTA > TXT for sequences. Invalid higher-priority files do not trigger fallback; existing CSV and FASTA files are not rewritten.

Only the listed filenames are converted. Original TXT files are preserved, canonical CSV / FASTA files are generated, and existing task validation follows. Conversion does not deduplicate, sort, split data, or generate labels. HLA-II still requires pairs, labels, and a sequence view. This support applies to new Web uploads, not CLI or built-in dataset readers.

When TXT conversion occurs, dataset metadata includes `upload_conversion`: `version: 1`, `path_base: "archive_root"`, and a `files` list. Each entry records `kind` (`table` / `sequences`), `source`, `target`, `source_sha256`, and `target_sha256`; tables also record `delimiter`. Paths are relative to the ZIP extraction directory, including any wrapper directory. For flat bundles, the converted CSV remains outside `normalized/`, which subsequently receives canonical split files.

## 1. sequence_dir — Single-Sequence Format

Used by the `pep_function` task. Each split directory contains a FASTA sequence file and a multi-label CSV.

### Directory layout

```
{root}/
  train/
    seqs.fasta        # FASTA: >sample_id\nSEQUENCE
    labels.csv        # Multi-label: header row of dataset-specific label names, then 0/1 per row
  val/
    seqs.fasta
    labels.csv
  test/               # optional
    seqs.fasta
    labels.csv
```

### seqs.fasta

Standard FASTA. Each record is a `>`-prefixed sample ID line followed by the peptide amino-acid sequence:

```
>Train1
KLLSTGLVQNFPNTIISK
>Train2
GSCSCSGTISPYGLRTCRATKTKPSHPTTKETHPQTLPT
```

### labels.csv

- **Header row**: the dataset’s label names, comma-separated. For example, a two-label synthetic dataset uses: `label_a,label_b`
- **Data rows**: one row per FASTA record, comma-separated `0` / `1` values indicating whether the sample belongs to each class (multi-label — a peptide may belong to several classes)

```csv
label_a,label_b
0,1
1,1
```

::: warning Count must match
The FASTA record count must equal the number of data rows in `labels.csv` (i.e. total rows minus the 1 header row), otherwise loading fails.
:::

Label names and their interpretation are supplied by the dataset; the example names are not biological annotations.

## 2. pair_split_dir — Pair Split Format

Used by the three pair tasks: `pep_protein_interaction`, `pep_hlai`, and `pep_hlaii`. Each split directory contains pair definitions, labels, and an optional sequence file.

### Directory layout

```
{root}/
  train/
    pairs.csv         # Pair definitions
    labels.csv        # Binary labels (0/1)
    seqs.fasta        # Optional; required for pep_hlaii (require_sequence_view=True)
  val/
    pairs.csv
    labels.csv
    seqs.fasta
  test/               # optional
    pairs.csv
    labels.csv
    seqs.fasta
```

### pairs.csv column requirements

Use the exact column names listed below. **At least one column from each group below is required:**

| Group | Accepted column names | Description |
| --- | --- | --- |
| Peptide | `peptide` or `pep` | Peptide sequence |
| Partner | `protein` or `hla` or `pair_pseudo` or `hla_pair` | Partner sequence or its encoding |
| Label | `label` or `tgt` or `bind` | Binary label 0/1 |

Optional columns: `sample_id`, `combined_sequence`, `pair_pseudo`, etc.

::: warning pep_hlaii special requirement
For the `pep_hlaii` task, `pairs.csv` **must include** the `peptide`, `pair_pseudo`, and `label` columns and may include other helper columns. Because `require_sequence_view=True`, `seqs.fasta` must also be provided.
:::

### labels.csv (pair tasks)

A single column with header `label` and values `0` or `1`:

```csv
label
0
1
```

### seqs.fasta (pair tasks)

For pair tasks, `seqs.fasta` stores the **combined sequence**, assembled as: peptide + `GGG` + partner (the `CONCAT_LINKER` is `"GGG"`).

- If `pairs.csv` has a `combined_sequence` column, its values are used directly;
- otherwise the combined sequence is built from `peptide` + partner.

```
>sample_1
YNPEYQDESVLWTESGGGYNFHERXFATVLHILYFAYTYYDVRTETVHLETT
```

### Example pairs.csv headers by task

Sequences and labels below illustrate file fields only; they are not biological annotations. Research/training requires actual sequences, labels and allele mappings with appropriate provenance.

**PPI (pep_protein_interaction)**

```csv
sample_id,label,peptide,protein
example_1,0,ACDEFGHIK,ACDEFGHIKLMNPQRSTVWY
example_2,1,LMNPQRSTV,LMNPQRSTVWYACDEFGHIK
```

**HLA-I (pep_hlai)**

```csv
hla,pep,tgt
HLA-C*05:01,PAKHQLHVWRA,0
HLA-B*52:01,ESVNAAFE,0
```

**HLA-II (pep_hlaii)**

```csv
peptide,pair_pseudo,label
ACDEFGHIK,ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMNPQRS,0
```

::: details HLA-II column notes
- `hla_pair`: allele-pair identifier in `alpha|beta` form
- `pair_pseudo`: 34aa HLA-II heterodimer pseudo-sequence used to encode the partner side; prepare and retain the provenance of the mapping used by your dataset
- `combined_sequence`: peptide + `GGG` + pseudo-sequence combined view, consumed directly by sequence models
:::

## 3. pair_root — Legacy/Raw Compatibility Format

`pair_root` exists for older or raw benchmark CSV directories. The current Web built-in pair datasets are primarily exposed as `pair_split_dir`; when you have a `pair_root` directory, normalize it with the tooling or upload normalization flow before previewing or training.

**PPI raw files:**

- `{root}/processed/train.csv`
- `{root}/processed/test_1440.csv` (the validation split is auto-carved 90/10 from train)

**HLA-I raw files:**

- `{root}/processed/{train,val,test}.csv`
- The current built-in HLA-I benchmark is normalized as `data_bigmhc_el_100k_original_split/{train,val,test}/pairs.csv`, when such data has been prepared.

## 4. pair_dir — Flat Uploaded Bundle Format

When a custom upload uses a flat-CSV bundle, the system auto-normalizes it into the `pair_split_dir` layout; training and preview read the normalized `normalized/{split}/` directories.

```
{root}/
  train.csv
  val.csv
  test.csv            # optional
```

After normalization:

```
{root}/normalized/
  train/
    pairs.csv
    labels.csv
    seqs.fasta
  val/
    pairs.csv
    labels.csv
    seqs.fasta
```

## HLA-I Special File: pseudoseqs_decoded.csv

The `pseudoseqs_decoded.csv` file at the root of a `pep_hlai` dataset provides the HLA-I pseudo-sequence map, used to resolve HLA-I partner-chain sequences via pseudo-sequence encoding.

**Columns:**

| Column | Description |
| --- | --- |
| `hla` | HLA-I allele name, e.g. `HLA-C*05:01` |
| `pseudoseq` | Pseudo-sequence (anchor-encoded sequence with `X` placeholders) |
| `status` | Status flag; an empty string or `ok` means the row is usable |

```csv
hla,pseudoseq,status
HLA-A*02:01,ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMN,ok
```

The pseudosequence above is synthetic, not an actual HLA-A*02:01 mapping. Replace it with a mapping from your documented source.

::: tip Loading rule
Only rows whose `status` is empty or `ok` are loaded into the pseudo-sequence map; rows with other statuses (e.g. missing/anomalous) are skipped.
:::

## Next Steps

- See which built-in datasets use each format: [Built-in Datasets](./builtin)
- Prepare and upload your own data: [Custom Upload](./upload)
- Understand the modeling routes: [Task Types](../concepts/tasks)
