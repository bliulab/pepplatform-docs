# train_sequence_pipeline.py Arguments

Single-sequence training script for therapeutic peptide function prediction (`pep_function`) where no interaction partner is modeled. Use `train_pair_pipeline.py` for pair tasks.

Arguments on this page are auto-extracted from source code by `gen_cli_ref.py` to stay in sync.

## Basic Usage

```bash
# Interactive wizard
python scripts/train_sequence_pipeline.py

# Therapeutic peptide function prediction (single-sequence task)
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50

# Show full help
python scripts/train_sequence_pipeline.py --help
```

<!-- BEGIN GENERATED CLI -->

> Total `196` arguments

## Task & Data

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--task_type` | str | `'pep_function'` | `pep_function` | Single-sequence task script; use `train_pair_pipeline.py` for pair tasks |
| `--data_dir` | str | `''` | — | — |

## Tokenizer

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--tokenizer` | str | `'kmer'` | `kmer`, `dr`, `top-n-gram`, `dt`, `bpe`, `wordpiece`, `unigram`, `esm2`, `protbert`, `probert`, `prott5`, `esmc`, `esm3` | — |
| `--k` | int | `2` | — | window length; tokenizer=kmer accepts integers 1-3 |
| `--dr_max_distance` | parse_dr_max_distance | `5` | — | — |
| `--dr_max_raw_length` | parse_dr_max_raw_length | `50000` | — | — |
| `--dr_dense_memory_limit_gib` | parse_dr_dense_memory_limit_gib | `4.0` | — | — |
| `--top_ngram_n` | int | `2` | — | — |
| `--dt_max_distance` | parse_dt_max_distance | `5` | — | — |
| `--dt_dense_memory_limit_gib` | parse_dt_dense_memory_limit_gib | `4.0` | — | — |
| `--bpe_path` | str | `''` | — | — |
| `--bpe_vocab_size` | int | `1000` | — | — |
| `--unigram_path` | str | `''` | — | — |
| `--unigram_vocab_size` | validate_unigram_vocab_size | `1000` | — | — |
| `--unigram_sampling` | flag (argparse.BooleanOptionalAction) | `False` | — | — |
| `--unigram_nbest_size` | int | `64` | — | — |
| `--unigram_alpha` | float | `0.1` | — | — |
| `--unigram_max_raw_length` | validate_unigram_max_raw_length | `50000` | — | — |
| `--wordpiece_path` | str | `''` | — | — |
| `--wordpiece_vocab_size` | validate_wordpiece_vocab_size | `1000` | — | — |
| `--wordpiece_max_raw_length` | validate_wordpiece_max_raw_length | `50000` | — | — |

## Encoder

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--encoder` | str | `None` | `index`, `onehot`, `bow`, `tfidf`, `textrank`, `ac`, `cc`, `acc`, `pdt`, `blosum62`, `pssm`, `pssm_blosum62_hybrid`, `ac_pssm`, `cc_pssm`, `acc_pssm`, `ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, `acc_pssm_blosum62_hybrid`, `psfm`, `psfm_blosum62_hybrid`, `word2vec`, `glove`, `fasttext`, `esm2`, `protbert`, `prott5`, `esmc`, `esm3` | representation encoder; pretrained routes use the same explicit id as --tokenizer |
| `--ac_lag` | int | `10` | — | — |
| `--cc_lag` | int | `10` | — | — |
| `--acc_lag` | int | `10` | — | — |
| `--pdt_lag` | parse_pdt_lag | `8` | — | — |
| `--pdt_max_raw_length` | parse_pdt_max_raw_length | `100000` | — | maximum complete raw sequence length for PDT (hard max 100000) |
| `--ac_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--cc_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--acc_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--ac_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--cc_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--acc_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |

## Model & Training Mode

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--model` | str | `'cnn'` | `cnn`, `rnn`, `gru`, `lstm`, `transformer`, `gcn`, `gat`, `mlp`, `svm`, `calibrated_svm`, `rf`, `extratrees`, `histgb`, `xgb`, `lgb`, `logreg` | — |
| `--sequence_model` | str | `''` | `cnn`, `rnn`, `gru`, `lstm`, `transformer`, `gcn`, `gat` | — |
| `--training_mode` | str | `''` | `end_to_end`, `export_embeddings` | — |
| `--classifier` | str | `''` | `mlp`, `svm`, `calibrated_svm`, `rf`, `extratrees`, `histgb`, `xgb`, `lgb`, `logreg` | — |

