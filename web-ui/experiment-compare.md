# Experiment Comparison

> Side-by-side comparison of two or more experiments covering metrics, training curves, analysis curves, and a configuration diff, with Markdown and JSON report export.

Rankings and highlighted cells compare reported values for the selected metric and split. For a meaningful model comparison, match task, labels, data splits and evaluation protocol; the display does not establish general superiority.

## Overview

The Experiment Comparison view at `/experiments/compare?ids=...` lets you select multiple experiments and compare the available metrics, curves and configuration fields. The selection is driven by the URL — the page calls `router.replace` to keep the `?ids=` query string in sync as experiments are added or removed — so a comparison can be bookmarked or shared.

You get a metric matrix (with the best cell per row highlighted in emerald), training curves you can toggle between `val_f1`, `val_auc`, `train_loss`, and `val_loss`, analysis curves (ROC/PR) with a split selector, and a configuration diff table where cells that differ across experiments are highlighted in amber. Reports can be exported as Markdown or JSON.

## Interface Areas

### Header

- Title and **Back** link.
- **Export Markdown** and **Export JSON** buttons.
- Metric chips: **selected count**, **task**, **dataset**.

### Experiment Set Table

One row per compared experiment:

- Name (link to detail), status, task, dataset.
- **Route summary** string.
- Finished date.
- **Remove** button to drop an experiment from the comparison.

### Metric Matrix

- **Sort metric** and **Sort split** selectors.
- The best cell in each row is highlighted in emerald.

### Training Curves

- Toggle between `val_f1`, `val_auc`, `train_loss`, and `val_loss`.

### Analysis Curves

- **Split** selector.
- **ROC** and **PR** curves overlaid for all selected experiments.

### Config Diff

- Table of configuration keys across experiments.
- **Show only differences** checkbox — hides identical rows.
- Cells that differ are highlighted in amber.

## Common Operations

### Open a comparison

1. From the [Experiments](./experiments) list, tick the **Compare** checkbox on up to six experiments.
2. Click **Compare selected** in the toolbar.
3. The comparison view opens with the selected `?ids=`.

### Add or remove an experiment

- To remove: click **Remove** on the experiment's row in the set table — the URL updates automatically.
- To add: return to the [Experiments](./experiments) list, tick another experiment, and choose **Compare selected** again.

### Export a report

1. Click **Export Markdown** or **Export JSON** in the header.
2. The report downloads with the current selection and view settings.

### Focus on differences

1. In the **Config Diff** table, tick **Show only differences**.
2. Identical configuration rows are hidden; differing cells remain highlighted in amber.

::: tip
Because the selection lives in the URL, you can bookmark or share a comparison link directly.
:::

::: warning
Comparison is limited to a maximum of six experiments to keep the matrix and curves readable.
:::

## Related Pages

- [Experiments](./experiments) — select experiments to compare.
- [Experiment Detail](./experiment-detail) — drill into a single experiment.
- [Leaderboard](./leaderboard) — another entry point for comparison selection.
