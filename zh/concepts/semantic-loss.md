# 统一语义辅助层

统一语义层是在主分类损失之外加入的表征约束。当前实现使用 InfoNCE 式对比损失，并通过独立语义投影头约束训练表征；经典分类器、固定表示直接接经典分类器的路线，以及 pair sample-graph 模型会在 preflight 阶段被拒绝。

## 两类语义关系

| 任务 | 自动采用的关系 | 构造范围 |
| --- | --- | --- |
| `pep_function` | 功能标签集合 Jaccard | 仅训练集 |
| `pep_protein_interaction`、`pep_hlaii`、`pep_hlai` | 正交互二分图的邻域 Jaccard | 仅训练集正边 |

Pair 任务不再使用任务专用模式。旧的 `hla_context` 和 `hlai_anchor` 已移除；语义关系由任务类型自动确定。

## 训练过程

主 DataLoader、随机抽样顺序和分类损失保持普通 baseline 的形式。完成数据划分后，系统为每个具备非零关系的训练 anchor 确定性选择：

- 默认 1 个非零 Jaccard 伙伴；
- 默认 8 个存在有效邻域、但 Jaccard 为零的弱零重叠伙伴（不足时由辅助 batch 内样本补齐）。

系统不构造完整样本相似度矩阵。每个主 batch 只查询固定 partner table，去重后对 anchor 与 partner 进行一次辅助前向。分类损失只作用于原主 batch；partner 不参与分类损失。没有非零伙伴的样本只参与分类训练，不会被强行配对。

辅助前向将 BatchNorm 和 Dropout 统一切换为 eval 行为，但保持 autograd 开启，因此两侧表征采用相同且确定的归一化模式，同时仍能联合反向传播。辅助前向结束后会恢复模块状态和随机数状态。

语义损失使用温度缩放的 cosine 对比损失：每个 anchor 的损失为
`-log( sum(exp(pos_logits)) / (sum(exp(pos_logits)) + sum(exp(neg_logits))) )`，
其中 `logits = cosine / temperature`。Pair 任务默认使用 `role_fused` 模式，分别约束 peptide 侧、partner 侧与融合 pair embedding；只有可分离双流模型会启用角色级约束，Single-stream 自动退回 fused-only。

## 可选 Jaccard 加权损失

`--semantic_loss_type` 支持两个选项：

- `legacy`（省略参数时的默认值）：完整保留原有损失分支。默认 fixed 伙伴等权；单序列
  dense_hard/placebo 和 Pair fused dense_hard 的原有指数项加权也保持不变。
- `jaccard_supcon`：对每个正伙伴分别计算 log 概率，乘以关系表中已有的 Jaccard，
  再按正伙伴数量平均，最后对有效 anchor 平均。

新目标为：

```text
q_ip = exp(cos(z_i, z_p) / temperature) / sum_a exp(cos(z_i, z_a) / temperature)
L_i = -sum_p(J_ip * log(q_ip)) / number_of_positive_partners
L_semantic = mean(L_i over usable anchors)
L_total = L_classification + semantic_similarity_weight * L_semantic
```

分母候选是每个 anchor 已有的去重正负伙伴，保留辅助 batch 负伙伴补齐规则；
补齐伙伴并不保证都经过零 Jaccard 验证。新损失不会重算 Jaccard、添加阈值、
改变伙伴采样或将 Jaccard 乘入 softmax 分母。它除以正伙伴**数量**，不是权重和，
所以只有一个正伙伴时，Jaccard 仍然影响约束强度。没有正伙伴或无法取得负伙伴的
anchor 跳过；全部跳过时返回可反传的零。新分支使用 logsumexp 保持数值稳定。

该选项适用于通过语义损失路线校验的神经训练配置；Pair sample-graph 与固定表征到经典分类器路线除外。Pair 的 fused、
peptide、context 分支使用同一个所选目标，再沿用原有分支平均与总权重。
它是基于采样伙伴表的 MultiSupCon 式扩展。
独立的对比预训练阶段中，`semantic_contrastive_mode` 和 batch 损失不受此选项控制。
Web 训练向导在启用语义层后提供“原有损失 / Jaccard 加权”选择。

新运行示例（使用独立输出目录）：

```bash
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data \
  --task_type pep_function --model transformer \
  --enable_semantic_similarity --semantic_loss_type jaccard_supcon \
  --semantic_similarity_weight 0.1 --artifact_dir artifacts/function_jaccard_supcon_run1
```