## Training Hyperparameters

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--max_length` | int | `60` | — | maximum encoded positions; for tokenizer=kmer this is the K-mer token count |
| `--batch_size` | int | `32` | — | — |
| `--lr` | float | `0.001` | — | — |
| `--epochs` | int | `30` | — | — |
| `--dropout` | float | `0.0` | — | — |
| `--weight_decay` | float | `0.01` | — | — |
| `--grad_clip_norm` | float | `0.0` | — | — |
| `--early_stop_patience` | int | `0` | — | — |
| `--early_stop_min_delta` | float | `0.0` | — | — |
| `--dl_scaler` | str | `'none'` | `none`, `standard` | — |

## Pretrained Models

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--esm_feature_dir` | str | `''` | — | — |
| `--esm2_model` | str | `'facebook/esm2_t30_150M_UR50D'` | — | — |
| `--protbert_feature_dir` | str | `''` | — | — |
| `--protbert_model` | str | `'Rostlab/prot_bert'` | — | — |
| `--prott5_feature_dir` | str | `''` | — | — |
| `--prott5_model` | str | `'Rostlab/prot_t5_xl_uniref50'` | — | — |
| `--esmc_feature_dir` | str | `''` | — | — |
| `--esmc_model` | str | `'EvolutionaryScale/esmc-600m-2024-12'` | — | — |
| `--esm3_feature_dir` | str | `''` | — | — |
| `--esm3_model` | str | `'EvolutionaryScale/esm3-sm-open-v1'` | — | — |

## Static Embeddings

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--embedding_vector_size` | int | `128` | — | — |
| `--embedding_window` | int | `5` | — | — |
| `--embedding_min_count` | int | `1` | — | — |
| `--embedding_epochs` | int | `20` | — | — |
| `--embedding_workers` | int | `1` | — | — |
| `--glove_x_max` | float | `100.0` | — | — |
| `--glove_alpha` | float | `0.75` | — | — |
| `--glove_learning_rate` | float | `0.05` | — | — |
| `--glove_batch_size` | int | `4096` | — | — |
| `--word2vec_path` | str | `''` | — | — |
| `--glove_path` | str | `''` | — | — |
| `--fasttext_path` | str | `''` | — | — |

## Profile / PSSM / PSFM

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--profile_cache_dir` | str | `''` | — | — |
| `--pssm_index_path` | str | `''` | — | — |
| `--ac_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--cc_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--acc_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--psfm_index_path` | str | `''` | — | — |
| `--frequency_profile_index_path` | str | `''` | — | — |
| `--profile_iterations` | int | `3` | — | — |
| `--profile_evalue` | float | `0.001` | — | — |
| `--profile_inclusion_evalue` | float | `0.001` | — | — |
| `--profile_threads` | int | `1` | — | — |
| `--profile_on_missing` | str | `None` | `error`, `blosum62_hybrid`, `blosum62_target_frequency` | — |

## Feature Transformation

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--reduction` | str | `'none'` | `none`, `lsa`, `lda`, `plsa` | — |
| `--lsa_dim` | int | `128` | — | — |
| `--lsa_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--lda_topics` | int | `50` | — | — |
| `--lda_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--plsa_topics` | int | `50` | — | — |
| `--plsa_memory_limit_gib` | float | `4.0` | — | — |
| `--ml_scaler` | str | `'standard'` | `none`, `standard`, `minmax` | — |
| `--tsvd_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--pca_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--kpca_memory_limit_gib` | float | `4.0` | — | — |

## ML Reduction & Tuning

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--ml_reduction` | str | `'none'` | `none`, `pca`, `kpca`, `tsvd` | — |
| `--ml_reduction_dim` | int | `128` | — | — |
| `--ml_auto_tune` | flag (argparse.BooleanOptionalAction) | `False` | — | — |
| `--ml_tuning_budget` | str | `''` | `quick`, `standard`, `thorough` | — |
| `--ml_tuning_mode` | str | `'cv'` | `holdout`, `cv` | — |
| `--ml_tuning_max_candidates` | int | `18` | — | — |
| `--ml_cv_folds` | int | `2` | — | — |

