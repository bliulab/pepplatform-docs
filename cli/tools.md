# Tool Scripts

Scripts for building offline feature caches, training tokenizers and embeddings, etc. Arguments auto-extracted by `gen_cli_ref.py`.

<!-- BEGIN GENERATED CLI -->

## Offline Cache Tools

### audit_evaluation_protocol

> `tools/audit_evaluation_protocol.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `root` | str | `None` | — | artifact directory or a parent directory containing evaluation.json files |
| `--tolerance` | float | `1e-07` | — | — |

### build_pair_split_data

> `tools/build_pair_split_data.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--project_root` | Path | `ROOT` | — | — |
| `--task` | normalize_pair_tool_key | `'all'` | `['all', *TASKS]` | — |
| `--overwrite` | flag (store_true) | `False` | — | — |

### build_ppi_profile_cache

> `tools/build_ppi_profile_cache.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--task_root` | str | `'datasets/task_peptide_protein_interaction'` | — | — |
| `--train_csv` | str | `''` | — | — |
| `--val_csv` | str | `''` | — | — |
| `--test_csv` | str | `''` | — | — |
| `--db_scope` | str | `'train_only'` | `train_only` | — |
| `--db_fasta` | str | `''` | — | — |
| `--feature` | str | `'both'` | — | Feature name, legacy both/all alias, or comma-separated names |
| `--query_role` | str | `'all'` | `all`, `peptide`, `partner` | — |
| `--max_length` | int | `512` | — | Top-n-gram safety limit; matrices are stored at full length |
| `--iterations` | int | `3` | — | — |
| `--evalue` | float | `0.001` | — | — |
| `--inclusion-evalue`, `--inclusion_evalue` | float | `0.001` | — | — |
| `--threads` | int | `4` | — | — |
| `--timeout-seconds`, `--timeout_seconds` | int | `600` | — | — |
| `--on_missing` | str | `'error'` | `error`, `blosum62_target_frequency` | Applies only to target_frequency; PSSM/PSFM fallback uses an explicit hybrid feature |
| `--force` | flag (store_true) | `False` | — | — |

### build_psfm_cache

> `tools/build_psfm_cache.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--data_dir` | str | `'datasets/task_peptide_function/data'` | — | — |
| `--split` | str | `'train'` | — | — |
| `--out_dir` | str | `''` | — | — |
| `--db_fasta` | str | `''` | — | Optional frozen external subject FASTA; default is train-only |
| `--max_length` | int | `60` | — | Deprecated compatibility option; profile matrices are stored at full length |
| `--iterations` | int | `3` | — | — |
| `--evalue` | float | `0.001` | — | — |
| `--inclusion_evalue` | float | `0.001` | — | — |
| `--threads` | int | `4` | — | — |
| `--timeout_seconds` | int | `600` | — | — |
| `--feature` | str | `'psfm'` | `psfm`, `psfm_blosum62_hybrid` | — |
| `--force` | flag (store_true) | `False` | — | — |

### build_pssm_cache

> `tools/build_pssm_cache.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--data_dir` | str | `'datasets/task_peptide_function/data'` | — | — |
| `--split` | str | `'train'` | — | — |
| `--out_dir` | str | `'datasets/task_peptide_function/pssm_cache/train'` | — | — |
| `--db_fasta` | str | `''` | — | Optional frozen external subject FASTA; default is train-only |
| `--feature` | str | `'pssm'` | `pssm`, `pssm_blosum62_hybrid`, `ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, `acc_pssm_blosum62_hybrid` | — |
| `--max_length` | int | `60` | — | Deprecated compatibility option; profile matrices are stored at full length |
| `--iterations` | int | `3` | — | — |
| `--evalue` | float | `0.001` | — | — |
| `--inclusion_evalue` | float | `0.001` | — | — |
| `--threads` | int | `4` | — | — |
| `--timeout_seconds` | int | `600` | — | — |
| `--force` | flag (store_true) | `False` | — | — |

### build_sequence_profile_cache

> `tools/build_sequence_profile_cache.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--data-dir` | str | `None` | — | Required.  |
| `--out-root` | str | `None` | — | Required.  |
| `--max-length` | int | `128` | — | Top-n-gram safety limit; matrices are stored at full length |
| `--iterations` | int | `3` | — | — |
| `--evalue` | float | `0.001` | — | — |
| `--inclusion-evalue` | float | `0.001` | — | — |
| `--threads` | int | `4` | — | — |
| `--timeout-seconds` | int | `600` | — | — |
| `--feature` | str | `'both'` | — | Feature name, legacy both/all alias, or comma-separated names |
| `--on-missing` | str | `'error'` | `error`, `blosum62_target_frequency` | Applies only to target_frequency; PSSM/PSFM fallback uses an explicit hybrid feature |
| `--force` | flag (store_true) | `False` | — | — |

### build_web_route_smoke_dataset

