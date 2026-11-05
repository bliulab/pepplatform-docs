# train_pair_pipeline.py 参数参考

Pair 任务专用训练脚本，用于肽–蛋白相互作用预测（`pep_protein_interaction`）、肽–HLA-I 配体呈递预测（`pep_hlai`）、肽–HLA-II 配体呈递预测（`pep_hlaii`）。单序列 `pep_function` 请使用 `train_sequence_pipeline.py`；`train_pipeline.py` 只是兼容调度入口。

本页参数由 `gen_cli_ref.py` 从源码自动提取。

## 基本用法

```bash
# 交互式向导
python scripts/train_pair_pipeline.py

# 肽–蛋白相互作用预测：ESM2 预训练 + two_stream
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp

# 肽–HLA-I 配体呈递预测：ESM2 + two_stream + bi_cross_attn
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlai --tokenizer esm2 --pair_strategy two_stream --interaction_level token --interaction_model bi_cross_attn --training_mode end_to_end --epochs 20

# 肽–HLA-II 配体呈递预测：kmer + PSSM + two_stream + cross_attn
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlaii --tokenizer kmer --encoder pssm --pair_strategy two_stream --interaction_level token --interaction_model cross_attn --training_mode end_to_end --epochs 10

# 查看完整帮助
python scripts/train_pair_pipeline.py --help
```

<!-- BEGIN GENERATED CLI -->

> 共 `304` 个参数

## 任务与数据

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--task_type` | str | `'pep_protein_interaction'` | `pep_protein_interaction`, `pep_hlaii`, `pep_hlai` | Pair 专用脚本。选 `pep_function` 时向导会提示改用 `train_sequence_pipeline.py` |
| `--task_root` | str | `''` | — | 默认值随 `task_type` 动态变化：`pep_hlai` → `datasets/task_peptide_HLAI_interaction`，`pep_hlaii` → `datasets/task_peptide_HLAII_interaction`，其他 → `datasets/task_peptide_protein_interaction` |
| `--data_dir` | str | `''` | — | Compatibility split root containing train/val/test pairs.csv files |
| `--train_csv` | str | `''` | — | — |
| `--val_csv` | str | `''` | — | — |
| `--test_csv` | str | `''` | — | — |
| `--val_ratio` | float | `0.1` | — | — |
| `--split_seed` | int | `42` | — | — |

## 分词器

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--tokenizer` | str | `'esm2'` | `esm2`, `protbert`, `probert`, `prott5`, `esmc`, `esm3`, `kmer`, `dr`, `bpe`, `wordpiece`, `unigram`, `top-n-gram`, `dt` | — |
| `--k` | int | `2` | — | window length; tokenizer=kmer accepts integers 1-3 |
| `--dr_max_distance` | parse_dr_max_distance | `5` | — | — |
| `--dr_max_raw_length` | parse_dr_max_raw_length | `50000` | — | — |
| `--dr_dense_memory_limit_gib` | parse_dr_dense_memory_limit_gib | `4.0` | — | — |
| `--top_ngram_n` | int | `2` | — | — |
| `--dt_max_distance` | parse_dt_max_distance | `5` | — | — |
| `--dt_dense_memory_limit_gib` | parse_dt_dense_memory_limit_gib | `4.0` | — | — |
| `--unigram_path` | str | `''` | — | — |
| `--unigram_vocab_size` | validate_unigram_vocab_size | `1000` | — | — |
| `--unigram_sampling` | flag (argparse.BooleanOptionalAction) | `False` | — | — |
| `--unigram_nbest_size` | int | `64` | — | — |
| `--unigram_alpha` | float | `0.1` | — | — |
| `--unigram_max_raw_length` | validate_unigram_max_raw_length | `50000` | — | — |
| `--wordpiece_path` | str | `''` | — | — |
| `--wordpiece_vocab_size` | validate_wordpiece_vocab_size | `1000` | — | — |
| `--wordpiece_max_raw_length` | validate_wordpiece_max_raw_length | `50000` | — | — |

