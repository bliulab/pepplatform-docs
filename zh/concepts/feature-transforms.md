# 特征变换

特征变换作用于**全局编码器**的输出向量，在交给[分类器](./classifiers)之前对特征进行降维或语义重构。仅适用于经典全局特征路径。

## 拟合型特征变换

特定全局编码器支持拟合型变换，通过 `--reduction` 参数选择：

| 编码器 | 支持的变换 |
| --- | --- |
| `bow` | `none` / `lsa` / `lda` / `plsa` |
| `TF-IDF` | `none` / `lsa` |
| `textrank` | `none` / `lsa` |

### 变换方法说明

| 变换 | 说明 |
| --- | --- |
| `none` | 不做变换，直接使用原始全局向量 |
| `lsa` | Latent Semantic Analysis：对序列×term 矩阵执行不中心化截断 SVD |
| `lda` | Latent Dirichlet Allocation，潜在狄利克雷分配，主题模型 |
| `plsa` | Probabilistic Latent Semantic Analysis，Train-only 原生 EM 主题概率 |

`labelled_lda` 已移除。包含该变换的历史模型仅保留推理兼容，正式实验必须使用其他变换重新训练。

平台 LSA 固定使用 scikit-learn 的 randomized
`TruncatedSVD`，仅在 Train 上拟合，不做中心化；Validation、Test 和 Web
推理只调用冻结后的线性 `transform`。`BoW` 与 `TF-IDF` 路线保留标准
LSA 的文档-term 矩阵机制；`TextRank` 权重路线应写为 PepPlatform 的加权
LSA 变体。它不是 LDA 或 pLSA，也不代表复现任何论文的数据集、预处理、
超参数或实验结果。

新 Pair 配置不支持 `reduction=lsa`，因为 tower 融合后的向量没有被证明
仍是文档-term 矩阵。Pair 的通用截断 SVD 降维请使用
`--ml_reduction tsvd`。历史 Pair LSA 制品只保留 `legacy_only` 数值推理。

在输入矩阵、目标维度、随机种子和预处理完全相同的条件下，Pair 的
`ml_reduction=tsvd` 与 LSA 使用相同的非中心化 randomized `TruncatedSVD`
算子；但它是通用数值降维，不把融合向量命名为 LSA，也不主张其具有
文档-term 语义。Pair 默认先做 ML scaler，再执行通用降维。

平台 LDA 只接受 `BoW` 的原始非负整数计数，并使用
scikit-learn 批量变分 Bayes，仅在 Train 上拟合。单序列 route 使用普通
sequence-by-term 矩阵；严格 Pair route 使用角色化的 `peptide | partner` 拼接计数矩阵。对 Validation、Test 与 Web
推理输出冻结模型下归一化的文档-主题后验。主题数可以大于词项数；无效输入、
未收敛状态、数值警告和内存超限均失败关闭。对称文档-主题与主题-词项先验固定为
`1 / lda_topics`。

Pair 只有在双流 classic BoW、固定角色顺序 `peptide | partner`、
`fusion_mode=concat`、vector interaction 和 classical classifier 下才支持
`reduction=lda`，并记录独立的双角色 BoW 联合 contract。其他 Pair 融合向量
不保留可证明的文档-term 计数语义；历史 Pair LDA 制品显示为 `LegacyLDA`，仅保留
带警告的 `legacy_only` 数值推理。

平台 PLSA 是基于 Hofmann 定义的原生 EM 实现，只接受单序列或严格
Pair BoW route 的原始非负整数计数。它在 Train 上联合估计 `P(z|d)` 与 `P(w|z)`，在
Validation、Test 和 Web 推理中冻结主题词分布并执行逐文档 fold-in，输出归一化
文档-主题概率。固定 Train 词表中在当前拟合 split 计数为零的词项，在 held-out
fold-in 时按该 split 的 OOV 忽略；若一行只剩这类词项，则按零文档契约输出均匀主题
分布。该规则不使用 held-out 数据拟合或平滑。TF-IDF、TextRank 和非严格 Pair 融合向量被拒绝；严格 Pair BoW
route 使用独立联合 contract。旧的
`nonnegative_sklearn` KL-NMF 制品显示为 `LegacyKLNMF`，带 `legacy_only` 警告，
不能生成新的正式基线。

