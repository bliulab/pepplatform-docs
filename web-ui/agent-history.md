# Experiment Plans & Iterations

> Browse past experiment plans and iterative rounds, and launch the next round after review.

## Overview

This section covers two related routes: **Experiment Plan History** at `/agent/plans` for browsing plans and iterative runs, and **Iterative Plan** at `/agent/campaigns/:id` for inspecting rounds and launching the next one. Both pages share the same styling and rely on the plan data produced by [AI Experiment Planning](./agent).

The Plans page lets you filter by task, dataset, and status, and lists campaigns first (with round-progress) followed by individual plans. The Campaign page focuses on a single campaign's ordered rounds, exposing per-round objectives, models, quality, and the latest review block; from there you can launch the next round if gating conditions are met.

## Interface Areas

### Experiment Plan History — `/agent/plans`

#### Header

- Title and subtitle.
- **New plan** link.

#### Filter Row

- Task, dataset, status, and page-size selectors.

#### Campaigns Section

- Campaign cards showing status, task, round-progress, and objective.
- **View campaign** button → `/agent/campaigns/:id`.

#### Plans List

- Plan cards with status, task, model, has-review flag, objective, dataset, and action count.
- Actions: **View plan**, **Reuse plan**, **Delete plan**.

#### Pagination

- Standard pagination control.

### Iterative Plan — `/agent/campaigns/:id`

> Similar in styling to the plans page but focused on a single campaign's rounds.

#### Header

- Objective, dataset, round-progress.
- **History** and **New plan** links.

#### Next-Round Launcher

- **Provider** select.
- **Include dataset preview** checkbox.
- **Create next round** button — disabled with a reason when blocked.

#### Rounds List

Ordered by round index, each round shows:

- **Round-number** pill, **status**, **model**, **quality**.
- **Objective** for the round.
- **Created-experiment** count.
- **Has-review** chip.
- **View plan** link.
- Latest review block: summary, best experiment, recommendations, risks.

## Common Operations

### Browse and filter plans

1. Open **Experiment Plan History**.
2. Use the filter row to narrow by task, dataset, or status.
3. Adjust page size if needed.
4. Open any campaign via **View campaign**, or any plan via **View plan**.

### Reuse a past plan

1. Locate a plan card.
2. Click **Reuse plan** — the [AI Workspace](./agent) opens seeded with the plan's configuration.

### Delete a plan

1. Locate the plan card.
2. Click **Delete plan**.
3. Confirm the prompt.

### Launch the next campaign round

1. Open the campaign via **View campaign**.
2. Pick a **Provider** and toggle **Include dataset preview**.
3. Click **Create next round** — if gated (max rounds reached, previous round unfinished, or a required review missing), the button is disabled with a reason.
4. Creating a round invalidates caches and navigates to `/agent/design?plan_id=…` to start the round.

::: tip
The **Create next round** button explains why it is disabled — fixing that reason (e.g. waiting for the previous round's review) will re-enable it.
:::

::: warning
Creating a new round invalidates cached plan data. Any unsaved inline edits in the AI Workspace will be lost.
:::

## Related Pages

- [AI Experiment Planning](./agent) — generate new plans and iterations.
- [Experiment Wizard](./experiment-wizard) — apply a candidate design.
- [Experiments](./experiments) — review executed experiments.