## 编码器

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--feature_mode` | str | `'single'` | `single`, `multimodal` | — |
| `--primary_feature_mode` | str | `'pretrained'` | `pretrained`, `classic` | — |
| `--aux_feature_mode` | str | `'classic'` | `pretrained`, `classic` | — |
| `--aux_tokenizer` | str | `'kmer'` | `esm2`, `protbert`, `probert`, `prott5`, `esmc`, `esm3`, `kmer`, `dr`, `bpe`, `wordpiece`, `unigram`, `top-n-gram`, `dt` | — |
| `--aux_encoder` | str | `'index'` | `ppi_fusion`, `index`, `onehot`, `bow`, `tfidf`, `textrank`, `ac`, `cc`, `acc`, `pdt`, `blosum62`, `pssm`, `pssm_blosum62_hybrid`, `ac_pssm`, `cc_pssm`, `acc_pssm`, `ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, `acc_pssm_blosum62_hybrid`, `psfm`, `psfm_blosum62_hybrid`, `word2vec`, `glove`, `fasttext`, `esm2`, `protbert`, `prott5`, `esmc`, `esm3` | — |
| `--mm_align_dim` | int | `256` | — | — |
| `--encoder` | str | `None` | `ppi_fusion`, `index`, `onehot`, `bow`, `tfidf`, `textrank`, `ac`, `cc`, `acc`, `pdt`, `blosum62`, `pssm`, `pssm_blosum62_hybrid`, `ac_pssm`, `cc_pssm`, `acc_pssm`, `ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, `acc_pssm_blosum62_hybrid`, `psfm`, `psfm_blosum62_hybrid`, `word2vec`, `glove`, `fasttext`, `esm2`, `protbert`, `prott5`, `esmc`, `esm3` | representation encoder; pretrained routes use the same explicit id as --tokenizer |
| `--ac_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--cc_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--acc_pssm_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--ac_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--cc_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--acc_pssm_blosum62_hybrid_lag` | parse_pssm_covariance_lag | `10` | — | — |
| `--ac_lag` | int | `10` | — | — |
| `--cc_lag` | int | `10` | — | — |
| `--acc_lag` | int | `10` | — | — |
| `--pdt_lag` | parse_pdt_lag | `8` | — | — |
| `--pdt_max_raw_length` | parse_pdt_max_raw_length | `100000` | — | maximum complete raw sequence length for PDT (hard max 100000) |

## 模型与训练模式

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--model` | str | `'mlp'` | `cnn`, `rnn`, `gru`, `lstm`, `transformer`, `cross_attn`, `cross_attn+mlp`, `bi_cross_attn`, `bi_cross_attn+mlp`, `mlp`, `svm`, `calibrated_svm`, `rf`, `extratrees`, `histgb`, `xgb`, `lgb`, `logreg`, `gcn`, `gat`, `hgt`, `sage`, `graph_transformer` | — |
| `--sequence_model` | str | `''` | `cnn`, `rnn`, `gru`, `lstm`, `transformer`, `gcn`, `gat` | — |
| `--training_mode` | str | `''` | `end_to_end`, `export_embeddings` | — |
| `--classifier` | str | `''` | `mlp`, `svm`, `calibrated_svm`, `rf`, `extratrees`, `histgb`, `xgb`, `lgb`, `logreg` | — |

## 训练超参数

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--max_length` | int | `512` | — | maximum encoded positions; for tokenizer=kmer this is the K-mer token count |
| `--batch_size` | int | `16` | — | — |
| `--lr` | float | `0.001` | — | — |
| `--epochs` | int | `20` | — | — |
| `--dropout` | float | `0.2` | — | — |
| `--weight_decay` | float | `0.01` | — | — |
| `--grad_clip_norm` | float | `0.0` | — | — |
| `--early_stop_patience` | int | `5` | — | — |
| `--early_stop_min_delta` | float | `0.0` | — | — |
| `--dl_scaler` | str | `'standard'` | `none`, `standard`, `minmax` | — |

## 预训练模型

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--esm2_model` | str | `'facebook/esm2_t30_150M_UR50D'` | — | — |
| `--protbert_model` | str | `'Rostlab/prot_bert'` | — | — |
| `--prott5_model` | str | `'Rostlab/prot_t5_xl_uniref50'` | — | — |
| `--esmc_model` | str | `'EvolutionaryScale/esmc-600m-2024-12'` | — | — |
| `--esm3_model` | str | `'EvolutionaryScale/esm3-sm-open-v1'` | — | — |
| `--esm3_sdpa_backend` | str | `'auto'` | `auto`, `math` | — |

