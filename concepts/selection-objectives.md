# Model Selection Objectives

Checkpoint selection, threshold fitting and automatic tuning are separate stages. Selection uses training/validation data; test data never selects weights, thresholds or hyperparameters. A leaderboard sort metric is also distinct from a training objective.

## Objectives and Defaults

| Stage | Single-sequence function default | Binary pair default |
| --- | --- | --- |
| Checkpoint `checkpoint_objective` | `macro_f1` | `auc` |
| Final threshold `threshold_objective` | `macro_f1` | `f1` |
| Automatic tuning `tuning_objective` | `macro_f1` | `auc` |

Objectives include `f1`, `macro_f1`, `sacc`, `auc`, `aupr` and `dual_f1_sacc`, subject to task and stage constraints. Multilabel `f1` normalizes to `macro_f1`; SAcc and the dual objective are multilabel-only. AUC/AUPR consume continuous scores and cannot optimize thresholds. Undefined metrics are not replaced with invented defaults.

`dual_f1_sacc` requires finite positive `reference_f1` and `reference_sacc`. Its lexicographic key maximizes the smaller normalized achievement, their sum, F1, then SAcc. It is not a simple average.

## Threshold Search

F1 objectives default to `f1_exact_v1`; SAcc and the dual objective default to `coordinate_quantile32_v1`. `coordinate_all_v1` is also available. `f1_exact_v1` cannot optimize SAcc or the dual objective. Predictions use `score >= threshold`, with ties resolved toward larger thresholds.

Advanced `checkpoint_threshold_objective` and `checkpoint_threshold_search_profile` settings control threshold calculation during checkpoint comparison; omitted values follow final-threshold settings. After restoring the best checkpoint, final validation thresholds are fitted again and frozen for testing and inference.

## CLI and Web

```bash
python scripts/train_sequence_pipeline.py --list_objectives
python scripts/train_pair_pipeline.py --list_objectives
```

For training:

```bash
python scripts/train_sequence_pipeline.py --task_type pep_function   --data_dir /path/to/function-data --tokenizer kmer --encoder onehot --model cnn   --checkpoint_objective macro_f1 --threshold_objective macro_f1   --tuning_objective macro_f1 --epochs 10
```

Prepare the [required data format](../datasets/format) first. Automatic tuning additionally requires `--ml_auto_tune`; setting an objective does not enable search. `ml_tuning_objective` is a compatibility field. If supplied together with `tuning_objective`, the definitions must agree.

The Web wizard exposes corresponding settings and Preflight checks route compatibility. Artifacts retain a versioned `selection_contract` with objective definitions, parameters, search settings and checkpoint scope. Exported-embedding checkpoints belong to representation learning, rather than the final downstream classifier.
