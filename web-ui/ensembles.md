# Model Ensembles

The wizard at `/ensembles/new` creates an ensemble experiment from at least two eligible registered models; a successful run can register an inference model. It reuses members without retraining their representations or weights.

## Eligibility

Members must have the same task, support inference, be managed by the current Web runtime, and retain current evaluation metadata documenting that features were fitted on training data only. Label names and order must match, including the dataset columns for peptide function. Validation input identities must agree. Models from unrelated data or label orders cannot simply be mixed. Nested ensembles are not supported.

## Methods and Weights

| Method | Meaning and limits |
| --- | --- |
| `probability_mean` | Weighted mean of probabilities; member scores must be in `[0, 1]` |
| `logit_mean` | Clip probabilities, fuse in logit space, then transform back |
| `rank_mean` | Rank each label within the complete request batch and fuse; requires at least two rows and depends on batch composition, rather than being an independent per-row probability |

Weights may be equal, custom or validation-selected. Custom weights follow member order, must be finite and nonnegative with a positive total, and are normalized. Validation weight search uses a `grid_step` between `0.01` and `0.5` that divides 1 exactly. Model-selection and decision-threshold objectives are separate; see [Selection Objectives](../concepts/selection-objectives).

## Workflow

1. Select a task, dataset and at least two members.
2. Choose fusion, weight source and validation objectives. Test evaluation is off by default.
3. Run Preflight and resolve member, label or data-identity errors.
4. Confirm creation and monitor the normal experiment detail page.
5. Use the resulting model in the library. Inference uses saved member snapshots and reports fusion and batch information.

`PEP_WEB_ENSEMBLES_ENABLED=0` pauses new creations while retaining history and existing inference. Creation consumes the experiment quota. See the [Ensemble API](../api/ensembles).