## 静态嵌入

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
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
| `--feature_dir` | str | `''` | — | — |
| `--word2vec_path` | str | `''` | — | — |
| `--glove_path` | str | `''` | — | — |
| `--fasttext_path` | str | `''` | — | — |

## Profile / PSSM / PSFM

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--pssm_index_path` | str | `''` | — | — |
| `--ac_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--cc_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--acc_pssm_blosum62_hybrid_index_path` | str | `''` | — | — |
| `--psfm_index_path` | str | `''` | — | — |
| `--frequency_profile_index_path` | str | `''` | — | — |
| `--profile_iterations` | int | `3` | — | — |
| `--profile_evalue` | float | `0.001` | — | — |
| `--profile_inclusion_evalue` | float | `0.001` | — | — |
| `--profile_threads` | int | `4` | — | — |
| `--profile_on_missing` | str | `None` | `error`, `blosum62_hybrid`, `blosum62_target_frequency` | — |

## 特征变换

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--ml_scaler` | str | `'standard'` | `none`, `standard`, `minmax` | — |
| `--tsvd_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--pca_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--kpca_memory_limit_gib` | float | `4.0` | — | — |
| `--reduction` | str | `'none'` | `none`, `lda`, `plsa` | Strict Pair topic reduction; requires classic BoW streams, fusion_mode=concat, and a classical classifier. |
| `--lda_topics` | int | `50` | — | — |
| `--lda_dense_memory_limit_gib` | float | `4.0` | — | — |
| `--plsa_topics` | int | `50` | — | — |
| `--plsa_memory_limit_gib` | float | `4.0` | — | — |

## ML 降维与调优

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--ml_reduction` | str | `'none'` | `none`, `pca`, `kpca`, `tsvd` | Generic numeric reduction for fused Pair features; tsvd uses uncentered TruncatedSVD. |
| `--ml_reduction_dim` | int | `256` | — | — |
| `--ml_auto_tune` | flag (argparse.BooleanOptionalAction) | `False` | — | — |
| `--ml_tuning_budget` | str | `''` | `quick`, `standard`, `thorough` | — |
| `--ml_tuning_mode` | str | `'cv'` | `holdout`, `cv` | — |
| `--ml_tuning_max_candidates` | int | `18` | — | — |
| `--ml_cv_folds` | int | `2` | — | — |

## SVM 分类器

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--svm_c` | float | `1.0` | — | — |
| `--svm_class_weight` | str | `'balanced'` | `balanced`, `none` | — |
| `--svm_max_iter` | int | `3000` | — | — |
| `--svm_tol` | float | `0.001` | — | — |
| `--svm_kernel` | str | `'linear'` | `linear`, `rbf` | — |
| `--svm_gamma` | str | `'scale'` | — | — |
| `--svm_calibration` | str | `''` | `none`, `sigmoid` | — |
| `--svm_calibration_cv_folds` | int | `3` | — | — |
| `--svm_convergence_policy` | str | `'strict'` | `strict`, `bounded_retry` | — |

## 逻辑回归

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--logreg_c` | float | `1.0` | — | — |
| `--logreg_class_weight` | str | `'balanced'` | `balanced`, `none` | — |
| `--logreg_max_iter` | int | `2000` | — | — |
| `--logreg_convergence_policy` | str | `'strict'` | `strict`, `bounded_retry` | — |

## 随机森林

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--rf_estimators` | int | `300` | — | — |
| `--rf_max_depth` | int | `0` | — | — |
| `--rf_min_samples_leaf` | int | `1` | — | — |