### 相关参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--reduction` | `none` | 拟合型变换方法 |
| `--lsa_dim` | `128` | LSA 目标维度 |
| `--lsa_dense_memory_limit_gib` | `4.0` | LSA 输入稠密矩阵估算的硬内存上限 |
| `--lda_topics` | `50` | LDA 主题数 |
| `--lda_dense_memory_limit_gib` | `4.0` | LDA 输入与变分状态估算的硬内存上限 |
| `--plsa_topics` | `50` | PLSA 主题数 |
| `--plsa_memory_limit_gib` | `4.0` | PLSA 估算工作集内存上限 |

::: tip
拟合型变换与编码器绑定：向导会根据所选编码器、Pair 交互 route 和分类器自动过滤
可用变换。Pair 任务不会显示 LSA；只有严格 Pair BoW route 显示 LDA/PLSA。
:::

## ML 特征缩放

全局特征在进入经典分类器前可进行缩放，通过 `--ml_scaler` 参数选择：

| 缩放器 | 说明 |
| --- | --- |
| `none` | 不缩放 |
| `standard` | 标准化（零均值、单位方差，默认） |
| `minmax` | Min-Max 缩放到 [0, 1] |

## ML 降维

除上述算法命名的变换外，平台还提供通用 ML 降维，通过 `--ml_reduction` 参数选择：

| 降维方法 | 说明 |
| --- | --- |
| `none` | 不降维 |
| `pca` | 主成分分析，线性降维 |
| `kpca` | 核主成分分析；非线性核产生非线性表示 |
| `tsvd` | 仅在 Train 拟合的不中心化 randomized Truncated SVD，作用于通用数值特征；兼容稀疏输入 |

### 降维相关参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--ml_reduction` | `none` | ML 降维方法 |
| `--ml_reduction_dim` | `128` | 降维目标维度 |
| `--tsvd_dense_memory_limit_gib` | `4.0` | TSVD 输入稠密矩阵估算的硬内存上限 |
| `--pca_dense_memory_limit_gib` | `4.0` | PCA 输入与求解工作集估算的硬内存上限 |
| `--kpca_memory_limit_gib` | `4.0` | KPCA Gram 矩阵与求解工作集估算的硬内存上限 |
| `--kpca_kernel` | `rbf` | KPCA 核函数：`rbf` / `linear` / `poly` / `cosine` |
| `--kpca_gamma` | `None` (RBF/poly 有效默认 `0.1`) | 仅用于 RBF/多项式核的正核系数 |

TSVD 只在 Train 上拟合，并将不中心化 randomized `TruncatedSVD`
冻结用于 Validation、Test 和 Web 推理；非有限矩阵、非法维度、数值 warning、
特征宽度不一致或超过内存上限时失败关闭。TSVD 是通用数值降维，不代表 LSA
文档-term 语义。缺少该 contract 的历史 TSVD 制品只保留 `legacy_only` 数值推理，
正式基线必须重新训练。

PCA 使用 Train 特征均值执行中心化 PCA；KPCA 使用
Train-only 中心化核矩阵，并只允许 `rbf`、`linear`、`poly` 和 `cosine`。
两者都要求目标维数严格小于输入维数并满足中心化样本秩边界，随后冻结变换用于
Validation、Test 与 Web 推理。非法维度、非有限输入、退化秩、数值 warning、
制品不一致和内存超限均失败关闭。历史无 contract 制品及历史 sigmoid-KPCA
仅保留带 `legacy_only` 警告的数值推理。

## 自动调参

经典分类器路径支持自动超参搜索，详见 [分类器](./classifiers#自动调参)：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--ml_auto_tune` | `False` | 是否启用自动调参 |
| `--ml_tuning_objective` | 按任务 | 功能多标签任务默认 `macro_f1`（`f1` 是别名），二分类 Pair 任务默认 `auc` |
| `--ml_tuning_mode` | `cv` | 调优模式：`holdout` / `cv` |
| `--ml_tuning_max_candidates` | `18` | 最大候选配置数 |
| `--ml_cv_folds` | `2` | 交叉验证折数 |

## 引导流程中的位置

全局特征路径的引导流程中，特征变换是第 4 步：

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. **`Choose feature transformation`**
5. `Choose classifier`

## 相关页面

- [编码器](./encoders) — 全局编码器与保序编码器的分类
- [分类器](./classifiers) — 经典分类器与自动调参
- [特征路线](./routes) — 全局特征路径与序列模型路径
