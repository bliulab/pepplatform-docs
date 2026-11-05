# train_pipeline.py Arguments

Dispatcher entry point. It forwards by `--task_type`: single-sequence tasks go to `train_sequence_pipeline.py`, and pair-interaction tasks go to `train_pair_pipeline.py`. New commands should prefer the task-specific scripts; this entrypoint primarily keeps older commands working.

Arguments on this page are auto-extracted from source code.

## Basic Usage

```bash
# Compatibility path for older single-sequence commands; forwards to train_sequence_pipeline.py
python scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50

# Compatibility path for older pair commands; forwards to train_pair_pipeline.py
python scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp

# Show dispatcher help
python scripts/train_pipeline.py --help
```

<!-- BEGIN GENERATED CLI -->

> Total `3` arguments

## Task & Data

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--task_type` | str | `'pep_function'` | `pep_function`, `pep_protein_interaction`, `pep_hlaii`, `pep_hlai` | Dispatcher entrypoint. Forwards to `train_sequence_pipeline.py` or `train_pair_pipeline.py` based on task type |

## I/O & Control

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--interactive` | flag (store_true) | `False` | — | Forward interactive mode to the selected task-specific entrypoint. |
| `--advanced_wizard` | flag (store_true) | `False` | — | Forward advanced wizard mode to the selected task-specific entrypoint. |

<!-- END GENERATED CLI -->
## Reading the Parameter Tables

Defaults below are parser defaults. `None` and empty values may be resolved by task or route; they do not mean that every listed combination is supported. BooleanOptionalAction also accepts the matching `--no-...` form. Prepare the example datasets first; see [Recipes](./recipes). For KPCA, omitted `kpca_gamma` resolves to `0.1` for RBF/poly; other kernels do not consume it. [Selection Objectives](../concepts/selection-objectives) explains the task-dependent defaults added by the shared parser helper.