## Extra Trees

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--et_estimators` | int | `300` | — | — |
| `--et_max_depth` | int | `0` | — | — |
| `--et_min_samples_leaf` | int | `1` | — | — |

## HistGB

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--histgb_max_iter` | int | `300` | — | — |
| `--histgb_max_leaf_nodes` | int | `31` | — | — |
| `--histgb_lr` | float | `0.1` | — | — |
| `--histgb_l2_regularization` | float | `0.0` | — | — |

## XGBoost

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--xgb_estimators` | int | `300` | — | — |
| `--xgb_max_depth` | int | `6` | — | — |
| `--xgb_lr` | float | `0.1` | — | — |
| `--xgb_subsample` | float | `1.0` | — | — |
| `--xgb_colsample` | float | `1.0` | — | — |
| `--xgb_reg_alpha` | float | `0.0` | — | — |
| `--xgb_reg_lambda` | float | `1.0` | — | — |

## LightGBM

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--lgb_estimators` | int | `300` | — | — |
| `--lgb_max_depth` | int | `6` | — | — |
| `--lgb_lr` | float | `0.1` | — | — |
| `--lgb_subsample` | float | `1.0` | — | — |
| `--lgb_colsample` | float | `1.0` | — | — |
| `--lgb_reg_alpha` | float | `0.0` | — | — |
| `--lgb_reg_lambda` | float | `0.0` | — | — |

## Pair 互作

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--pair_strategy` | normalize_pair_strategy | `None` | `single_stream`, `two_stream` | Downstream pair input organization: single_stream (role-boundary join) or two_stream (separate roles until fusion/interaction). Historical strategy names remain accepted by compatibility adapters. |
| `--interaction_level` | str | `None` | `vector`, `token` | — |
| `--interaction_model` | str | `None` | `cross_attn`, `bi_cross_attn` | — |
| `--predictor_type` | str | `None` | `classifier`, `sample_graph` | — |
| `--graph_predictor` | str | `None` | `gcn`, `gat`, `hgt`, `sage`, `graph_transformer` | — |
| `--ppi_interaction_mode` | str | `None` | `single`, `dual` | — |
| `--hlaii_interaction_mode` | str | `None` | `concat`, `contact` | — |
| `--fusion_mode` | str | `None` | — | Two-stream vector fusion (effective default: concat_all). HGT uses typed role projection and ignores only legacy concat/concat_all markers. |
| `--gnn_k` | int | `8` | — | — |
| `--gnn_hidden_dim` | int | `256` | — | — |

## 语义辅助损失

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--enable_semantic_similarity` | flag (argparse.BooleanOptionalAction) | `None` | — | — |
| `--semantic_similarity_weight` | float | `None` | — | — |
| `--semantic_zero_weight` | float | `0.25` | — | — |
| `--semantic_pair_mode` | str | `'role_fused'` | `fused`, `role`, `role_fused` | — |
| `--semantic_loss_type` | str | 未设置（不创建属性） | `legacy`, `jaccard_supcon` | Semantic auxiliary objective (default: legacy); contrastive pretraining loss is unchanged |
| `--semantic_projection_dim` | int | `64` | — | — |
| `--semantic_contrastive_temperature` | float | `0.1` | — | — |
| `--semantic_positive_partners` | int | `1` | — | — |
| `--semantic_zero_partners` | int | `8` | — | — |
| `--semantic_loss_space` | str | `'projection'` | `projection`, `shared` | — |
| `--semantic_residual_weight` | float | `0.0` | — | — |
| `--semantic_learned_gate` | flag (argparse.BooleanOptionalAction) | `False` | — | use a trainable gate (init 0) for the pair semantic residual |
| `--semantic_partner_scheme` | str | `'fixed'` | `fixed`, `fixed_placebo`, `dense_hard`, `placebo` | — |
| `--semantic_positive_cap` | int | `16` | — | — |
| `--semantic_negative_cap` | int | `8` | — | — |
| `--semantic_hard_negative_source` | str | `'input_embedding'` | `input_embedding` | — |

