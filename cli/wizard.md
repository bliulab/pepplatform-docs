# Interactive Wizard

The interactive wizard guides you step by step through choosing feature extraction, encoders, models, and other components, so you don't have to remember every argument. All wizard prompts are in English.

## Wizard Classes

| Wizard class | Script | Notes |
| --- | --- | --- |
| `InteractiveConfigWizard` | `scripts/train_sequence_pipeline.py` | Single-sequence wizard, defined in `pepplatform/cli_wizard.py` |
| `PPIInteractiveWizard` | `scripts/train_pair_pipeline.py` | Pair-task wizard, inherits from `InteractiveConfigWizard` |

## How to Trigger

Run a script with no arguments, or pass `--interactive` / `--advanced_wizard` to enter the wizard:

```bash
# No arguments -> wizard launches automatically
python scripts/train_sequence_pipeline.py

# Explicit trigger
python scripts/train_sequence_pipeline.py --interactive

# Advanced mode with more options
python scripts/train_sequence_pipeline.py --advanced_wizard

# Pair-task wizard
python scripts/train_pair_pipeline.py
```

::: tip Wizard equals CLI
The wizard builds a training configuration for the controls it exposes. The CLI also provides additional advanced options. Inspect the final command, effective configuration and route validation; the two interfaces need not expose identical option sets.
:::

::: warning Prompt language
All wizard prompts are in English.
:::

## Basic vs Advanced Mode

`--advanced_wizard` exposes additional options hidden in the basic wizard (such as more encoders, fusion modes, and the export-embeddings route). Beginners can use the basic wizard; advanced users can switch to the advanced wizard.

## Single-Sequence Guided Flow

### Pretrained-model path

1. `Choose feature extraction`
2. `Choose pretrained model`
3. For every pretrained model, `Choose predictor route` selects pooled classification or residue modeling.
4. Residue modeling selects CNN/RNN/GRU/LSTM/Transformer or GCN/GAT, a training mode, and the adapter dimension.
5. `end_to_end` uses a neural prediction head; `export_embeddings` continues to a classical downstream classifier.

### Classic global-feature path

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. `Choose feature transformation`
5. `Choose classifier`

::: info Feature transformation options
Supported fitted transformations are `bow -> none / lsa / lda / plsa` and `TF-IDF, textrank -> none / lsa`. LSA is uncentered truncated SVD for single-sequence classic global features, and LDA/PLSA accept only BoW raw counts. The Pair wizard does not expose LSA; it exposes LDA/PLSA only for the strict Two-stream classic-BoW, concat, vector-interaction, classical-classifier route.
:::

### Classic modeling-architecture path

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. `Choose modeling architecture`
5. `Choose training mode`
6. If exporting embeddings: `Choose downstream classifier`

There are two training modes:

- `end-to-end prediction` — train the modeling architecture with a neural prediction head end to end.
- `export embeddings for downstream classification` — train the modeling architecture with a temporary neural head, restore the best checkpoint, export embeddings, then train a downstream classical classifier as the final predictor. Temporary-head metrics are diagnostic for representation learning, not the final result.

The architecture menu labels sequence and sequence chain-graph families. `index` exposes only sequence architectures; encoders with per-position feature vectors also expose GCN/GAT.

## Pair-Task Guided Flow

Pair tasks add one more layer — the pair strategy — between the encoder and the final predictor:

1. `Choose feature extraction`
2. `Choose pretrained model` or `Choose tokenizer`
3. If using the classic pipeline: `Choose encoder`
4. `Choose pair strategy`

### If you choose `single_stream` (role-boundary sequence join)

- `Choose modeling architecture`
- `Choose training mode`
- If exporting embeddings: `Choose downstream classifier`

### If you choose `two_stream`

- `Choose interaction level`
- **vector-level interaction**:
  - `Choose predictor route`
  - `Choose classifier` or `Choose sample-graph architecture`
  - `Choose fusion`
- **token-level interaction**:
  - `Choose interaction architecture`
  - `Choose training mode`
  - If exporting embeddings: `Choose downstream classifier`

::: info Pair structure
- `single_stream`: use one homogeneous encoder contract, add an explicit role boundary, then feed the compact joined sequence into one sequence model.
- `two_stream` + vector-level: encode each side separately, fuse the vectors, then feed into a classifier or sample-graph predictor.
- `two_stream` + token-level: encode each side separately, interact via `cross_attn` / `bi_cross_attn`, then feed into a neural head or export interaction embeddings.

The pair-graph predictor family stays on the Two-stream vector route. GCN, GAT, GraphSAGE, and Graph Transformer use fused sample nodes; HGT uses typed peptide/partner nodes and a pair-edge decoder.
:::

::: warning Pretrained pair tasks
Pretrained pair tasks support Two-stream and Single-stream with matching role settings and explicit residue masks. Follow the current wizard and route validation for allowed combinations.
:::

## Related Pages

- [CLI Overview](./overview)
- [train_pipeline.py Arguments](./train-pipeline)
- [train_sequence_pipeline.py Arguments](./train-sequence-pipeline)
- [train_pair_pipeline.py Arguments](./train-pair-pipeline)
- [Recipes](./recipes)
