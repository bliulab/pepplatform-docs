# Experiments

> List all experiments, monitor run status, and manage them through stop, rerun, delete, and multi-select comparison.

## Overview

The Experiments page is the central registry of every training run you have launched. It lists each experiment with its current status, the task and dataset it used, and the last-updated timestamp, and gives you one-click access to common lifecycle actions: stop a running job, rerun an experiment as a new draft, open its detail page, or delete it once it has finished.

The page also supports multi-select comparison: tick the compare checkbox on up to six experiments and use the toolbar's **Compare selected** button to open the side-by-side [Experiment Comparison](./experiment-compare) view.

## Interface Areas

### Header Panel

- Title and subtitle.
- **New experiment** button — opens the [Experiment Wizard](./experiment-wizard).
- Metric chips: **Total**, **Active** experiment counts.

### List Panel Toolbar

- **Count** chip showing how many experiments are visible.
- **Selected for compare** chip showing how many are currently ticked.
- **Compare selected** button — navigates to `/experiments/compare?ids=...`.

### Experiment Row

Each row contains:

- Link to the experiment's name and a **status pill**.
- Meta grid: task, dataset, updated-at.
- Action buttons:
  - **Compare** checkbox — add to the compare selection (max 6).
  - **Stop** — available only for queued or running experiments.
  - **Rerun** — clones the experiment into the draft store and opens the wizard.
  - **Open** — opens the [Experiment Detail](./experiment-detail).
  - **Delete** — available only for experiments in a terminal status.

## Common Operations

### Start a new experiment

1. Click **New experiment** in the header.
2. Configure and launch from the [Experiment Wizard](./experiment-wizard).

### Stop a running experiment

1. Locate the queued or running experiment.
2. Click **Stop**.
3. Confirm the `window.confirm` prompt.

### Rerun an experiment

1. Locate the experiment you want to rerun.
2. Click **Rerun** — the experiment's configuration is cloned into the draft store.
3. The [Experiment Wizard](./experiment-wizard) opens pre-filled; adjust any fields and launch.

### Compare experiments

1. Tick the **Compare** checkbox on each experiment you want to compare (max 6).
2. Click **Compare selected** in the toolbar.
3. The [Experiment Comparison](./experiment-compare) view opens.

### Delete a finished experiment

1. Locate the experiment in a terminal status.
2. Click **Delete**.
3. Confirm the prompt.

::: warning
The **Delete** action is only enabled once the experiment has reached a terminal status. Stop a running experiment first if you want to remove it.
:::

::: tip
Use **Rerun** to iterate on a previous run — it carries the full configuration into the wizard so you only need to change what matters.
:::

## Related Pages

- [Experiment Wizard](./experiment-wizard) — configure a new or rerun experiment.
- [Experiment Detail](./experiment-detail) — monitor a single experiment.
- [Experiment Comparison](./experiment-compare) — side-by-side analysis.
