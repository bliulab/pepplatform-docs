# Feature Transforms

Feature transforms operate on the output vectors of **global encoders**, reducing dimensionality or restructuring semantics before feeding them to a [classifier](./classifiers). They apply only to the classic global-feature path.

## Fitted Feature Transforms

Specific global encoders support fitted transforms selected via `--reduction`:

| Encoder | Supported transforms |
| --- | --- |
| `bow` | `none` / `lsa` / `lda` / `plsa` |
| `TF-IDF` | `none` / `lsa` |
| `textrank` | `none` / `lsa` |

### Transform Methods

| Transform | Description |
| --- | --- |
| `none` | No transform; use the raw global vector directly |
| `lsa` | Latent Semantic Analysis: uncentered truncated SVD of a sequence-by-term matrix |
| `lda` | Latent Dirichlet Allocation; a topic model |
| `plsa` | Probabilistic Latent Semantic Analysis; Train-only EM topic probabilities on raw BoW counts |

`labelled_lda` has been removed. Historical bundles using this transform remain inference-compatible only; formal experiments must be retrained with another transform.

PepPlatform LSA uses scikit-learn randomized `TruncatedSVD`, fitted
only on Train without centering. Validation, Test, and Web inference call the
frozen linear transform. BoW and TF-IDF retain the standard document-term LSA
mechanism; TextRank weighting is reported as a PepPlatform weighted-LSA
variant. This is neither LDA nor pLSA, and it does not claim reproduction of a
paper's dataset, preprocessing, hyperparameters, or reported experiment.

New Pair configurations do not support `reduction=lsa`, because vectors after
tower fusion are not proved to remain a document-term matrix. Use
`--ml_reduction tsvd` for generic Pair dimensionality reduction. Historical
Pair LSA bundles retain numerical inference as `legacy_only` artifacts.

With the same input matrix, target rank, random seed, and preprocessing, Pair
`ml_reduction=tsvd` uses the same uncentered randomized `TruncatedSVD` primitive
as LSA. It remains a generic numeric reducer, however: it does not name the
fused vectors as LSA or claim document-term semantics. Pair applies the ML
scaler before this generic reduction by default.

PepPlatform LDA accepts only raw non-negative integer counts from
BoW routes. The single-sequence route uses a sequence-by-term matrix; the
strict Pair route uses a role-aware `peptide | partner` concatenated count
matrix. It uses scikit-learn batch variational Bayes, fits on Train only, and emits normalized document-topic posteriors for
Validation, Test, and Web inference. Topic count is not artificially bounded
by vocabulary width. Invalid inputs, convergence failure, numerical warnings,
and memory-limit violations fail closed. Symmetric document-topic and
topic-word priors are fixed to `1 / lda_topics`.

Pair `reduction=lda` is available only on the strict Two-stream classic-BoW
route with fixed `peptide | partner` role order, `fusion_mode=concat`, vector
interaction, and a classical classifier. It records an independent two-role
BoW joint contract. Other Pair fusion vectors do not preserve a proved
document-term count meaning. Historical Pair LDA bundles display as `LegacyLDA`
and retain warning-emitting `legacy_only` numerical inference.

PepPlatform PLSA uses a paper-derived EM implementation. It accepts
only the single-sequence or strict Pair BoW raw-count routes, estimates `P(z|d)` and
`P(w|z)` by maximum-likelihood EM on Train, and folds held-out sequences into
the frozen topic-word distribution. Outputs are normalized document-topic
probabilities. A fixed-vocabulary term with zero count in the current fitting
split is ignored as split-local OOV during held-out fold-in; a row containing
only such terms follows the uniform zero-document contract. This neither fits
held-out data nor adds smoothing. TF-IDF, TextRank, and non-strict Pair fusion vectors are rejected;
the strict Pair BoW route uses its independent joint contract. Old
`nonnegative_sklearn` KL-NMF bundles are displayed as `LegacyKLNMF`, warn
`legacy_only`, and cannot create a new formal baseline.

