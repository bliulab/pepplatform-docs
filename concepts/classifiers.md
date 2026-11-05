# Classifiers

A classifier is the final prediction step of the modeling pipeline, selected via the `--classifier` argument. The platform provides 1 neural prediction-head family and 7 classical classifiers.

## Classifier Overview

| Classifier | Type | Description |
| --- | --- | --- |
| `mlp` | Neural head | Multi-layer perceptron with at least one nonlinear hidden layer, trained in end-to-end routes |
| `svm` | Classical | Support Vector Machine with margin or sigmoid/Platt probability mode |
| `rf` | Classical | Random Forest |
| `extratrees` | Classical | Extra Trees (extremely randomized trees) |
| `histgb` | Classical | Histogram-based Gradient Boosting |
| `xgb` | Classical | XGBoost |
| `lgb` | Classical | LightGBM |
| `logreg` | Classical | Logistic Regression |

## Neural Classifier (MLP)

`mlp` is the neural prediction head for end-to-end routes:

1. **Multi-layer perceptron**: With non-empty `head_hidden_dims`, the head stacks `Linear -> activation -> Dropout` hidden layers and a final logits layer.
2. **Linear compatibility variant**: `head_hidden_dims=[]` resolves to a `Linear` head, not an MLP; historical `mlp+[]` configurations are accepted only as input aliases.

::: tip Relationship with Sequence Models
When you select the sequence-model path with `end_to_end` training mode, the default prediction head is an MLP. This is the default mapping result of the legacy `--model cnn|rnn|gru|lstm|transformer` commands (`classifier=mlp`). A zero-hidden-layer preset is shown as `Linear` in the effective route and generated model name.
:::

`export_embeddings` does not use MLP as the final downstream classifier. It first learns and freezes a representation with a temporary neural head, then fits SVM, Random Forest, ExtraTrees, HistGB, XGBoost, LightGBM, or Logistic Regression.

## Classical Classifiers

Classical classifiers operate on **global features** (global-encoder output, optionally after a [feature transform](./feature-transforms)) or on embeddings exported by a sequence model. Each classifier has its own hyperparameters.

### Bounded Hyperparameter Search

Custom Web experiments can enable training-split cross-validation for every classical classifier. Quick, Standard, and Thorough budgets evaluate at most `6×2`, `12×3`, and `18×5` candidate-fold combinations. Manually entered parameters are always retained as the baseline candidate. The selected result is only the best observed member of the bounded candidate space, not a guaranteed global optimum. Feature transforms, scalers, and reducers are fitted independently inside each fold, then refitted on the complete training split after selection; the external validation split remains reserved for final threshold calibration. For `export_embeddings` routes, CV tunes only the downstream classical classifier and does not retrain the upstream neural network per fold.

### SVM

| Parameter | Default | Description |
| --- | --- | --- |
| `--svm_c` | `1.0` | Regularization parameter |
| `--svm_class_weight` | `balanced` | Class weight: `balanced` / `none` |
| `--svm_max_iter` | `2000` | Maximum iterations |
| `--svm_tol` | `1e-3` | Convergence tolerance |
| `--svm_kernel` | `linear` | Kernel: `linear` / `rbf` |
| `--svm_gamma` | `scale` | Kernel coefficient |
| `--svm_calibration` | `none` | Output mode: `none` / `sigmoid` |
| `--svm_calibration_cv_folds` | `3` (fixed) | Stratified cross-validation folds for sigmoid calibration |
| `--svm_convergence_policy` | CLI: `strict`; Web: `bounded_retry` | Non-convergence policy |

With `svm_calibration=none`, the linear kernel uses scikit-learn `LinearSVC` (liblinear, L2, squared-hinge) and the RBF kernel uses `SVC(kernel="rbf", probability=False)` (libsvm). The final score is a `decision_function` margin, not a 0–1 probability.

With `svm_calibration=sigmoid`, PepPlatform uses `CalibratedClassifierCV(method="sigmoid", ensemble=True)` with a fixed, seeded, shuffled 3-fold `StratifiedKFold`. Each fold's base LinearSVC/RBF SVC is fitted only on its training fold, and the output is the calibrated positive-class probability. Both Train classes need at least three samples per output; Validation must contain both classes so the artifact can record per-output and macro Brier score, log loss, and 10-bin ECE. These quality metrics have no dataset-specific performance threshold. Both modes fit the final classification operating point on Validation. New training fails closed on non-finite Train inputs, non-converged base solvers, or invalid probabilities.

New configurations always use `classifier=svm` plus `svm_calibration=none|sigmoid`. Historical `calibrated_svm` is accepted only as an input compatibility alias for `sigmoid`; the Web UI, CLI wizard, and capability API no longer generate it.