## 输入输出与控制

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--report_aupr` | flag (argparse.BooleanOptionalAction) | `True` | — | — |
| `--cache_features` | flag (argparse.BooleanOptionalAction) | `True` | — | — |
| `--interactive` | flag (store_true) | `False` | — | — |
| `--advanced_wizard` | flag (store_true) | `False` | — | — |
| `--artifact_dir` | str | `''` | — | — |

## 其他

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--evaluate_test` | flag (argparse.BooleanOptionalAction) | `True` | — | evaluate the supplied test split during training; leave disabled for final independent-test evaluation |
| `--seed` | int | `42` | — | — |
| `--deterministic` | flag (argparse.BooleanOptionalAction) | `True` | — | — |
| `--head_hidden_dims` | parse_prediction_head_hidden_dims | `None` | — | — |
| `--head_activation` | str | `None` | `relu`, `gelu`, `silu` | — |
| `--head_dropout` | float | `None` | — | — |
| `--stream_alignment_dim` | parse_stream_alignment_dim | `256` | — | — |
| `--interaction_hidden_dim` | int | `128` | — | — |
| `--interaction_heads` | int | `4` | — | — |
| `--gnn_exact_knn_max_nodes` | int | `25000` | — | — |
| `--gnn_rp_projections` | int | `6` | — | — |
| `--gnn_rp_window` | int | `0` | — | — |
| `--gnn_edge_chunk_size` | int | `100000` | — | — |
| `--residue_adapter_dim` | int | `128` | — | width of the audited LayerNorm+Linear adapter for pretrained residue routes |
| `--peptide_feature_extraction_batch_size` | _parse_feature_extraction_batch_size | `None` | — | training/validation peptide residue extraction batch; defaults to batch_size |
| `--partner_feature_extraction_batch_size` | _parse_feature_extraction_batch_size | `None` | — | training/validation partner residue extraction batch; defaults to batch_size |
| `--loss_type` | str | `'wbce'` | `bce`, `wbce` | Pair neural classification loss; wbce preserves the historical default. |
| `--pos_weight_max` | _parse_pair_pos_weight_max | `50.0` | — | Upper clamp for WBCE positive-class weighting (must be finite and &gt;= 1). |
| `--fasttext_bucket` | int | `2000000` | — | — |
| `--static_embedding_memory_limit_gib` | float | `4.0` | — | — |
| `--probert_model` | str | `''` | — | — |
| `--kpca_kernel` | str | `'rbf'` | `rbf`, `linear`, `poly`, `cosine` | — |
| `--kpca_gamma` | float | `None` | — | — |
| `--dr_unknown_residue_policy` | str | `'error'` | `error`, `zero` | — |
| `--frequency_max_raw_length` | parse_frequency_max_raw_length | `50000` | — | maximum raw sequence length for BoW/TF-IDF (hard max 100000) |
| `--topngram_dense_memory_limit_gib` | parse_top_ngram_dense_memory_limit_gib | `4.0` | — | — |
| `--covariance_max_raw_length` | parse_covariance_max_raw_length | `100000` | — | maximum complete raw sequence length for AC/CC/ACC (hard max 100000) |
| `--compact_residue_cache` | flag (argparse.BooleanOptionalAction) | `False` | — | deduplicate and store actual-length pretrained residue states before Pair joining |
| `--resume_embedding_bundle` | str | `''` | — | — |

