# Home and Dashboard

The public introduction and workspace overview use separate routes: `/` and `/welcome` render the landing page; `/dashboard` renders the dashboard. Signing in does not turn `/` into a dashboard. These routes also apply when authentication is disabled.

## Public Introduction and Guest Preview

The landing page introduces the four tasks, modeling workflow and workspace entry. Guests can preview the dashboard, dataset list, experiment wizard, model library, leaderboard and AI workspace, and fill ordinary configuration fields. Personal-resource queries, upload, preflight, training, ensemble creation, inference and AI requests still require login. Resource detail, account and administration pages are protected as well.

## Dashboard

`/dashboard` summarizes the current account’s experiments, models and task-family activity, including an experiment activity heatmap, run statuses, reusable models and recent activity. It provides a Configure → Train → Evaluate → Infer path. Failed queries can be retried; empty states do not invent experiment results.

New Experiment resets the draft and opens `/experiments/new`. Use Rerun from an existing experiment to reuse its configuration. Model links open the model library; inference availability depends on the model flag and readiness check.

## Common Operations

1. Enter the workspace and review your activity at `/dashboard`.
2. Select data in the [Experiment Wizard](./experiment-wizard), then check the effective route and Preflight.
3. Monitor the [Experiment List](./experiments) and inspect evidence in [Experiment Detail](./experiment-detail).
4. Use [Model Management](./models) for inference or create a [Model Ensemble](./ensembles).