Web uses a bounded convergence policy by default: it retries only with `1× / 5× / 25×` the initial `max_iter`, capped at `max(initial, 50,000)`. It never changes the kernel, C, tolerance, scaler, data, or random seed automatically. Independent classifiers in a multi-label task may stop at different budget tiers; the artifact records each output's effective budget and actual iterations. CLI and paper-reproduction runs default to `strict`, which stops on the first non-converged fit. Both policies save only a fully converged final classifier and record every attempt. If only the downstream SVM fails on an `export_embeddings` route, Web retains an integrity-checked upstream representation bundle and can create a lineage-linked child experiment that reruns only the downstream SVM; the failed source record remains immutable.

### Logistic Regression

| Parameter | Default | Description |
| --- | --- | --- |
| `--logreg_c` | `1.0` | Regularization parameter |
| `--logreg_class_weight` | `balanced` | Class weight |
| `--logreg_max_iter` | `2000` | Maximum iterations |

PepPlatform fits one scikit-learn `LogisticRegression` model per output with the liblinear solver, L2 regularization, and the logit link. Every Train output must contain both classes 0 and 1; a constant predictor is never substituted under the Logistic Regression name. The positive-class score is a model probability in `[0, 1]`, but it is not separately calibrated; classification operating points are fitted on Validation only.

CLI and paper-reproduction runs default to `strict` convergence and stop on the first `ConvergenceWarning`. Web defaults to bounded retry, changing only `max_iter` through `1× / 5× / 25×` budgets capped by the automatic ceiling; C, class weights, solver, preprocessing, data, and seed remain fixed. New artifacts record every output's effective budget and iterations in the LogReg contract. Older artifacts without that contract remain `legacy_only` and must be retrained for formal baselines.

### Random Forest (rf)

| Parameter | Default | Description |
| --- | --- | --- |
| `--rf_estimators` | `300` | Number of trees |
| `--rf_max_depth` | `0` | Maximum depth (0 = unlimited) |
| `--rf_min_samples_leaf` | `1` | Minimum samples per leaf |

The platform uses scikit-learn's `RandomForestClassifier`: each tree is built from a bootstrap sample with random feature subsets at each node, and the final score is the mean leaf-class frequency across trees. The score is bounded to 0–1 but is not separately probability-calibrated; the classification threshold is fitted on Validation using the configured threshold objective.

### Extra Trees

| Parameter | Default | Description |
| --- | --- | --- |
| `--et_estimators` | `300` | Number of trees |
| `--et_max_depth` | `0` | Maximum depth (0 = unlimited) |
| `--et_min_samples_leaf` | `1` | Minimum samples per leaf |

PepPlatform uses scikit-learn `ExtraTreesClassifier`. Each tree uses the full training set by default without bootstrapping. At every node, it samples `sqrt(n_features)` candidate features, draws a random threshold for each candidate, and selects the randomly generated split with the largest Gini improvement. The final score is the mean of the trees' leaf class frequencies. It lies in the 0–1 range but is not separately calibrated; the classification operating point is fitted on Validation using the configured threshold objective.

New artifacts store an ExtraTrees contract, including the fitted identity parameters and scikit-learn version. Historical joblib artifacts without this contract are `legacy_only`; a current formal baseline requires retraining.

### HistGB

| Parameter | Default | Description |
| --- | --- | --- |
| `--histgb_max_iter` | `300` | Maximum iterations |
| `--histgb_max_leaf_nodes` | `31` | Maximum leaf nodes |
| `--histgb_lr` | `0.1` | Learning rate |
| `--histgb_l2_regularization` | `0.0` | L2 regularization |

PepPlatform fits one scikit-learn 1.7.2 `HistGradientBoostingClassifier` per output. Each iteration bins continuous features and grows one regression tree from histogram-aggregated gradients and Hessians; binary classification uses `log_loss` with the logistic inverse link. The platform fixes `max_bins=255` and `early_stopping=False`, so `histgb_max_iter` is the actual number of boosting iterations for every output. `histgb_max_leaf_nodes=0` means unlimited leaves; any other value must be at least 2. The learning rate must be positive and L2 regularization must be non-negative.

Every Train output must contain both classes 0 and 1; the platform does not substitute a constant predictor under the HistGB name. The classifier natively accepts NaN missing values but rejects infinities. Scores are positive-class probability estimates from `predict_proba`, without separate calibration; the classification operating point is fitted on Validation using the configured threshold objective.

HistGB's gradient-boosting identity follows Friedman 2001, while scikit-learn documents its histogram implementation as inspired by LightGBM. This implementation does not use or claim LightGBM's GOSS or EFB. New artifacts store a HistGB contract and the exact scikit-learn version. Historical joblib artifacts without that contract are `legacy_only`; a current formal baseline requires retraining.

### XGBoost