## SVM Classifier

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--svm_c` | float | `1.0` | — | — |
| `--svm_class_weight` | str | `'balanced'` | `balanced`, `none` | — |
| `--svm_max_iter` | int | `2000` | — | — |
| `--svm_tol` | float | `0.001` | — | — |
| `--svm_kernel` | str | `'linear'` | `linear`, `rbf` | — |
| `--svm_gamma` | str | `'scale'` | — | — |
| `--svm_calibration` | str | `''` | `none`, `sigmoid` | — |
| `--svm_calibration_cv_folds` | int | `3` | — | — |
| `--svm_convergence_policy` | str | `'strict'` | `strict`, `bounded_retry` | — |

## Logistic Regression

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--logreg_c` | float | `1.0` | — | — |
| `--logreg_class_weight` | str | `'balanced'` | `balanced`, `none` | — |
| `--logreg_max_iter` | int | `2000` | — | — |
| `--logreg_convergence_policy` | str | `'strict'` | `strict`, `bounded_retry` | — |

## Random Forest

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--rf_estimators` | int | `300` | — | — |
| `--rf_max_depth` | int | `0` | — | — |
| `--rf_min_samples_leaf` | int | `1` | — | — |

## Extra Trees

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--et_estimators` | int | `300` | — | — |
| `--et_max_depth` | int | `0` | — | — |
| `--et_min_samples_leaf` | int | `1` | — | — |

## HistGB

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--histgb_max_iter` | int | `300` | — | — |
| `--histgb_max_leaf_nodes` | int | `31` | — | — |
| `--histgb_lr` | float | `0.1` | — | — |
| `--histgb_l2_regularization` | float | `0.0` | — | — |

## XGBoost

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--xgb_estimators` | int | `300` | — | — |
| `--xgb_max_depth` | int | `6` | — | — |
| `--xgb_lr` | float | `0.1` | — | — |
| `--xgb_subsample` | float | `1.0` | — | — |
| `--xgb_colsample` | float | `1.0` | — | — |
| `--xgb_reg_alpha` | float | `0.0` | — | — |
| `--xgb_reg_lambda` | float | `1.0` | — | — |

## LightGBM

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--lgb_estimators` | int | `300` | — | — |
| `--lgb_max_depth` | int | `6` | — | — |
| `--lgb_lr` | float | `0.1` | — | — |
| `--lgb_subsample` | float | `1.0` | — | — |
| `--lgb_colsample` | float | `1.0` | — | — |
| `--lgb_reg_alpha` | float | `0.0` | — | — |
| `--lgb_reg_lambda` | float | `0.0` | — | — |

## Semantic Auxiliary Loss

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--enable_semantic_similarity` | flag (argparse.BooleanOptionalAction) | `False` | — | — |
| `--semantic_similarity_weight` | float | `0.1` | — | — |
| `--semantic_zero_weight` | float | `0.25` | — | — |
| `--semantic_loss_type` | str | Unset (attribute omitted) | `legacy`, `jaccard_supcon` | Semantic auxiliary objective (default: legacy); contrastive pretraining loss is unchanged |
| `--semantic_projection_dim` | int | `64` | — | — |
| `--semantic_contrastive_temperature` | float | `0.1` | — | — |
| `--semantic_positive_partners` | int | `1` | — | — |
| `--semantic_zero_partners` | int | `8` | — | — |
| `--semantic_loss_space` | str | `'projection'` | `projection`, `shared` | — |
| `--semantic_residual_weight` | float | `0.0` | — | — |
| `--semantic_partner_scheme` | str | `'fixed'` | `fixed`, `fixed_placebo`, `dense_hard`, `placebo` | — |
| `--semantic_positive_cap` | int | `16` | — | — |
| `--semantic_negative_cap` | int | `8` | — | — |
| `--semantic_hard_negative_source` | str | `'input_embedding'` | `input_embedding` | — |
| `--semantic_jaccard_theta` | float | `0.1` | — | — |
| `--semantic_contrastive_mode` | str | `'multilabel'` | `multilabel`, `simclr` | — |
| `--semantic_augmented_views_dir` | str | `''` | — | — |

