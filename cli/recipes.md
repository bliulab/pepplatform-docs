# Recipes

End-to-end command-line examples for all four task types. Run every command from the project root.

Replace placeholder paths with prepared inputs and distinct new output directories. Output descriptions below apply to successful runs; these commands are configuration examples, not completed training or performance results.

## Recipe 1: Therapeutic peptide function prediction (pep_function)

```bash
python scripts/train_sequence_pipeline.py --artifact_dir /path/to/new-function-run \
  --task_type pep_function \
  --data_dir /path/to/function-data \
  --tokenizer kmer \
  --encoder onehot \
  --model cnn \
  --epochs 50 \
  --batch_size 64 \
  --lr 1e-3
```

**Parameter explanation**

| Argument | Purpose |
| --- | --- |
| `--task_type pep_function` | Therapeutic peptide function (multi-label) prediction task |
| `--tokenizer kmer` | k-mer tokenizer |
| `--encoder onehot` | one-hot encoding, preserves sequence order |
| `--model cnn` | CNN sequence model (equivalent to `--sequence_model cnn --training_mode end_to_end --classifier mlp`) |
| `--epochs 50` | Train for 50 epochs |
| `--batch_size 64` | Batch size 64 |
| `--lr 1e-3` | Learning rate 1e-3 |

- Replace `--data_dir` with your prepared function-task data directory. This documentation repository does not provide training data.
- Classic route: k-mer tokenizer + one-hot encoder + CNN sequence model.

**Expected output**: per-epoch train/validation metrics print to the console, with final test metrics only when a test split is available and test evaluation is enabled; model checkpoints, config, and a metrics summary are saved to the artifact directory.

**How to view results**: read the metrics in the console log; artifacts live in the artifact directory and can be backfilled or reviewed with `scripts/replay_experiment_metrics.py` when compatible saved evidence is present.

## Recipe 2: Peptide–protein interaction prediction (pep_protein_interaction)

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-ppi-run \
  --task_type pep_protein_interaction \
  --task_root /path/to/ppi-task \
  --tokenizer esm2 \
  --pair_strategy two_stream \
  --interaction_level vector \
  --predictor_type classifier \
  --classifier mlp \
  --epochs 20 \
  --batch_size 32
```

**Parameter explanation**

| Argument | Purpose |
| --- | --- |
| `--task_type pep_protein_interaction` | Peptide–protein interaction prediction task |
| `--tokenizer esm2` | ESM2 pretrained tokenizer |
| `--pair_strategy two_stream` | Two-stream structure, each side encoded separately |
| `--interaction_level vector` | Vector-level interaction |
| `--predictor_type classifier` | Use a classifier as the predictor |
| `--classifier mlp` | MLP classifier over fused vectors |
| `--epochs 20` | Train for 20 epochs |
| `--batch_size 32` | Batch size 32 |

- Pretrained route: ESM2 encoder.
- Two-stream with vector-level interaction; fused vectors feed an MLP classifier.

**Expected output**: per-epoch metrics print to the console, with final test metrics only when a test split is available and test evaluation is enabled; artifacts are saved to the artifact directory.

**How to view results**: read the metrics in the console log; artifacts live in the artifact directory.

## Recipe 3: Peptide–HLA-I ligand presentation prediction (pep_hlai)

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-hlai-run \
  --task_type pep_hlai \
  --task_root /path/to/hlai-task \
  --tokenizer esm2 \
  --pair_strategy two_stream \
  --interaction_level token \
  --interaction_model bi_cross_attn \
  --training_mode end_to_end \
  --epochs 20 \
  --batch_size 32
```

**Parameter explanation**

| Argument | Purpose |
| --- | --- |
| `--task_type pep_hlai` | Peptide–HLA-I ligand presentation prediction task |
| `--tokenizer esm2` | ESM2 pretrained tokenizer |
| `--pair_strategy two_stream` | Two-stream structure |
| `--interaction_level token` | Token-level interaction |
| `--interaction_model bi_cross_attn` | Bidirectional cross attention |
| `--training_mode end_to_end` | End-to-end training |
| `--epochs 20` | Train for 20 epochs |
| `--batch_size 32` | Batch size 32 |