## Pair 两侧独立配置

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--peptide_feature_route` | str | `''` | `classic`, `pretrained` | — |
| `--peptide_tokenizer` | str | `''` | — | — |
| `--peptide_encoder` | str | `''` | — | — |
| `--peptide_stream_model` | str | `''` | — | — |
| `--peptide_model_source` | str | `''` | — | — |
| `--peptide_max_length` | int | `0` | — | — |
| `--peptide_k` | int | `None` | — | — |
| `--peptide_dr_max_distance` | int | `None` | — | — |
| `--peptide_dr_max_raw_length` | int | `None` | — | — |
| `--peptide_dr_unknown_residue_policy` | str | `None` | — | — |
| `--peptide_esm3_sdpa_backend` | str | `None` | — | — |
| `--peptide_frequency_max_raw_length` | int | `None` | — | — |
| `--peptide_top_ngram_n` | int | `None` | — | — |
| `--peptide_topngram_dense_memory_limit_gib` | float | `None` | — | — |
| `--peptide_dt_max_distance` | int | `None` | — | — |
| `--peptide_dt_dense_memory_limit_gib` | float | `None` | — | — |
| `--peptide_bpe_path` | str | `None` | — | — |
| `--peptide_unigram_path` | str | `None` | — | — |
| `--peptide_unigram_vocab_size` | int | `None` | — | — |
| `--peptide_unigram_max_raw_length` | int | `None` | — | — |
| `--peptide_wordpiece_path` | str | `None` | — | — |
| `--peptide_wordpiece_vocab_size` | int | `None` | — | — |
| `--peptide_wordpiece_max_raw_length` | int | `None` | — | — |
| `--peptide_word2vec_path` | str | `None` | — | — |
| `--peptide_glove_path` | str | `None` | — | — |
| `--peptide_fasttext_path` | str | `None` | — | — |
| `--peptide_pssm_index_path` | str | `None` | — | — |
| `--peptide_ac_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--peptide_cc_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--peptide_acc_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--peptide_psfm_index_path` | str | `None` | — | — |
| `--peptide_frequency_profile_index_path` | str | `None` | — | — |
| `--peptide_profile_inclusion_evalue` | float | `None` | — | — |
| `--peptide_ac_lag` | int | `None` | — | — |
| `--peptide_cc_lag` | int | `None` | — | — |
| `--peptide_acc_lag` | int | `None` | — | — |
| `--peptide_pdt_lag` | int | `None` | — | — |
| `--peptide_pdt_max_raw_length` | int | `None` | — | — |
| `--peptide_covariance_max_raw_length` | int | `None` | — | — |
| `--peptide_ac_pssm_lag` | int | `None` | — | — |
| `--peptide_cc_pssm_lag` | int | `None` | — | — |
| `--peptide_acc_pssm_lag` | int | `None` | — | — |
| `--peptide_ac_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--peptide_cc_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--peptide_acc_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--peptide_param` | flag (append) | `[]` | — | — |
| `--partner_feature_route`, `--protein_feature_route` | str | `''` | `classic`, `pretrained` | — |
| `--partner_tokenizer`, `--protein_tokenizer` | str | `''` | — | — |
| `--partner_encoder`, `--protein_encoder` | str | `''` | — | — |
| `--partner_stream_model`, `--protein_stream_model` | str | `''` | — | — |
| `--partner_model_source`, `--protein_model_source` | str | `''` | — | — |
| `--partner_max_length`, `--protein_max_length` | int | `0` | — | — |
| `--partner_k`, `--protein_k` | int | `None` | — | — |
| `--partner_dr_max_distance`, `--protein_dr_max_distance` | int | `None` | — | — |
| `--partner_dr_max_raw_length`, `--protein_dr_max_raw_length` | int | `None` | — | — |
| `--partner_dr_unknown_residue_policy`, `--protein_dr_unknown_residue_policy` | str | `None` | — | — |
| `--partner_esm3_sdpa_backend`, `--protein_esm3_sdpa_backend` | str | `None` | — | — |
| `--partner_frequency_max_raw_length`, `--protein_frequency_max_raw_length` | int | `None` | — | — |
| `--partner_top_ngram_n`, `--protein_top_ngram_n` | int | `None` | — | — |
| `--partner_topngram_dense_memory_limit_gib`, `--protein_topngram_dense_memory_limit_gib` | float | `None` | — | — |
| `--partner_dt_max_distance`, `--protein_dt_max_distance` | int | `None` | — | — |
| `--partner_dt_dense_memory_limit_gib`, `--protein_dt_dense_memory_limit_gib` | float | `None` | — | — |
| `--partner_bpe_path`, `--protein_bpe_path` | str | `None` | — | — |
| `--partner_unigram_path`, `--protein_unigram_path` | str | `None` | — | — |
| `--partner_unigram_vocab_size`, `--protein_unigram_vocab_size` | int | `None` | — | — |
| `--partner_unigram_max_raw_length`, `--protein_unigram_max_raw_length` | int | `None` | — | — |
| `--partner_wordpiece_path`, `--protein_wordpiece_path` | str | `None` | — | — |
| `--partner_wordpiece_vocab_size`, `--protein_wordpiece_vocab_size` | int | `None` | — | — |
| `--partner_wordpiece_max_raw_length`, `--protein_wordpiece_max_raw_length` | int | `None` | — | — |
| `--partner_word2vec_path`, `--protein_word2vec_path` | str | `None` | — | — |
| `--partner_glove_path`, `--protein_glove_path` | str | `None` | — | — |
| `--partner_fasttext_path`, `--protein_fasttext_path` | str | `None` | — | — |
| `--partner_pssm_index_path`, `--protein_pssm_index_path` | str | `None` | — | — |
| `--partner_ac_pssm_blosum62_hybrid_index_path`, `--protein_ac_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--partner_cc_pssm_blosum62_hybrid_index_path`, `--protein_cc_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--partner_acc_pssm_blosum62_hybrid_index_path`, `--protein_acc_pssm_blosum62_hybrid_index_path` | str | `None` | — | — |
| `--partner_psfm_index_path`, `--protein_psfm_index_path` | str | `None` | — | — |
| `--partner_frequency_profile_index_path`, `--protein_frequency_profile_index_path` | str | `None` | — | — |
| `--partner_profile_inclusion_evalue`, `--protein_profile_inclusion_evalue` | float | `None` | — | — |
| `--partner_ac_lag`, `--protein_ac_lag` | int | `None` | — | — |
| `--partner_cc_lag`, `--protein_cc_lag` | int | `None` | — | — |
| `--partner_acc_lag`, `--protein_acc_lag` | int | `None` | — | — |
| `--partner_pdt_lag`, `--protein_pdt_lag` | int | `None` | — | — |
| `--partner_pdt_max_raw_length`, `--protein_pdt_max_raw_length` | int | `None` | — | — |
| `--partner_covariance_max_raw_length`, `--protein_covariance_max_raw_length` | int | `None` | — | — |
| `--partner_ac_pssm_lag`, `--protein_ac_pssm_lag` | int | `None` | — | — |
| `--partner_cc_pssm_lag`, `--protein_cc_pssm_lag` | int | `None` | — | — |
| `--partner_acc_pssm_lag`, `--protein_acc_pssm_lag` | int | `None` | — | — |
| `--partner_ac_pssm_blosum62_hybrid_lag`, `--protein_ac_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--partner_cc_pssm_blosum62_hybrid_lag`, `--protein_cc_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--partner_acc_pssm_blosum62_hybrid_lag`, `--protein_acc_pssm_blosum62_hybrid_lag` | int | `None` | — | — |
| `--partner_param`, `--protein_param` | flag (append) | `[]` | — | — |

## 模型选择目标

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--checkpoint_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |
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
| `--ml_tuning_objective` | str | `None` | `f1`, `macro_f1`, `sacc`, `auc`, `aupr`, `dual_f1_sacc` | — |

<!-- END GENERATED CLI -->
## 如何阅读参数表

下表为参数解析器默认值；`None` 或空值可能按任务与路线进一步解析，不表示任意选项组合都受支持。BooleanOptionalAction 同时接受对应的 `--no-...` 关闭形式。示例需要先准备数据，参见[常用配方](./recipes)。KPCA 的 `kpca_gamma` 省略时在 RBF/poly 核上取有效默认 `0.1`，其他核不使用此参数。[模型选择目标](../concepts/selection-objectives)说明公共解析辅助函数添加的参数及任务默认值。

## 两侧覆盖设置

`--peptide_*` 和 `--partner_*` 分别配置两侧，`--protein_*` 是 partner 的兼容别名；省略项从全局设置继承并规范化。Two-stream 可使用受支持的异构两侧，Single-stream 要求表示设置一致。可重复使用 `--peptide_param key=value` / `--partner_param key=value`，但只接受已登记的 tower 参数键，数值字段按其声明类型转换。这些设置不改变任务类型或数据集字段要求。