> `tools/build_web_route_smoke_dataset.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--output` | str | `None` | — | Required.  |

### decode_hlai_pseudoseq

> `tools/decode_hlai_pseudoseq.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--input_csv` | str | `'datasets/task_peptide_HLAI_interaction/pseudoseqs.csv'` | — | — |
| `--output_csv` | str | `'datasets/task_peptide_HLAI_interaction/pseudoseqs_decoded.csv'` | — | — |

### public_datasets

> `tools/public_datasets.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--recipe` | Path | `None` | — | Required.  |
| `--out` | Path | `None` | — | Required.  |
| `--snapshot` | Path | `None` | — | Required.  |
| `--dataset` | Path | `None` | — | Required.  |

### train_static_embeddings

> `tools/train_static_embeddings.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--data_dir` | str | `'datasets/task_peptide_function/data'` | — | — |
| `--k` | int | `2` | — | window length; tokenizer_mode=kmer accepts integers 1-3 |
| `--tokenizer_mode` | str | `'kmer'` | `kmer`, `dr` | — |
| `--cache_suffix` | str | `''` | `peptide`, `partner`, `protein` | — |
| `--dr_max_distance` | parse_dr_max_distance | `5` | — | — |
| `--dr_max_raw_length` | parse_dr_max_raw_length | `50000` | — | — |
| `--vector_size` | int | `128` | — | — |
| `--window` | int | `5` | — | — |
| `--min_count` | int | `1` | — | — |
| `--epochs` | int | `20` | — | — |
| `--workers` | int | `1` | — | — |
| `--seed` | int | `42` | — | — |
| `--fasttext_bucket` | int | `2000000` | — | — |
| `--static_embedding_memory_limit_gib` | float | `4.0` | — | — |
| `--glove_x_max` | float | `100.0` | — | — |
| `--glove_alpha` | float | `0.75` | — | — |
| `--glove_learning_rate` | float | `0.05` | — | — |
| `--glove_batch_size` | int | `4096` | — | — |
| `--train_word2vec` | flag (store_true) | `False` | — | — |
| `--train_glove` | flag (store_true) | `False` | — | — |
| `--train_fasttext` | flag (store_true) | `False` | — | — |
| `--save_root` | str | `'datasets'` | — | — |

### train_unigram_tokenizer

> `tools/train_unigram_tokenizer.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--data_dir` | str | `'datasets/task_peptide_function/data'` | — | — |
| `--save_dir` | str | `'datasets/task_peptide_function/unigram_tokenizers'` | — | — |
| `--vocab_size` | validate_unigram_vocab_size | `1000` | — | — |
| `--max_raw_length` | validate_unigram_max_raw_length | `50000` | — | — |
| `--output_name` | str | `'unigram_tokenizer.json'` | — | — |

## Supporting Scripts

### import_legacy_sqlite

> `scripts/import_legacy_sqlite.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--source` | str | `'.pepplatform_web/metadata.sqlite3'` | — | — |
| `--target` | str | `None` | — | Required. SQLAlchemy database URL, usually postgresql+psycopg://... |
| `--admin-email` | str | `None` | — | Required.  |
| `--admin-password` | str | `None` | — | Required.  |

### replay_experiment_metrics

> `scripts/replay_experiment_metrics.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--experiment-id` | str | `None` | — | — |
| `--all` | flag (store_true) | `False` | — | — |
| `--database` | str | `_default_database()` | — | — |
| `--force` | flag (store_true) | `False` | — | Refresh validation summary even when val_* keys exist. |
| `--dry-run` | flag (store_true) | `False` | — | Parse and report without updating metadata. |

### train_ensemble

> `scripts/train_ensemble.py`

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--task_type` | str | `'pep_function'` | — | — |
| `--members` | str | `None` | — | Required. comma-separated member artifact directories |
| `--member-model-ids` | str | `''` | — | comma-separated registered model ids (Web) |
| `--ensemble-method` | str | `'probability_mean'` | `probability_mean` | — |
| `--ensemble-weight-source` | str | `'validation'` | `equal`, `validation` | — |
| `--ensemble-grid-step` | float | `0.05` | — | — |
| `--artifact-dir` | str | `None` | — | Required.  |
| `--data-dir` | str | `'datasets/task_peptide_function/data_tppred_benchmark_public'` | — | — |
| `--seed` | int | `42` | — | — |
| `--weight_objective` | str | `'macro_f1'` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--weight_objective_params` | str | `None` | — | — |
| `--threshold_objective` | str | `'macro_f1'` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--threshold_objective_params` | str | `None` | — | — |
| `--threshold_search_profile` | str | `None` | — | — |
| `--report-aupr` | flag (store_true) | `True` | — | — |
| `--evaluate-test` | flag (argparse.BooleanOptionalAction) | `None` | — | evaluate the independent test split when member test scores exist (default: auto) |

<!-- END GENERATED CLI -->