## I/O & Control

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--interactive` | flag (store_true) | `False` | — | — |
| `--advanced_wizard` | flag (store_true) | `False` | — | — |
| `--report_aupr` | flag (argparse.BooleanOptionalAction) | `True` | — | — |
| `--artifact_dir` | str | `''` | — | — |

## Other

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--head_hidden_dims` | parse_prediction_head_hidden_dims | `None` | — | — |
| `--head_activation` | str | `None` | `relu`, `gelu`, `silu` | — |
| `--head_dropout` | float | `None` | — | — |
| `--residue_adapter_dim` | int | `128` | — | — |
| `--frequency_max_raw_length` | parse_frequency_max_raw_length | `50000` | — | maximum raw sequence length for BoW/TF-IDF (hard max 100000) |
| `--topngram_dense_memory_limit_gib` | parse_top_ngram_dense_memory_limit_gib | `4.0` | — | — |
| `--covariance_max_raw_length` | parse_covariance_max_raw_length | `100000` | — | maximum complete raw sequence length for AC/CC/ACC (hard max 100000) |
| `--multilabel_loss` | str | `'auto'` | `auto`, `bce`, `balanced_bce`, `asymmetric_focal` | — |
| `--multilabel_pos_weight_cap` | float | `20.0` | — | — |
| `--asl_gamma_pos` | float | `1.0` | — | — |
| `--asl_gamma_neg` | float | `4.0` | — | — |
| `--asl_clip` | float | `0.05` | — | — |
| `--tppredsc_stage1_epochs` | int | `0` | — | Contrastive pretraining epochs (0 disables the two-stage mode) |
| `--tppredsc_stage1_lr` | float | `0.01` | — | — |
| `--tppredsc_stage1_momentum` | float | `0.9` | — | — |
| `--tppredsc_stage2_epochs` | int | `10` | — | — |
| `--tppredsc_stage2_lr` | float | `0.0001` | — | — |
| `--fasttext_bucket` | int | `2000000` | — | — |
| `--static_embedding_memory_limit_gib` | float | `4.0` | — | — |
| `--probert_feature_dir` | str | `''` | — | — |
| `--probert_model` | str | `''` | — | — |
| `--kpca_kernel` | str | `'rbf'` | `rbf`, `linear`, `poly`, `cosine` | — |
| `--kpca_gamma` | float | `None` | — | — |
| `--seed` | int | `42` | — | — |
| `--evaluate_test` | flag (argparse.BooleanOptionalAction) | `True` | — | allow loading and evaluating the optional test split |
| `--deterministic` | flag (argparse.BooleanOptionalAction) | `False` | — | enable deterministic PyTorch algorithms in addition to seeded RNGs |
| `--resume_embedding_bundle` | str | `''` | — | — |

## Model Selection Objectives

| Argument | Type | Default | Choices | Description |
| --- | --- | --- | --- | --- |
| `--checkpoint_objective_params` | str | `None` | — | — |
| `--threshold_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--threshold_objective_params` | str | `None` | — | — |
| `--tuning_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--tuning_objective_params` | str | `None` | — | — |
| `--threshold_search_profile` | str | `None` | `coordinate_all_v1`, `coordinate_quantile32_v1`, `f1_exact_v1` | — |
| `--checkpoint_threshold_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--checkpoint_threshold_objective_params` | str | `None` | — | — |
| `--checkpoint_threshold_search_profile` | str | `None` | `coordinate_all_v1`, `coordinate_quantile32_v1`, `f1_exact_v1` | — |
| `--list_objectives` | flag (store_true) | `False` | — | — |
| `--checkpoint_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
| `--ml_tuning_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |

<!-- END GENERATED CLI -->
## Reading the Parameter Tables

Defaults below are parser defaults. `None` and empty values may be resolved by task or route; they do not mean that every listed combination is supported. BooleanOptionalAction also accepts the matching `--no-...` form. Prepare the example datasets first; see [Recipes](./recipes). For KPCA, omitted `kpca_gamma` resolves to `0.1` for RBF/poly; other kernels do not consume it. [Selection Objectives](../concepts/selection-objectives) explains the task-dependent defaults added by the shared parser helper.
