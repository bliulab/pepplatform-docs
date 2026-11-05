# Public Databases: CLI Fetch and Offline Build

These tools run before training and produce a ZIP accepted by the existing Web upload flow. They do not register or replace built-in datasets, train models, or modify paper datasets and locks. They require Python 3.10+ and only the standard library.

Supported sources are DBAASP for peptide-function activity subsets, IntAct for direct peptide–protein interactions, and IEDB for HLA-I/HLA-II binding assays. Database records alone do not establish a usable training set. Missing evidence or a split lacking positive/negative examples produces a report and blocks ZIP publication.

## Three Steps

Copy a suitable `.recipe` from `tools/public_dataset_recipes/`. Recipes contain JSON. The four small example queries check connectivity and rules; they are not ready-made benchmarks and may not provide enough data for train/validation/test splits.

Adjust queries, lengths and labels to the research question. Replace HLA `/path/to/...` values with local pseudosequence mappings. Provide the mapping files yourself; mappings, downloads and training data are not included in this documentation repository. Copy read-only mappings into each new snapshot.

```bash
python tools/public_datasets.py fetch \
  --recipe /path/to/my.recipe --out /path/outside/repository/snapshot-001

python tools/public_datasets.py build \
  --snapshot /path/outside/repository/snapshot-001 \
  --recipe /path/to/my.recipe --out /path/outside/repository/dataset-001

python tools/public_datasets.py verify \
  --dataset /path/outside/repository/dataset-001
```

Upload `dataset-001/dataset.zip` using the recipe’s task, or point an existing training command at `dataset-001/dataset/`. Build and verify are offline. Exit code 0 means success, 2 means error. Failed output remains available for inspection; retry in a new directory.

All output must be outside the Git checkout and outside directories named `datasets`, `experiment_paper` or `.pepplatform_web`. Existing directories cannot be overwritten. The current implementation adds no Web fetching API or UI.

## Recipes and Interpretation

Common fields are `version: 1`, `task`, `source`, `query`, and `peptide_length: [min, max]`. Defaults include `page_size: 100`, `max_records: 10000`, and `split: {"seed": 42, "ratios": [80, 10, 10]}`.

Query values are strings. Pagination, sorting and field projection are managed by the tool and cannot be overridden. `max_records` limits a complete download rather than sampling it. Exceeding it leaves an incomplete snapshot; narrow the query or increase the limit and fetch again. Duplicate IDs and available total counts are checked, but remote services do not guarantee a transaction-wide snapshot. Offline reproduction uses saved response bytes.

| Source | Query convention | Evidence and sequence boundaries |
| --- | --- | --- |
| DBAASP | Official `/peptides` parameters such as `id.value`, followed by detail requests | Unmodified linear monomer peptides; exact species, MIC and unit matching |
| IEDB | PostgREST `mhc_search` filters such as `mhc_class: eq.I`, `mhc_allele_name: eq.HLA-A*02:01`, joined to `mhc_export` | Explicit human HLA alleles, unmodified linear peptides and named binding methods |
| IntAct | A single `query` string such as `EBI-4392836` through the official search API | Explicit peptide/protein types, direct interaction and experimental outcome; sequences from embedded PSI-MI XML |

Function-task labels each require `name`, `target_species`, `measure: MIC`, `unit`, `positive_max`, and `negative_min`. Example 8/64 µM cutoffs are research examples, not universal biological criteria. MIC at or below the positive cutoff maps to 1; at or above the negative cutoff maps to 0. Intermediate values stay unlabeled. Ranges/inequalities are classified only if every possible value lies in the same class. Units are not converted, and absent annotations are not negative labels. Multiple-label builds retain only records with every requested label resolved; output width follows the recipe rather than requiring the old benchmark’s 15 labels.

HLA recipes use exact `assay__method` values from `binding_methods` and require binding measurements; ligand presentation/elution records are excluded. Positive, Positive-Low, Positive-Intermediate and Positive-High map to 1, Negative to 0. These are source qualitative conclusions, not a universal affinity cutoff or the same target as the existing EL benchmark. Mappings use `hla,pseudoseq[,status]` or `hla_pair,pseudoseq`; class I uses 30aa, class II 34aa, retaining source X positions. Matching is exact. DRB-only names expand to `DRA*01:01|DRB…` under the existing resource convention. Fuzzy alleles and nearest-neighbor substitution are not supported. Output retains original `hla` or `hla_pair/hla_alpha/hla_beta` identities.