### Related Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `--reduction` | `none` | Topic-style transform method |
| `--lsa_dim` | `128` | LSA target dimension |
| `--lsa_dense_memory_limit_gib` | `4.0` | Hard limit for the estimated dense LSA input matrix |
| `--lda_topics` | `50` | Number of LDA topics |
| `--lda_dense_memory_limit_gib` | `4.0` | Hard limit for estimated LDA input and variational state memory |
| `--plsa_topics` | `50` | Number of PLSA topics |
| `--plsa_memory_limit_gib` | `4.0` | PLSA estimated working-set memory limit |

::: tip
Fitted transforms are bound to encoders, Pair interaction routes, and classifiers.
The wizard never exposes LSA for Pair tasks; it exposes LDA/PLSA only for the
strict Pair BoW route.
:::

## ML Feature Scaling

Global features can be scaled before entering a classical classifier, selected via `--ml_scaler`:

| Scaler | Description |
| --- | --- |
| `none` | No scaling |
| `standard` | Standardization (zero mean, unit variance; default) |
| `minmax` | Min-Max scaling to [0, 1] |

## ML Dimensionality Reduction

In addition to the named transforms above, the platform offers general ML dimensionality reduction via `--ml_reduction`:

| Method | Description |
| --- | --- |
| `none` | No reduction |
| `pca` | Principal Component Analysis; linear reduction |
| `kpca` | Kernel PCA; nonlinear kernels produce nonlinear representations |
| `tsvd` | Train-fitted uncentered randomized Truncated SVD for generic numeric features; sparse-compatible |

### Reduction Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `--ml_reduction` | `none` | ML reduction method |
| `--ml_reduction_dim` | `128` | Reduction target dimension |
| `--tsvd_dense_memory_limit_gib` | `4.0` | Hard limit for the estimated dense TSVD input matrix |
| `--pca_dense_memory_limit_gib` | `4.0` | Hard limit for the estimated PCA input and solver working set |
| `--kpca_memory_limit_gib` | `4.0` | Hard limit for the estimated KPCA Gram matrix and solver working set |
| `--kpca_kernel` | `rbf` | KPCA kernel: `rbf` / `linear` / `poly` / `cosine` |
| `--kpca_gamma` | `None` (effective RBF/poly default `0.1`) | Positive kernel coefficient for RBF/poly only |

TSVD fits only on Train, freezes the uncentered randomized
`TruncatedSVD` transform for held-out data and Web inference, and rejects
non-finite matrices, invalid ranks, numerical warnings, width mismatches and
memory-limit violations. It is a generic numeric reducer, not an LSA claim.
Historical TSVD bundles without this contract remain numerical `legacy_only`
inference artifacts and must be retrained for a formal baseline.

PCA applies feature centering learned only from Train. KPCA
uses a Train-only centered kernel matrix and permits `rbf`,
`linear`, `poly`, and `cosine`. Both require the requested dimension to be
strictly below the input width and within the centered sample-rank bound, then
freeze the transform for Validation, Test, and Web inference. Invalid ranks,
non-finite inputs, degenerate spectra, numerical warnings, artifact mismatch,
and memory-limit violations fail closed. Historical contract-free bundles and
historical sigmoid-KPCA bundles retain warning-emitting `legacy_only`
numerical inference only.

## Auto-Tuning

The classical-classifier path supports automatic hyperparameter search; see [Classifiers](./classifiers#auto-tuning):

| Parameter | Default | Description |
| --- | --- | --- |
| `--ml_auto_tune` | `False` | Enable auto-tuning |
| `--ml_tuning_objective` | task-aware | Multi-label function tasks default to `macro_f1` (`f1` is an alias); binary pair tasks default to `auc` |
| `--ml_tuning_mode` | `cv` | Tuning mode: `holdout` / `cv` |
| `--ml_tuning_max_candidates` | `18` | Maximum candidate configurations |
| `--ml_cv_folds` | `2` | Cross-validation folds |

## Position in the Guided Flow

In the global-feature path guided flow, the feature transform is step 4:

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. **`Choose feature transformation`**
5. `Choose classifier`

## Related Pages

- [Encoders](./encoders) — Global vs sequence-preserving encoder categories
- [Classifiers](./classifiers) — Classical classifiers and auto-tuning
- [Feature Routes](./routes) — Global-feature path vs sequence-model path
