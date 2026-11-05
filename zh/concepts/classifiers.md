# 分类器

分类器（Classifier）是建模流程的最终预测环节，通过 `--classifier` 参数选择。平台提供 1 种神经预测头族与 7 种经典分类器。

## 分类器一览

| 分类器 | 类型 | 说明 |
| --- | --- | --- |
| `mlp` | 神经预测头 | 至少包含一个非线性隐藏层的多层感知机，配合端到端路线训练 |
| `svm` | 经典 | 支持向量机；可选择 margin 或 sigmoid/Platt 概率模式 |
| `rf` | 经典 | 随机森林 |
| `extratrees` | 经典 | Extra Trees 极端随机树 |
| `histgb` | 经典 | Histogram-based Gradient Boosting |
| `xgb` | 经典 | XGBoost |
| `lgb` | 经典 | LightGBM |
| `logreg` | 经典 | 逻辑回归 |

## 神经分类器（MLP）

`mlp` 是端到端路线的神经预测头：

1. **多层感知机**：`head_hidden_dims` 非空时，使用 `Linear -> activation -> Dropout` 隐藏层堆叠和末端 logits 层。
2. **线性兼容变体**：`head_hidden_dims=[]` 的有效路线名称为 `Linear`，不是 MLP；旧的 `mlp+[]` 配置只作为输入兼容别名读取。

::: tip 与序列模型的关系
当选择序列模型路径并使用 `end_to_end` 训练模式时，默认预测头为 MLP。这是旧版 `--model cnn|rnn|gru|lstm|transformer` 的默认映射结果（`classifier=mlp`）。零隐藏层预设会在有效路线和模型名称中显示为 `Linear`。
:::

`export_embeddings` 不使用 MLP 作为最终下游分类器。该模式先用临时神经头学习并冻结表示，再训练 SVM、随机森林、ExtraTrees、HistGB、XGBoost、LightGBM 或 Logistic Regression。

## 经典分类器

经典分类器作用于**全局特征**（全局编码器输出，可选经[特征变换](./feature-transforms)），或作用于序列模型导出的嵌入。每种分类器有各自的超参数。

### 有限预算超参数搜索

Web 自定义实验可为全部经典分类器启用训练集内部交叉验证搜索。快速、标准和深入档分别最多评估 `6×2`、`12×3` 和 `18×5` 个候选-折组合；手动填写的参数始终作为基线候选。结果只表示固定候选空间中已评估参数的最佳值，不保证全局最优。搜索期间每个 fold 独立拟合特征变换、scaler 与降维器，最终选参后再在完整训练集上重拟合；外部验证集仍用于最终阈值校准。对于 `export_embeddings` 路线，交叉验证只调整下游经典分类器，不会在每折重训上游神经网络。

### SVM

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--svm_c` | `1.0` | 正则化参数 |
| `--svm_class_weight` | `balanced` | 类别权重：`balanced` / `none` |
| `--svm_max_iter` | `2000` | 最大迭代次数 |
| `--svm_tol` | `1e-3` | 收敛容忍度 |
| `--svm_kernel` | `linear` | 核函数：`linear` / `rbf` |
| `--svm_gamma` | `scale` | 核系数 |
| `--svm_calibration` | `none` | 输出模式：`none` / `sigmoid` |
| `--svm_calibration_cv_folds` | `3`（固定） | sigmoid 校准的分层交叉验证折数 |
| `--svm_convergence_policy` | CLI: `strict`；Web: `bounded_retry` | 收敛失败策略 |

`svm_calibration=none` 在线性核时使用 scikit-learn `LinearSVC`（liblinear、L2、squared-hinge），在 RBF 核时使用 `SVC(kernel="rbf", probability=False)`（libsvm）。最终分数是 `decision_function` margin，不是 0–1 概率。

`svm_calibration=sigmoid` 使用 `CalibratedClassifierCV(method="sigmoid", ensemble=True)`，固定采用带 seed、shuffle 的 3 折 `StratifiedKFold`；每折的基础 LinearSVC/RBF SVC 只在对应训练折拟合，输出为正类校准概率。每个 Train 标签的 0/1 类都至少需要 3 个样本；Validation 必须同时含两类，以记录逐输出和 macro Brier、log-loss 与 10-bin ECE。质量指标不设数据集相关性能阈值。两种模式都在 Validation 上拟合最终分类 operating point；Train 输入非有限、基础求解器未收敛或概率越界时，新训练失败关闭。

新配置统一写 `classifier=svm` 和 `svm_calibration=none|sigmoid`。历史 `calibrated_svm` 仅作为 `sigmoid` 的输入兼容别名读取，不再由 Web、CLI wizard 或能力 API 生成。

Web 默认使用有界收敛策略：只按初始 `max_iter` 的 `1× / 5× / 25×` 重试，并以 `max(初始值, 50,000)` 为自动上限；核函数、C、tol、scaler、数据和随机种子均不自动改变。多标签任务的独立分类器可按需停在不同档位，制品会分别记录每个输出的有效预算与实际迭代数。CLI 和论文复现实验默认 `strict`，首次未收敛即停止。两种策略都只保存完全收敛的最终分类器，并记录每次尝试。`export_embeddings` 路线若仅在下游 SVM 失败，会保留带完整性校验的上游表示，Web 可据此创建有来源关系的新实验，只重跑下游 SVM；原失败记录不被修改。

### 逻辑回归

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--logreg_c` | `1.0` | 正则化参数 |
| `--logreg_class_weight` | `balanced` | 类别权重 |
| `--logreg_max_iter` | `2000` | 最大迭代次数 |

