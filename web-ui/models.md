# Models & Inference

> Browse the trained-model library, rename or delete models, and run inference against an inference-ready model.

## Overview

The Models page at `/models` lists model records registered in the Web runtime and visible to the current account. Select a model to inspect its inference panel; `?model=<id>` retains the selection in the URL. A model produced separately by CLI is not automatically registered here.

Each model row carries chips stating whether it is *inference-ready* or *metrics-only*, the dataset it was trained on, its best metric, and its creation date. Models that support inference load the right-hand InferencePanel; otherwise the panel is disabled with an explanation.

## Interface Areas

### Model List (Left)

- **Count** chip showing how many models are visible.
- Radio-selectable rows. Each row shows:
  - Model name.
  - **Route summary** string.
  - Chips: **inference-ready** / **metrics-only**, **dataset**, **metric**, **created date**.
- Row actions:
  - **Edit** — opens an inline rename form.
  - **Delete** — removes the model.

### Inference Panel (Right)

- Active when the selected model supports inference.
- Disabled with a reason message when the model is *metrics-only*.
- Lets you provide input and run inference against the selected model.
- Pair models require both sides of the pair as input.
- PSSM/PSFM-backed models may need BLAST+ on the backend so profiles can be generated during inference.
- `sample_graph` pair models require saved reference graph artifacts; otherwise the model is shown as not inference-ready.

## Common Operations

### Select a model

1. In the model list, click the **radio** next to a model.
2. The `?model=` query parameter updates and the InferencePanel on the right loads the selected model.

### Run inference

1. Select an inference-ready model.
2. In the **InferencePanel**, provide the required input.
3. Submit the request to view predictions.

### Rename a model

1. Click **Edit** on the model row.
2. The inline rename form appears.
3. Change the name and save.

### Delete a model

1. Click **Delete** on the model row.
2. Confirm the `window.confirm` prompt.

::: tip
Sharing a URL with `?model=<id>` opens the page with that model already selected and its InferencePanel loaded.
:::

::: warning
Models labelled *metrics-only* do not support inference — the InferencePanel will be disabled with an explanation.
:::

## Related Pages

- [Experiments](./experiments) — the runs that produce models.
- [Experiment Detail](./experiment-detail) — open the inference panel from a finished run.
- [Leaderboard](./leaderboard) — ranked view of all models.

## Streaming Inference, History and Ensembles

Inference displays progress stages, saves successful requests to account-scoped history, and supports reviewing, deleting and exporting results as CSV. Uploaded input tables may use CSV/TSV/TXT as described in [Data Format](../datasets/format). Ready registered models can be selected for a [new ensemble](./ensembles). Inspect score kind: raw SVM margins and batch-dependent rank fusion are not calibrated probabilities. Readiness may still block a model whose metadata says it supports inference when dependencies or integrity checks fail.