- Pretrained route: ESM2.
- Two-stream with token-level bidirectional cross attention, trained end to end.

**Expected output**: per-epoch metrics print to the console, with final test metrics only when a test split is available and test evaluation is enabled; artifacts are saved to the artifact directory.

**How to view results**: read the metrics in the console log; artifacts live in the artifact directory.

## Recipe 4: Peptide–HLA-II ligand presentation prediction (pep_hlaii)

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-hlaii-run \
  --task_type pep_hlaii \
  --task_root /path/to/hlaii-task \
  --tokenizer kmer \
  --encoder pssm \
  --pair_strategy two_stream \
  --interaction_level token \
  --interaction_model cross_attn \
  --training_mode end_to_end \
  --epochs 10 \
  --batch_size 32
```

**Parameter explanation**

| Argument | Purpose |
| --- | --- |
| `--task_type pep_hlaii` | Peptide–HLA-II ligand presentation prediction task |
| `--tokenizer kmer` | k-mer tokenizer |
| `--encoder pssm` | PSSM encoding (requires BLAST+ and a PSSM cache) |
| `--pair_strategy two_stream` | Two-stream structure |
| `--interaction_level token` | Token-level interaction |
| `--interaction_model cross_attn` | Cross-attention interaction model |
| `--training_mode end_to_end` | End-to-end training |
| `--epochs 10` | Train for 10 epochs |
| `--batch_size 32` | Batch size 32 |

- Classic route: k-mer + PSSM encoder.
- Two-stream with token-level cross attention, trained end to end.

::: warning PSSM dependency
`--encoder pssm` requires a local BLAST+ install and a PSSM cache prebuilt with `tools/build_pssm_cache.py`.
:::

::: tip epochs default
For the `pep_hlaii` task, `--epochs` defaults to `10` when not specified explicitly.
:::

**Expected output**: per-epoch metrics print to the console, with final test metrics only when a test split is available and test evaluation is enabled; artifacts are saved to the artifact directory.

**How to view results**: read the metrics in the console log; artifacts live in the artifact directory.

## Offline pretrained models

For servers without public internet access, place pretrained model snapshots under the project `models/` directory and enable offline mode to avoid Hugging Face network retries:

```bash
PEPPLATFORM_OFFLINE_MODE=1 python scripts/train_sequence_pipeline.py --artifact_dir /path/to/new-function-run \
  --task_type pep_function \
  --data_dir /path/to/function-data \
  --tokenizer esm2 \
  --esm2_model ./models/esm2 \
  --model cnn \
  --epochs 50
```

::: info Offline mode
`PEPPLATFORM_OFFLINE_MODE=1` makes training prefer local model directories and fail fast when a requested pretrained model is missing. Example model directories: `models/esm2`, `models/protbert`, `models/prott5`, `models/EvolutionaryScale/esmc-600m-2024-12`, `models/esm3-sm-open-v1`.
:::

## Related Pages

- [CLI Overview](./overview)
- [Interactive Wizard](./wizard)
- [train_pipeline.py Arguments](./train-pipeline)
- [train_sequence_pipeline.py Arguments](./train-sequence-pipeline)
- [train_pair_pipeline.py Arguments](./train-pair-pipeline)
- [Tool Scripts](./tools)

## Example Data Prerequisites

Commands on this page require the named input datasets to exist. Use `--data_dir datasets/task_peptide_function/data_quick_384` for the quick function dataset when present; it is distinct from the default full-data path. Pair examples require the selected task’s pair data and any required partner mappings. PSSM/PSFM routes additionally need BLAST and the appropriate profile reference/cache. See [Data Format](../datasets/format) and [Built-in Datasets](../datasets/builtin).
