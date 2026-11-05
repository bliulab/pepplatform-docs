# Evaluation Protocol

PepPlatform evaluates model routes with a consistent separation of training, validation and independent testing. The saved results record feature fitting, graph construction, decision thresholds and metrics.

## Independent-test rule

- Training data fit model parameters, vocabularies, static embeddings, statistical transforms, and profile reference databases.
- Validation data select checkpoints, control early stopping, and fit decision thresholds.
- Independent test data only evaluate a frozen model and operating point.

Threshold fitting defaults to F1 for binary tasks and per-label macro-F1 for multilabel tasks. Configured SAcc or dual objectives use their corresponding validation search. Checkpoint, tuning and threshold objectives are independent; see [Selection Objectives](./selection-objectives). After restoring the best checkpoint, final validation thresholds are refitted and frozen for tests and Web inference.

Every distribution-learning feature generator is fit on training data only. Sample-graph models build their reference graph from training nodes only; validation/test nodes are temporary queries that receive directed `Train → query` messages, with no reverse or query-query edges.

## Metric averaging

Primary multi-label results use exact-match accuracy, SAcc, macro-F1, macro-AUC, and macro-AUPR. Explicitly named micro-AUC, micro-AUPR, and micro-averaged ROC/PR curves are saved as supplemental results. Binary tasks report ROC-AUC, AUPR, F1, accuracy, Balanced Accuracy, precision, Recall (Sensitivity), specificity, and MCC.

When a split does not contain the classes required to define AUC or AUPR, the metric is marked unavailable rather than replaced with an artificial default.

## Auditable artifacts

Saved models include `feature_fit_scope` and `evaluation_mode`, the validation-derived operating point, threshold source, checkpoint metric, continuous scores and structured evaluation results. Format-version fields allow the loader to check compatibility. Older files may lack the information needed to verify that features were fitted on training data only; compare their results only after checking how they were produced.

Run `python tools/audit_evaluation_protocol.py <results-dir>` to recompute and verify file-format compatibility, threshold sources, and saved metrics without retraining models.
