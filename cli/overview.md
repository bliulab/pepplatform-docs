# CLI Overview

PepPlatform exposes command-line scripts for model training, feature caching, and data preprocessing. All scripts run from source with no package install required — invoke them from the project root.

## Entry Points

### Main Training Scripts

- **`scripts/train_pipeline.py`** — **dispatcher entry point** that forwards by `--task_type` to the sequence or pair script, mainly for compatibility with older commands.
- **`scripts/train_sequence_pipeline.py`** — Single-sequence task script for `pep_function`, supporting both the classic pipeline and pretrained-model paths.
- **`scripts/train_pair_pipeline.py`** — Pair-only training script for `pep_protein_interaction`, `pep_hlaii`, and `pep_hlai`.

::: tip Relationship between the three entrypoints
Prefer the task-specific scripts for new commands: `train_sequence_pipeline.py` for single-sequence tasks, and `train_pair_pipeline.py` for peptide interactions with protein / HLA-I / HLA-II. `train_pipeline.py` remains a thin dispatcher so older commands keep working.
:::

### Tools and Supporting Scripts

- **`tools/*.py`** — Offline profile caches, tokenizer/embedding training, data preparation and audits. See [Tool Scripts](./tools) for the public platform entrypoints.
- **`scripts/replay_experiment_metrics.py`** — replay experiments and backfill validation metrics.
- **`scripts/import_legacy_sqlite.py`** — import legacy local SQLite metadata into PostgreSQL.

## How to Run

Prepare dependencies using [CLI Installation](../install/cli-only), then run scripts from the platform project root. A `pip install .` step is not required:

```bash
python scripts/train_pipeline.py
```

::: tip Working Directory
Always run scripts from the project root (`PepPlatform/`) so relative paths such as `datasets/` and `models/` resolve correctly.
:::

### Trigger Modes

| Mode | Behavior |
| --- | --- |
| No arguments | Launches the interactive wizard (recommended for beginners) |
| `--interactive` | Explicitly launches the interactive wizard |
| `--advanced_wizard` | Launches the advanced wizard with more options |
| With other arguments | Trains directly without the wizard |
| `--help` | Prints full argument help and exits |

```bash
# Interactive wizard (recommended for beginners)
python scripts/train_pipeline.py

# Single-sequence task
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50

# Pair-interaction task
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp

# Advanced wizard
python scripts/train_sequence_pipeline.py --advanced_wizard

# Show dispatcher help
python scripts/train_pipeline.py --help
```

## Main Training Scripts Compared

| Script | Tasks | Arguments | Wizard class |
| --- | --- | --- | --- |
| `scripts/train_pipeline.py` | Dispatcher for all 4 tasks | 3 | — |
| `scripts/train_sequence_pipeline.py` | `pep_function` | generated from source | `InteractiveConfigWizard` |
| `scripts/train_pair_pipeline.py` | 3 pair tasks | generated from source | `PPIInteractiveWizard` |

::: info Wizard equals CLI
The interactive wizard sets the same parameters as CLI arguments — they are fully equivalent. The wizard only guides you through choices step by step; the resulting configuration matches a hand-written command line.
:::

## Related Pages

- [Interactive Wizard](./wizard) — how to trigger the wizard and its guided flows
- [train_pipeline.py Arguments](./train-pipeline) — dispatcher argument reference
- [train_sequence_pipeline.py Arguments](./train-sequence-pipeline) — single-sequence task argument reference
- [train_pair_pipeline.py Arguments](./train-pair-pipeline) — full argument reference for the pair-only script (3 tasks)
- [Tool Scripts](./tools) — offline cache and preprocessing utilities
- [Recipes](./recipes) — end-to-end examples for all four task types
