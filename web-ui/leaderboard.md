# Leaderboard

> A ranked leaderboard with rich filtering and a direct path to experiment comparison.

Rankings and highlighted cells compare reported values for the selected metric and split. For a meaningful model comparison, match task, labels, data splits and evaluation protocol; the display does not establish general superiority.

## Overview

The Leaderboard at `/leaderboard` ranks trained models across all experiments you have access to. The default view shows your own models; administrators can toggle a **Global** view to include every user's models. Filters let you narrow by task, dataset, sort metric, split, status, and inference readiness, and the resulting ranked list (limited to 200 rows) supports multi-select compare just like the Experiments page.

On narrow screens the table reflows into a card layout, and the rank number is colour-coded — gold, silver, bronze tones — for the top entries.

## Interface Areas

### Header

- Title and subtitle.
- **New experiment** link.
- Metric chips: **visible rows**, **models**, **inference-ready**.

### Filter Panel

Six selectors plus an admin-only option and reset:

- **Task**, **Dataset**, **Sort metric**, **Split**, **Status**, **Inference**.
- **Global** checkbox — admin only; shows all users' models.
- **Reset filters** button.

### Table Panel

Each row shows:

- **Rank** (`#n`) with gold/silver/bronze tones for top entries.
- **Score** and its **source**.
- **Experiment name** + model + **compare toggle** + links.
- **Task / dataset**.
- **Test** and **validation metric stacks**.
- **Route summary**.
- **Inference** chip.
- **Finished date**.

On mobile, this table reflows into stacked cards.

### Compare Tray

- Shows the number of selected experiments.
- **Compare selected** button — opens the [Experiment Comparison](./experiment-compare) view.

## Common Operations

### Filter the leaderboard

1. Open the **Filter Panel**.
2. Set any combination of the six selectors (task, dataset, sort metric, split, status, inference).
3. The table re-queries with a limit of 200 rows.
4. Click **Reset filters** to restore defaults.

### Compare top-ranked models

1. Tick the **compare toggle** on up to six rows.
2. Click **Compare selected** in the compare tray.
3. The [Experiment Comparison](./experiment-compare) view opens.

### Admin: see all users' models

1. Tick the **Global** checkbox in the Filter Panel (admin only).
2. Every user's models appear in the ranking.

::: tip
The rank row is colour-coded — gold, silver, and bronze tones — so the top models stand out at a glance.
:::

::: warning
The leaderboard caps at 200 visible rows. Tighten your filters if you cannot find a specific model.
:::

## Related Pages

- [Experiments](./experiments) — manage your own runs.
- [Experiment Comparison](./experiment-compare) — side-by-side analysis.
- [Models & Inference](./models) — model library and inference.
