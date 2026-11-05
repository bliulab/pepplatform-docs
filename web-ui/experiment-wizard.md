# Experiment Wizard

> A four-step wizard to configure and launch a training run, with **Recommended** and **Custom** modes and live preflight validation.

## Overview

The Experiment Wizard at `/experiments/new` is where every new training run is configured. It is also the destination for **Rerun** and AI Workspace planning-candidate handoffs. A planning handoff displays the candidate rationale and generation-time Preflight snapshot while locking the task and dataset to the original plan. Step 4 runs a live Preflight against the current edited configuration, and no experiment is created until the user explicitly clicks **Start Training**. Use **Convert to regular experiment** to remove the planning association and unlock the context.

The wizard supports a **Recommended** mode that hides advanced controls behind sensible defaults, and a **Custom** mode that exposes additional tokenizer, optimization, regularization, and per-classifier controls.

A live route summary string at the top updates as you make selections, giving you a compact preview of the configuration. The footer's **Start Training** button stays disabled until a dataset is chosen and the preflight check is valid.

## Interface Areas

### Header

- **Eyebrow** label — changes when cloning a rerun or confirming a planning candidate.
- Title and a **Recommended / Custom** toggle.
- Live **route summary** string.
- Planning handoffs also show provenance, the generation-time Preflight snapshot, and a detach action.

### Left Aside — Step Cards

Four clickable step cards. Steps are clickable only when their prerequisites are satisfied; otherwise they are locked.

### Step 1 — Problem

- **Task** select.
- **Dataset** select.

### Step 2 — Representation

- **Feature-extraction route**: classic or pretrained.
- **Tokenizer / Encoder / Feature transformation** selects.

### Step 3 — Predictor

Conditional controls depending on whether the task is a pair or non-pair task:

- **Classic single-sequence route**: Modeling architecture (grouped into sequence and sequence chain-graph families), training mode, and prediction head or downstream classifier. `index` encoding excludes GCN/GAT.
- **Pretrained single-sequence route**: Pooled representation + classifier; custom ESM2 also offers residue embeddings + GCN/GAT, fixed to `end_to_end + MLP`.
- **Pair routes**: Pair strategy, interaction level / interaction architecture, predictor route, pair-graph architecture, and fusion mode. HGT is the typed peptide/partner graph option; GCN, GAT, GraphSAGE, and Graph Transformer use fused sample nodes.
- **Epochs** and **Batch size**.

**Advanced panel** (Custom mode only):

- Tokenizer parameters, optimization, regularization.
- Semantic similarity options.
- Per-classifier hyperparameters.

### Step 4 — Review

- **Experiment name** input — auto-synced in the tokenizer-representation-predictor format (for example, `ESM2-Embedding-MLP` or `ESM2-TokenEmbedding-GAT`) and remains manually editable.
- Four review cards with **Edit** links back to each step.
- Authoritative live **Preflight card** showing a *valid* / *needs-attention* pill.
- The execution script that will be run.
- Errors and warnings lists.

### Footer

- **Back** / **Next** / **Review** navigation.
- **Start Training** — disabled until a dataset is chosen and preflight is valid.

## Common Operations

### Launch a new experiment (Recommended)

1. On the Home or Experiments page, click **New experiment**.
2. In **Step 1**, pick a **Task** and a **Dataset**.
3. Move through **Step 2** and **Step 3** choosing the representation and predictor; in Recommended mode defaults are applied.
4. On **Step 4**, review the preflight card and the generated script.
5. Click **Start Training**.

### Customize hyperparameters

1. Toggle to **Custom** mode in the header.
2. Open the **Advanced** panel on **Step 3** to expose tokenizer, optimization, regularization, similarity, and per-classifier controls.
3. Adjust values and watch the route summary update.
4. Review warnings and resolve blocking preflight errors before launching.

### Rerun an experiment

1. From the [Experiments](./experiments) list or a detail page, click **Rerun**.
2. The wizard opens with the eyebrow indicating a clone; all steps are pre-filled.
3. Edit any step, then start training.

### Confirm a planning candidate

1. Click **Review in Experiments** on a valid planning candidate.
2. Review its rationale and generation-time Preflight snapshot. Task and dataset remain tied to the plan.
3. Adjust the model or training configuration and inspect the live Preflight in Step 4.
4. Click **Start Training** yourself. The backend revalidates the final configuration, plan context, and quota, then links the experiment back to the experiment plan.

::: tip
Switch to **Custom** mode only when you need fine-grained control. The Recommended mode covers the majority of workflows.
:::

::: warning
**Start Training** remains disabled until you have chosen a dataset **and** the preflight check passes. Resolve every error in the Review step.
:::

## Related Pages

- [Experiments](./experiments) — list and manage runs.
- [Experiment Detail](./experiment-detail) — monitor a launched run.
- [Concepts: Routes](../concepts/routes) — what the route summary string represents.

## Selection and Reuse

Checkpoint, threshold and tuning targets are documented in [Selection Objectives](../concepts/selection-objectives). Reusing an existing failed SVM representation is a separate [downstream resume workflow](../web-ui/versions-and-resume), rather than a third training mode.
