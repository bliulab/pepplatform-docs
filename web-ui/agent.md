# AI Workspace

> Plan experiments and ask research questions without granting autonomous execution permission.

## Overview

The AI Workspace uses `/agent` as a compatibility route. Its Experiment Planning tab turns a natural-language objective into candidate experiment designs; its Research Q&A tab provides persistent conversations. A diagnostic handoff from one experiment attaches the complete report and automatically selects that experiment as a baseline.

Experiment Planning generates, compares, and edits candidates, but it does not create experiments directly. Selecting one candidate carries its plan association, configuration, and generation-time Preflight snapshot into the [Experiment Wizard](./experiment-wizard). The user reviews the current Preflight and explicitly starts training there. Once confirmed, the planning page continues to auto-poll progress every four seconds and triggers a review when the report is ready.

Missing keys or ineligible quota can disable search; search failures are recorded and ordinary chat can continue if the configured provider request succeeds. Chat still requires access to that provider. This is not a guarantee about external-service availability or billing.

## Interface Areas

### Configuration Panel (Left)

- **Provider** select.
- **Task** and **Dataset** selects.
- **Objective** textarea.
- **Baseline experiments** multi-select.
- **Include dataset preview** checkbox.
- **Generate** button.

### Results Panel (Right)

- Header with **model**, **token-usage**, and **context summary**.
- **Cards / Compare** view-mode toggle.

### Execution Progress

- Links to experiments confirmed in the Wizard.
- Progress bar.
- Status-count chips.

### Review Summary

- Summary text.
- **Best experiment**.
- **Metric evidence**.
- **Analysis findings**, **recommendations**, **risks**.

### Candidate Cards

- **Lane / Action / Status / Valid / Risk** pills.
- Title and rationale.
- **Review in Experiments** → Wizard with planning provenance.
- **Edit config** — inline JSON editor that revalidates the candidate without creating an experiment.

### Context Manifest

- A summary of the context that was sent to the LLM.

## Common Operations

### Generate a single-plan design

1. Set **Provider**, **Task**, and **Dataset**.
2. Write an **Objective**.
3. Optionally pick baseline experiments and tick **Include dataset preview**.
4. Click **Generate**.
5. Compare or edit candidate cards, then choose one to review in the Wizard.

### Apply a candidate to the wizard

1. On a valid candidate card, click **Review in Experiments**.
2. The [Experiment Wizard](./experiment-wizard) opens with the candidate configuration, experiment-plan association, and Preflight snapshot.
3. Review the live Preflight, make any allowed configuration changes, and click **Start Training** yourself.

### Edit a candidate's config

1. Click **Edit config** on the candidate card.
2. Modify the inline JSON.
3. Open it in the Wizard for final Preflight and confirmation.

::: tip
The page auto-polls every 4 seconds while a plan is running, so you can leave it open and watch progress live.
:::

::: warning
A planning candidate never creates an experiment by itself. The Wizard's live Preflight, authorization, and quota checks are authoritative at submission time.
:::

## Related Pages

- [Experiment Plans & Iterations](./agent-history) — history and next-round launches.
- [Experiment Wizard](./experiment-wizard) — inspect and confirm a candidate.
- [Experiments](./experiments) — review executed experiments.