PPI excludes expanded complexes, mutations, missing explicit sequences and records with participant features, which may encode tags, fusions, truncation or modification. It does not cut arbitrary peptide fragments from full proteins or infer positives from co-occurrence. Current sequence extraction uses IntAct XML without guessed UniProt completion. Strict filtering may leave too few negatives.

Peptides must use uppercase standard 20-amino-acid symbols. Lowercase characters that could denote D-amino acids are not silently uppercased. Consistent duplicate evidence merges; conflicting groups are excluded. HLA samples deduplicate by peptide and original allele identity, PPI by peptide and protein sequence.

## Splits, Overlap and Supplements

All partners of the same peptide are assigned together using `SHA256(seed + ":" + peptide)`, targeting 80/10/10 by default. Actual ratios follow the data; seeds are not repeatedly changed. Every split and label needs both classes. This removes exact-peptide overlap, not homologous-peptide or partner overlap.

For optional exact-overlap checks, set `resources.benchmarks` to a same-task reference index JSON. Relative resource paths resolve from the recipe directory. Fetch freezes the supplied index with the snapshot; offline builds use that copy. Without an explicit index, overlap status is `not_available` and no reference-data check is claimed. Fetch does not search a source checkout or read other reference datasets automatically.

A reference index contains `status: "checked"`, `task`, and a `files` list. Each file records its descriptive `path`, source `sha256`, hashed `peptides`, and hashed `samples`. Peptide identities are SHA-256 hashes of UTF-8 sequences; sample identities use `pepplatform.public_data.benchmarks.sample_key(task, peptide, partner_id)` with an empty partner for the function task. The supplier is responsible for the index’s source identities; fetch freezes the index bytes rather than reopening its reference files. Existing same-task indexes remain usable. Exact overlap does not establish homology separation or verified independence.

Optional `resources.supplements` points to a manually curated JSON array. Each record requires:

```json
{
  "source_id": "local-assay-001",
  "task": "pep_protein_interaction",
  "peptide": "ACDEFGHIK",
  "protein": "ACDEFGHIKLMNPQRSTVWY",
  "labels": [0],
  "reference": "Actual publication and experiment location",
  "evidence_type": "experimental",
  "unmodified": true,
  "label_definition": "direct_binding_positive=1,negative=0"
}
```

HLA supplements use `partner_id` for the original allele and must match frozen mappings. Function supplements need no partner; `label_definition` must match the complete recipe label list, with `labels` in that order. Supplements are marked `user_experimental_supplement`. The tool validates declarations and consistency, not the truth of a publication or human annotation. Unknown outcomes, predicted labels and constructed negatives are rejected.

## Provenance and Reproduction

Snapshots retain raw responses, URLs, times, available upstream version headers, recipes, resources and SHA-256 hashes. Missing source-version headers are recorded as unavailable rather than invented. Failed snapshots set `complete: false` in `snapshot.json`.

Successful outputs include `dataset.zip`, the standard dataset directory, `accepted.json`, `rejections.json`, `report.json`, `manifest.json` and builder source under `builder/`. ZIPs retain recipes, reports and sample provenance. Upload preserves auxiliary files; current pages do not display every new report field, so inspect the JSON directly.

The same snapshot, recipe, builder and Python version produce identical data and ZIPs. ZIP entries use fixed times and uncompressed storage to avoid compression-version differences. Retain the original snapshot; a query alone cannot reproduce future remote responses. Refreshes and changed recipes create new snapshots rather than overwriting history.

After upgrading the platform, a saved builder can reproduce its output:

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/path/to/dataset-001 python -c \
  'from builder import build; build("/path/to/snapshot-001", "/path/to/my.recipe", "/path/to/rebuilt-001")'
```

Use the recorded Python version and disable bytecode writes to avoid changing the sealed builder inventory. Verify checks file inventory/hashes, sample identities, label order, FASTA/pair alignment, splits, reports and ZIP content. Hashes check integrity; they do not independently validate upstream scientific conclusions or provide signed authentication.

## Python Interface

The Python interface exposes `pepplatform.public_data.fetch(recipe_path, out, benchmark_root=...)`, `build(snapshot, recipe_path, out)`, and `verify(dataset_dir)`. These are Python interfaces; a Web fetching queue is not currently implemented.

Source references and usage terms: [DBAASP API](https://www.dbaasp.org/api?page=rest), [IEDB IQ-API](https://discuss.iedb.org/t/immune-epitope-database-query-api-iq-api/154), [IntAct API](https://www.ebi.ac.uk/intact/ws/interaction/swagger-ui/index.html). Follow each source’s citation and redistribution requirements.
