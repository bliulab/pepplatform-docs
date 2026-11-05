# Experiment Detail

> Monitor and inspect a single experiment — run status, metrics, logs, evaluation curves, representation diagnostics, performance summary, inference, and AI analysis.

## Overview

The Experiment Detail workspace at `/experiments/:id` provides **Overview**, **AI Analysis**, and **Visual analysis** tabs. Overview monitors the run, AI Analysis provides conversational diagnostics, and Visual analysis generates heatmaps on demand.

AI Analysis interprets available evidence and proposes research directions and success criteria. It does not generate formal candidate configurations. The complete report can be handed to [AI Experiment Planning](./agent), which creates comparable candidates before the user reviews one in the Experiment Wizard.

## Interface Areas

### Header Panel

- Experiment name and **status pill**.
- Dataset reference.
- Metric chips appropriate to the task.

### Run Status + Model Readiness

- **Progress bar** and **ML stage indicators**.
- **Failure / error card** if the run failed.
- Actions: **Cancel**, **Add to compare**, **Rerun**, **Open model library**.

### AI Analysis Workspace

- **Conversation history** — create multiple experiment-scoped threads, then search, rename, pin, or delete them.
- **Structured first report** — the first prompt produces a diagnostic report with a summary, evidence, findings, recommendations, and limitations. Evidence links return to the relevant Overview section.
- **Streaming follow-ups** — subsequent questions continue from the saved report and render as streaming Markdown.
- **Context drawer** — inspect the captured context scope, timestamp, and fingerprint, and optionally include a dataset preview, inference summary, or extended logs.
- **Planning handoff** — **Plan next round in AI Workspace** attaches the complete report and automatically selects the current experiment as a baseline. AI Analysis no longer opens the Experiment Wizard directly.

Running experiments can produce a clearly marked **provisional** report. Completed, failed, or canceled runs produce a final report. Queued experiments are disabled because they do not yet contain useful evidence. Analysis uses platform-owned experiment context only and does not perform web search.

### Metrics + Logs

- **SplitMetricChart** or **MetricChart** depending on task.
- Tuning results summary.
- Logs rendered in a dark terminal-style `<pre>`.

### Evaluation Curves

- **ROC** and **PR** curves.
- **Confusion matrix**.
- **Threshold sweep**.
- **Score distribution**.

### Representation Diagnostics

- Cluster summary.
- **2D / 3D projection** of learned features.
- **Feature importance**.

### Visual analysis

Open `/experiments/:id/visualizations` from the overview or workspace tab. Choose an analysis, data split and parameters, then select **Generate analysis**. Only one chart is loaded at a time. Only active jobs poll; opening the page does not automatically analyze Test scores.

- **Stratified performance:** allele × original peptide length for HLA-I, complete HLA pair × peptide length for HLA-II, and protein sequence group × peptide length for PPI. Protein groups use sequence digests, not inferred target names.
- **Per-label metrics:** ACC, F1, ROC-AUC and AUPR for multilabel function prediction. ACC is per-label binary accuracy; AUPR is Average Precision.
- **Label patterns:** true or predicted co-occurrence, joint false negatives, and joint false positives, as counts or Jaccard. Co-occurrence does not imply class confusion.

Threshold-dependent metrics and events use the saved validation operating point without refitting. Stratification requires trustworthy sample alignment; older scores without this evidence can still support per-label analyses. Named tests such as warm/cold remain separate, and Test views are explicitly post-hoc.

Gray cells indicate missing, undefined or low-support results (fewer than 20 samples by default). Small-group values can be revealed explicitly. Select cells or table values for support details. Matrices are paginated at 50 rows/columns; CSV exports all aggregated cells, while PNG exports the current view with a provenance JSON companion.

Visualizations read completed, Web-managed experiments only. Derived caches live in the Web runtime's `visualizations/` directory. It does not modify models, predictions, thresholds or `analysis.json`, and does not import or rerun historical paper experiments.

### Performance Summary + Inference

- Metric chips grid for the best split.
- Configuration snapshot details.
- **InferencePanel** — only active when the model is inference-ready.

## Common Operations

### Monitor a running experiment

1. Open the experiment from the [Experiments](./experiments) list or a Home tile.
2. Watch the **progress bar** and **stage indicators** in the Run Status card; representation-to-classifier runs show Representation → Embedding export → Classifier fit → Evaluate & archive. During LightGBM fitting, the live detail includes output, tree iteration, CPU threads, stage elapsed time, and ETA after enough work has completed. The page auto-refreshes every 2s while running.
3. Scroll to the **Metrics + Logs** area to follow live metric values and tail the training log.

### Stop a running experiment

1. Click **Cancel** in the Run Status card.
2. Confirm the `window.confirm` prompt.

### Rerun an experiment

1. Click **Rerun** in the Run Status card.
2. The configuration is cloned into the draft store and the [Experiment Wizard](./experiment-wizard) opens pre-filled.

### Diagnose an experiment with AI

1. Open the **AI Analysis** tab and choose a **Provider**.
2. Select a suggested diagnostic question or enter your own objective.
3. Review the structured report and use its evidence links to verify source data in Overview.
4. Continue with follow-up questions in the same thread, or create a separate conversation for another line of investigation.
5. Click **Plan the next round in AI Workspace** to attach the report and generate candidates in Experiment Planning.
6. Select a candidate, review it in the Experiment Wizard, run Preflight, and explicitly start training.

### Run inference on a finished model

1. Wait until the **Model readiness** indicator shows the model is ready.
2. Scroll to the **Inference** section.
3. Provide input and run inference.

::: tip
The page auto-refreshes only while the experiment is queued or running. Once a terminal status is reached, refreshing stops automatically.
:::

::: warning
If a failure card appears, the logs section will contain the error traceback. Use **Rerun** after correcting your configuration.
:::

::: tip
AI Analysis explains evidence and proposes research directions. Experiment Planning generates candidates; the Experiment Wizard runs Preflight before the user confirms training.
:::

## Related Pages

- [Experiments](./experiments) — list and lifecycle management.
- [Experiment Wizard](./experiment-wizard) — rerun flow.
- [Experiment Comparison](./experiment-compare) — compare this run with others.
- [Models & Inference](./models) — model library and inference.

## Versions and Downstream Resume

The overview includes [version records](./versions-and-resume) and a JSON summary download. Eligible failed SVM experiments expose downstream resume, preserving the learned representation while creating a new run. [Visualization API](../api/visualizations) documents the separate on-demand heatmap job lifecycle.