旧配置不需要迁移，不传新参数就继续使用历史损失。旧运行保留原有 provenance 格式；
`jaccard_supcon` 另记录 `loss_contract`（公式版本、权重位置、归一化、候选及补齐规则）。
新损失会拒绝覆盖已有旧语义 provenance 的目录。历史实验配置、候选名单与结果不更新。

加权是否改善分类表现需要独立实验验证。默认一个正伙伴时，新目标主要按 Jaccard
缩放各 anchor 的约束；多个正伙伴时还改变伙伴间的相对贡献。比较时应固定划分、
模型、seed 和伙伴表，并在验证集上比较语义总权重，区分损失形式和约束尺度的影响。

语义损失使用独立的 `SemanticProjection`。默认辅助损失配置不在分类推理中使用该投影；可选的推理可见残差适配器会把语义投影经映射后加回预测器表示，因此“投影始终不参与推理”不适用于所有配置。具体输出及使用方式以模型契约为准。

Validation 和 Test 不构造伙伴，也不计算语义损失。

## 参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--enable_semantic_similarity` | `False` | 启用统一语义辅助层 |
| `--semantic_loss_type` | `legacy` | 原有损失，或 `jaccard_supcon` 的逐正伙伴 Jaccard 加权损失 |
| `--semantic_similarity_weight` | `0.1` | 语义损失在联合目标中的权重 |
| `--semantic_pair_mode` | `role_fused` | pair 任务语义模式：`fused` / `role` / `role_fused` |
| `--semantic_projection_dim` | `64` | 语义投影头输出维度 |
| `--semantic_contrastive_temperature` | `0.1` | 对比损失温度 |
| `--semantic_positive_partners` | `1` | 每 anchor 正伙伴数 |
| `--semantic_zero_partners` | `8` | 每 anchor 零重叠负伙伴数 |
| `--semantic_zero_weight` | `0.25` | 已废弃，仅为兼容保留，不再参与损失 |

旧 Pair 参数 `--enable_interaction_semantic_similarity`、`--interaction_semantic_similarity_weight` 和 `--interaction_semantic_mode profile_jaccard` 仅用于读取历史配置；新配置统一写出新参数。专用模式及其 margin/smoothing 参数不会被静默映射。

## Web 伙伴数量配置

在训练向导的「自定义 → 语义相似度」中启用语义辅助损失后，可以设置：

- 每个 anchor 的正伙伴数：对应 `semantic_positive_partners`，默认 1，整数且至少为 1。
- 每个 anchor 的零重叠负伙伴数：对应 `semantic_zero_partners`，默认 8，整数且至少为 0。

这两个数量控制现有固定伙伴表的采样请求，实际数量受可用伙伴及去重规则影响。
负伙伴数设为 0 时，损失仍可能按既有规则从辅助 batch 补齐负伙伴，不代表关闭所有负例。
参数在预检查、实验保存、克隆和训练命令中保持一致；旧配置缺省时继续使用 1 / 8。
选择 `legacy` 或 `jaccard_supcon` 均可设置数量。调整数量会改变新实验的伙伴表，
比较时应记录数量，并保持数据划分、seed 和其余设置一致。

## 可复现性与产物

语义训练固定数据划分、seed、候选排序和伙伴数量。系统沿用 PyTorch `RandomSampler` 的主 batch 抽样算法，并在模型元数据中记录逐 epoch 样本顺序 SHA-256。启用 artifact 输出时还会保存：

- `data_split_indices.npz`：实际 train/validation/test 样本标识；
- `semantic_relation_source.npz`：训练标签或训练正交互图；
- `semantic_partner_table.npz`：fused 行级 anchor–partner 关系；
- `semantic_peptide_partner_table.npz` / `semantic_context_partner_table.npz`：角色级实体关系；
- `semantic_role_mapping.npz`：训练行到 peptide / context 实体索引的映射；
- `semantic_provenance.json`：包含关系类型、seed、模式、温度、投影维度和文件哈希；`jaccard_supcon` 另含 `loss_contract`。

这里保证的是常规方法级复现，不承诺跨硬件逐 bit 一致。

## 示例

```bash
# 单序列功能任务：自动使用标签集合 Jaccard
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data \
  --task_type pep_function \
  --model transformer \
  --enable_semantic_similarity \
  --semantic_similarity_weight 0.1

# 任一 Pair 任务：自动使用训练集正交互邻域 Jaccard
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data \
  --task_type pep_hlai \
  --model bi_cross_attn \
  --enable_semantic_similarity \
  --semantic_pair_mode role_fused \
  --semantic_similarity_weight 0.1
```

## 相关页面

- [任务类型](./tasks)
- [Pair 互作](./pair-interaction)
- [训练模式](./training-modes)