PepPlatform 对每个输出拟合一个 scikit-learn `LogisticRegression`，固定使用 liblinear 求解器、L2 正则化和 logit link。每个 Train 输出必须同时包含 0 和 1；平台不会在逻辑回归名称下替换成常量预测器。正类分数是 `[0, 1]` 内的模型概率，但没有额外 calibration；分类 operating point 只在 Validation 上拟合。

CLI 和论文复现默认使用 `strict` 收敛策略，首次出现 `ConvergenceWarning` 即停止。Web 默认使用有界重试，只按 `1× / 5× / 25×` 增加 `max_iter` 并受自动上限约束；C、类别权重、求解器、预处理、数据和 seed 都保持不变。新制品在 LogReg contract 中记录每个输出的有效预算和迭代数；缺少该契约的旧制品为 `legacy_only`，正式 baseline 必须重训。

### 随机森林（rf）

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--rf_estimators` | `300` | 树数量 |
| `--rf_max_depth` | `0` | 最大深度（0 表示不限） |
| `--rf_min_samples_leaf` | `1` | 叶节点最小样本数 |

平台使用 scikit-learn `RandomForestClassifier`：每棵树基于 bootstrap 样本并在节点处分配随机特征子集，最终分数是各树叶节点类别频率的平均值。该分数位于 0–1，但没有额外执行概率校准；分类阈值由验证集按 F1 拟合。

### Extra Trees

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--et_estimators` | `300` | 树数量 |
| `--et_max_depth` | `0` | 最大深度（0 表示不限） |
| `--et_min_samples_leaf` | `1` | 叶节点最小样本数 |

平台使用 scikit-learn `ExtraTreesClassifier`。每棵树默认使用完整训练集而不做 bootstrap；每个节点随机抽取 `sqrt(n_features)` 个候选特征，为每个候选特征随机生成阈值，再从这些随机候选中选择 Gini 改善最大的切分。最终分数是各树叶节点类别频率的平均值。该分数位于 0–1，但没有额外概率校准；分类 operating point 在 Validation 上按配置的阈值目标 拟合。

新制品写入 ExtraTrees contract，并记录实际 scikit-learn 版本和身份参数。缺少该契约的旧 joblib 制品为 `legacy_only`；正式 baseline 必须在当前环境重训。

### HistGB

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--histgb_max_iter` | `300` | 最大迭代次数 |
| `--histgb_max_leaf_nodes` | `31` | 最大叶节点数 |
| `--histgb_lr` | `0.1` | 学习率 |
| `--histgb_l2_regularization` | `0.0` | L2 正则化 |

PepPlatform 对每个输出拟合一个 scikit-learn 1.7.2 `HistGradientBoostingClassifier`。每轮先将连续特征分箱，再基于梯度与 Hessian 的直方图统计建立一棵回归树；二分类使用 `log_loss` 和 logistic inverse link。平台固定 `max_bins=255`、`early_stopping=False`，因此 `histgb_max_iter` 是每个输出的实际 boosting 轮数；`histgb_max_leaf_nodes=0` 表示不限制叶节点数，其他值必须至少为 2。学习率必须大于 0，L2 必须非负。

每个 Train 输出必须同时包含 0 和 1，平台不会在 HistGB 名称下替换成常量预测器。分类器原生接受 NaN 缺失值，但不接受无穷值。输出为 `predict_proba` 的正类概率估计，未做独立 calibration；classification operating point 在 Validation 上按配置的阈值目标 拟合。

HistGB 的梯度提升身份来自 Friedman 2001，其直方图实现谱系由 scikit-learn 官方标为受 LightGBM 启发；当前实现不使用或声明 LightGBM 的 GOSS、EFB。新制品写入 HistGB contract 和精确 scikit-learn 版本。缺少该契约的旧 joblib 制品为 `legacy_only`，正式 baseline 必须重训。

### XGBoost

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--xgb_estimators` | `300` | 树数量 |
| `--xgb_max_depth` | `6` | 最大深度 |
| `--xgb_lr` | `0.1` | 学习率 |
| `--xgb_subsample` | `1.0` | 行采样比 |
| `--xgb_colsample` | `1.0` | 列采样比 |
| `--xgb_reg_alpha` | `0.0` | L1 正则化 |
| `--xgb_reg_lambda` | `1.0` | L2 正则化 |

