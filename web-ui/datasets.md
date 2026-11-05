# Datasets

> Upload new `.zip` datasets and browse the dataset library with per-dataset validation reports.

## Overview

The Datasets page lets you upload new training datasets and manage the existing library of datasets available to your experiments. It uses a two-column layout: an upload panel on the left and the dataset library on the right.

Uploading a dataset is gated by validation — PepPlatform inspects the archive, infers its format and split structure, and produces a report card you can expand to verify sample counts, label modes, and length summaries before using the dataset in an experiment. Built-in datasets are shown alongside your uploaded ones; both can be inspected through the same report view, but only uploaded datasets can be deleted.

Label and pair tables inside the ZIP may use `.tsv` (tab-separated), including alongside CSV tables. Same-name CSV files take precedence. The platform preserves the TSV originals and creates canonical CSV files for validation, reports, and experiment readers. See [TSV formats](../datasets/format#tsv-in-web-uploads) for supported locations.

## Interface Areas

### Upload Panel (Left)

- **Name** input — friendly label for the dataset.
- **Task type** select — four supported task types.
- **Protocol card** — a task-specific guide describing the expected archive layout.
- **Dropzone** — drag-and-drop target for `.zip` files.
- **Upload** button — submits the archive for validation and registration.

### Library Panel (Right)

- Paginated list of dataset cards, four per page.
- Each card shows chips for **name**, **task**, **format**, **source** (built-in/uploaded), and **split count**.
- Action buttons per card:
  - **Use in new experiment** — seeds the wizard with this dataset.
  - **View / Hide report** — toggles an inline validation report.
  - **Delete** — shown only for uploaded datasets.

### Inline Dataset Report

- **Total samples** and **label-mode** summary.
- Validation status and any reported issues.
- One card per split with sample counts and length summaries.
- A preview table of representative samples.

## Common Operations

### Upload a new dataset

1. Enter a **Name**.
2. Select the matching **Task type** — the protocol card updates to show the expected layout.
3. Drag a `.zip` file onto the dropzone (or click it to browse).
4. Click **Upload**.
5. After validation, the dataset appears in the library. Expand its **report** to confirm contents.

### Use a dataset in a new experiment

1. Find the dataset card in the library.
2. Click **Use in new experiment**.
3. You are taken to the [Experiment Wizard](./experiment-wizard) with the dataset pre-selected.

### Remove an uploaded dataset

1. Locate the uploaded dataset card.
2. Click **Delete**.
3. Confirm the prompt.

::: warning
Deletion is subject to account permissions. Built-in datasets cannot be deleted; uploaded datasets still referenced by experiments cannot be removed.
:::

::: tip
Always expand the report after upload to confirm split counts and label balance before training on a new dataset.
:::

## Related Pages

- [Experiment Wizard](./experiment-wizard) — use a dataset in a new experiment.
- [Datasets Format](../datasets/format) — expected archive layout.
- [Datasets Upload](../datasets/upload) — Web/API upload reference.

## Public Sources and TXT

TXT conversion is also available for supported files inside newly uploaded ZIPs; see [Data Format](../datasets/format). Public database fetching is currently a separate [CLI workflow](../datasets/public-databases-cli), not an action on this page. Built-in entries appear only for files deployed on this instance.