| Parameter | Default | Description |
| --- | --- | --- |
| `--xgb_estimators` | `300` | Number of trees |
| `--xgb_max_depth` | `6` | Maximum depth |
| `--xgb_lr` | `0.1` | Learning rate |
| `--xgb_subsample` | `1.0` | Row subsample ratio |
| `--xgb_colsample` | `1.0` | Column subsample ratio |
| `--xgb_reg_alpha` | `0.0` | L1 regularization |
| `--xgb_reg_lambda` | `1.0` | L2 regularization |

PepPlatform fits one `xgboost.XGBClassifier` per output with the `gbtree` booster, histogram tree construction, and the `binary:logistic` objective. `max_depth=0` retains XGBoost's official unlimited-depth meaning. Every Train output must contain both classes 0 and 1; the platform does not substitute a constant predictor under the XGBoost name. Scores are positive-class probabilities in `[0, 1]`, but they are not separately calibrated; classification operating points are fitted on Validation only.

New artifacts store train-fitted scikit-learn preprocessing in `model.joblib` and each fitted booster in XGBoost's native UBJSON model format. A hashed manifest binds output labels, parameters, dependency versions, and model files, and export verifies exact prediction equality after native reload. Artifacts without the XGB contract remain available only as `legacy_only` historical bundles and must be retrained for paper baselines.

### LightGBM

| Parameter | Default | Description |
| --- | --- | --- |
| `--lgb_estimators` | `300` | Number of trees |
| `--lgb_max_depth` | `6` | Maximum depth |
| `--lgb_lr` | `0.1` | Learning rate |
| `--lgb_subsample` | `1.0` | Row subsample ratio |
| `--lgb_colsample` | `1.0` | Column subsample ratio |
| `--lgb_reg_alpha` | `0.0` | L1 regularization |
| `--lgb_reg_lambda` | `0.0` | L2 regularization |

PepPlatform fits one `lightgbm.LGBMClassifier` per output, fixed to the `gbdt` booster, the `binary` objective, and 31 maximum leaves. `lgb_max_depth=0` is passed as LightGBM's official `-1` unlimited-depth value. When `lgb_subsample<1`, the platform sets `subsample_freq=1` so row sampling is actually enabled. This route uses ordinary GBDT bagging and does not claim to enable GOSS; EFB remains at the LightGBM library default.

LightGBM is fixed to 4 CPU threads with `deterministic=true` and `force_row_wise=true`. The experiment seed is also applied to the main random state and the bagging, feature-fraction, and data-sampling child seeds; the model contract and manifest record the effective thread count, determinism, histogram mode, device, seed, and dependency versions. Repeated fits are reproducible with the same data, configuration, and software/compiler environment. Bitwise identity across LightGBM versions, compilers, or operating systems is not promised.

Every Train output must contain both classes 0 and 1; the platform does not substitute a constant predictor under the LightGBM name. Per-output `scale_pos_weight` handles class imbalance. Scores are positive-class probability estimates but are not separately calibrated, and classification operating points are fitted on Validation only.

New artifacts store train-fitted scikit-learn preprocessing in `model.joblib` and each booster as a native LightGBM text model. `lgb_manifest.json` binds output labels, effective parameters, dependency versions, file sizes, and SHA-256 digests. Export must prove exact probability equality after reload through `lightgbm.Booster`. Artifacts without the LGB contract remain available only as `legacy_only` historical bundles and must be retrained for paper baselines.

## Auto-Tuning

Classical classifiers support automatic hyperparameter search:

| Parameter | Default | Description |
| --- | --- | --- |
| `--ml_auto_tune` | `False` | Enable auto-tuning |
| `--ml_tuning_objective` | task-aware | Multi-label function tasks default to `macro_f1` (`f1` is an alias); binary pair tasks default to `auc` |
| `--ml_tuning_mode` | `cv` | Tuning mode: `holdout` / `cv` (cross-validation) |
| `--ml_tuning_max_candidates` | `18` | Maximum candidate configurations |
| `--ml_cv_folds` | `2` | Cross-validation folds |

::: tip
With `--ml_auto_tune`, the platform selects the best observed candidate under the configured budget and tuning objective. `cv` uses training-split folds; `holdout` uses a held-out tuning partition. Neither guarantees improved test performance.

When no objective is specified, auto-tuning follows the same task policy as neural checkpoint selection: Macro F1 for multi-label function prediction and ROC-AUC for binary pair tasks. Explicit configuration always takes precedence.
:::

## Related Pages

- [Sequence Models](./sequence-models) — End-to-end training of MLP with sequence models
- [Training Modes](./training-modes) — Using classical classifiers as downstream predictors after embedding export
- [Feature Transforms](./feature-transforms) — Optional transforms and dimensionality reduction for the global-feature path