PepPlatform 对每个输出拟合一个 `xgboost.XGBClassifier`，使用 `gbtree` booster、直方图建树和 `binary:logistic` 目标。`max_depth=0` 保留 XGBoost 官方的“不限制深度”语义。每个 Train 输出都必须同时包含 0 和 1；平台不会在 XGBoost 名称下替换成常量预测器。分数是 `[0, 1]` 内的正类概率，但没有额外 calibration；分类 operating point 只在 Validation 上拟合。

新制品把 Train 拟合的 scikit-learn 预处理器保存在 `model.joblib`，每个 booster 使用 XGBoost 原生 UBJSON 模型格式。带哈希的 manifest 绑定输出标签、参数、依赖版本和模型文件，导出时还验证原模型与原生格式重载后的预测逐值一致。缺少 XGB contract 的历史制品仅为 `legacy_only`，正式论文 baseline 必须重训。

### LightGBM

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--lgb_estimators` | `300` | 树数量 |
| `--lgb_max_depth` | `6` | 最大深度 |
| `--lgb_lr` | `0.1` | 学习率 |
| `--lgb_subsample` | `1.0` | 行采样比 |
| `--lgb_colsample` | `1.0` | 列采样比 |
| `--lgb_reg_alpha` | `0.0` | L1 正则化 |
| `--lgb_reg_lambda` | `0.0` | L2 正则化 |

PepPlatform 对每个输出拟合一个 `lightgbm.LGBMClassifier`，固定使用 `gbdt` booster、`binary` 目标和 31 个最大叶节点。`lgb_max_depth=0` 会按 LightGBM 官方语义传为 `-1`（不限制深度）；当 `lgb_subsample<1` 时，平台将 `subsample_freq` 设为 1，从而真正启用行采样。这里使用的是普通 GBDT bagging，不声称启用 GOSS；EFB 保持 LightGBM 库默认行为。

LightGBM 固定在 CPU 上使用 4 线程，并启用 `deterministic=true` 和 `force_row_wise=true`。实验 seed 同时写入主随机状态及 bagging、feature fraction、data sampling 子种子；模型契约和 manifest 会记录实际线程、确定性、直方图模式、设备、seed 与依赖版本。平台保证同一数据、配置和软件/编译环境内的重复训练可复现；LightGBM 版本、编译器或系统变化后的逐位一致不作保证。

每个 Train 输出必须同时包含 0 和 1，平台不会在 LightGBM 名称下替换成常量预测器。类别不平衡通过逐输出 `scale_pos_weight` 处理；输出是正类概率分数，但没有额外 calibration，分类 operating point 只在 Validation 上拟合。

新制品把 Train 拟合的 scikit-learn 预处理器保存在 `model.joblib`，每个 booster 保存为 LightGBM 原生文本模型。`lgb_manifest.json` 绑定输出标签、有效参数、依赖版本、文件大小和 SHA-256；发布前必须验证原分类器和 `lightgbm.Booster` 重载后的概率逐值一致。缺少 LGB contract 的历史制品仅为 `legacy_only`，正式论文 baseline 必须重训。

## 自动调参

经典分类器支持自动超参搜索：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--ml_auto_tune` | `False` | 是否启用自动调参 |
| `--ml_tuning_objective` | 按任务 | 调优目标：功能多标签任务默认 `f1`，二分类 Pair 任务默认 `auc` |
| `--ml_tuning_mode` | `cv` | 调优模式：`holdout` / `cv`（交叉验证） |
| `--ml_tuning_max_candidates` | `18` | 最大候选配置数 |
| `--ml_cv_folds` | `2` | 交叉验证折数 |

::: tip
启用 `--ml_auto_tune` 后，平台在配置的预算与调参目标下选择已评估候选中的较优者。`cv` 使用训练集内部折叠，`holdout` 使用留出调参划分；两者都不保证测试性能提高。

未显式指定目标时，自动调参与神经 checkpoint 采用一致的任务策略：多标签功能预测使用 Macro F1，二分类 Pair 任务使用 ROC-AUC。显式配置始终优先。
:::

## 相关页面

- [序列模型](./sequence-models) — MLP 与序列模型的端到端训练
- [训练模式](./training-modes) — 导出嵌入后用经典分类器作为下游预测器
- [特征变换](./feature-transforms) — 全局特征路径的可选变换与降维
