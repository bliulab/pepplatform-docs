# Task Types

PepPlatform supports four peptide modeling tasks, defined in `pepplatform/web/capabilities.py`. Tasks are divided into **single-sequence tasks** and **pair interaction tasks**, which determine the input format and available modeling routes.

Task names below match the labels returned by the platform API and shown in the Web interface; the `--task_type` identifiers are the stable contract, so prose may refer to a task by a shorter name.

Label meaning follows the training data. A predicted label or score is a model output, not experimental confirmation of peptide function or binding.

## Task Overview

| Task ID | Name | Input type | Input format | Typical use |
| --- | --- | --- | --- | --- |
| `pep_function` | Therapeutic peptide function prediction | Single sequence | One peptide sequence | Predict peptide function class / multi-label function annotation |
| `pep_protein_interaction` | Peptide–protein interaction prediction | Pair | Peptide sequence + protein sequence | Predict whether a peptide binds a protein |
| `pep_hlai` | Peptide–HLA-I ligand presentation prediction | Pair | Peptide sequence + HLA-I sequence | Predict peptide binding to HLA-I molecules |
| `pep_hlaii` | Peptide–HLA-II ligand presentation prediction | Pair | Peptide sequence + HLA-II sequence | Predict peptide binding to HLA-II molecules |

## Single-Sequence Tasks

### pep_function — Therapeutic Peptide Function Prediction

- **Input**: A single peptide amino-acid sequence.
- **Output**: Dataset-defined function labels. Multilabel metrics include macro-F1 and `SAcc` (sample/Jaccard accuracy). The default checkpoint objective is macro-F1; labels and their number come from the dataset.
- **Routes**: Both the pretrained-model route and the classic-feature route are supported.

::: warning Evaluation Metrics
`SAcc` is the sample/Jaccard accuracy for multi-label peptide-function evaluation and is not the same metric as Balanced Accuracy. In training and Web summaries, `Balanced Accuracy` should be written out in full rather than abbreviated to `BAcc`; `Recall (Sensitivity)` is a single metric label for binary tasks and should not be shown as two separate values.
:::

## Pair Interaction Tasks

The three pair tasks all take **two sequences** as input and model the interaction between the two sides. They share the [Pair Interaction](./pair-interaction) workflow but differ in details such as semantic auxiliary loss.

### pep_protein_interaction — Peptide–Protein Interaction Prediction

- **Input**: Peptide sequence + protein sequence.
- **Output**: Binary (binds / does not bind).
- **Notes**: The most general pair task; the two sides often differ greatly in length.

### pep_hlai — Peptide–HLA-I Ligand Presentation Prediction

- **Input**: Peptide sequence + HLA-I sequence.
- **Output**: Binary (binds / does not bind).
- **Notes**: As for every pair task, the unified semantic layer automatically uses positive-training-neighborhood Jaccard and adds no HLA-I-specific anchor rule. See [Semantic Auxiliary Loss](./semantic-loss).

### pep_hlaii — Peptide–HLA-II Ligand Presentation Prediction

- **Input**: Peptide sequence + HLA-II sequence.
- **Output**: Binary (binds / does not bind).
- **Notes**: Prepare the HLA-II partner representation and sequence view required by the selected data format; task-specific defaults do not establish a biological binding result.

## Tasks vs Routes

| Task | Pretrained route | Classic route | Pair workflow |
| --- | --- | --- | --- |
| `pep_function` | Supported | Supported | — |
| `pep_protein_interaction` | Supported (route constraints apply) | Supported | Supported |
| `pep_hlai` | Supported (route constraints apply) | Supported | Supported |
| `pep_hlaii` | Supported (route constraints apply) | Supported | Supported |

::: tip Pretrained Pair Tasks
Pretrained pair tasks support Two-stream and constrained residue-level Single-stream; representation settings, masks and architecture must pass route validation. See [Feature Routes](./routes).
:::
