# 交互式向导

交互式向导引导你逐项选择特征提取、编码器、模型等组件，无需记住全部参数。所有向导提示均为英文。

## 向导类

| 向导类 | 适用脚本 | 说明 |
| --- | --- | --- |
| `InteractiveConfigWizard` | `scripts/train_sequence_pipeline.py` | 单序列任务向导，定义于 `pepplatform/cli_wizard.py` |
| `PPIInteractiveWizard` | `scripts/train_pair_pipeline.py` | 配对任务向导，继承自 `InteractiveConfigWizard` |

## 触发方式

运行脚本时无参数，或显式传入 `--interactive` / `--advanced_wizard` 即可进入向导：

```bash
# 无参数 -> 自动进入向导
python scripts/train_sequence_pipeline.py

# 显式触发
python scripts/train_sequence_pipeline.py --interactive

# 高级模式，暴露更多选项
python scripts/train_sequence_pipeline.py --advanced_wizard

# 配对任务向导
python scripts/train_pair_pipeline.py
```

向导为所暴露的选项生成训练配置，CLI 还提供额外高级参数。应核对最终命令、有效配置与路线校验结果；两种入口的可选项范围不必完全相同。

::: warning 提示语言
所有向导提示均为英文；本页中文说明仅作流程导览。
:::

## 基本模式与高级模式

`--advanced_wizard` 会暴露基本向导中隐藏的额外选项（如更多编码器、融合方式、导出嵌入路径等）。初学者可使用基本向导，进阶用户使用高级向导。

## 单序列任务引导流程

### 预训练模型路径

1. `Choose feature extraction`
2. `Choose pretrained model`
3. 所有预训练模型：`Choose predictor route`，选择池化分类或残基建模
4. 残基建模：选择 CNN/RNN/GRU/LSTM/Transformer 或 GCN/GAT、训练模式和 Adapter 维度
5. `end_to_end` 使用神经预测头；`export_embeddings` 继续选择经典下游分类器

### 经典全局特征路径

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. `Choose feature transformation`
5. `Choose classifier`

::: info 特征变换可选项
支持的拟合型特征变换：`bow -> none / lsa / lda / plsa`，`TF-IDF, textrank -> none / lsa`。LSA 是单序列经典全局特征的非中心化截断 SVD，LDA 与 PLSA 只接受 BoW 原始计数。Pair 向导不提供 LSA；只有双流 classic BoW、concat、vector interaction 和 classical classifier 的严格 route 提供 LDA/PLSA。
:::

### 经典建模架构路径

1. `Choose feature extraction`
2. `Choose tokenizer`
3. `Choose encoder`
4. `Choose modeling architecture`
5. `Choose training mode`
6. 若导出嵌入：`Choose downstream classifier`

训练模式有两种：

- `end-to-end prediction` — 建模架构带神经预测头端到端训练。
- `export embeddings for downstream classification` — 建模架构带临时神经头训练，恢复最佳检查点后导出嵌入，再训练下游经典分类器作为最终预测器。临时头指标仅供表征学习诊断，非最终结果。

架构菜单会标注“sequence architecture”或“sequence chain-graph architecture”。`index` 只显示前者；具有逐位置特征向量的编码器还会显示 GCN/GAT。

## 配对任务引导流程

配对任务在编码器与最终预测器之间多一层配对策略选择：

1. `Choose feature extraction`
2. `Choose pretrained model` 或 `Choose tokenizer`
3. 若使用经典流水线：`Choose encoder`
4. `Choose pair strategy`

### 若选择 `single_stream`（带角色边界的编码序列拼接）

- `Choose modeling architecture`
- `Choose training mode`
- 若导出嵌入：`Choose downstream classifier`

### 若选择 `two_stream`

- `Choose interaction level`
- **vector-level interaction（向量级）**：
  - `Choose predictor route`
  - `Choose classifier` 或 `Choose sample-graph architecture`
  - `Choose fusion`
- **token-level interaction（token 级）**：
  - `Choose interaction architecture`
  - `Choose training mode`
  - 若导出嵌入：`Choose downstream classifier`

::: info 配对结构
- `single_stream`：使用同质共享编码契约，加入显式角色边界后送入序列模型。
- `two_stream` + 向量级：分别编码两侧，融合向量后送入分类器或样本图预测器。
- `two_stream` + token 级：分别编码两侧，经 `cross_attn` / `bi_cross_attn` 交互后送入神经头或导出交互嵌入。

Pair 图预测器族只保留在 Two-stream 向量路由。GCN、GAT、GraphSAGE 和 Graph Transformer 使用融合样本节点；HGT 使用类型化 peptide/partner 节点与 Pair 边 decoder。
:::

::: warning 预训练配对任务
预训练配对任务支持 Two-stream，以及两侧配置一致、具备显式残基 mask 的 Single-stream。实际可选项以当前向导和路线校验为准。
:::

## 相关页面

- [CLI 概览](./overview)
- [train_pipeline.py 参数](./train-pipeline)
- [train_sequence_pipeline.py 参数](./train-sequence-pipeline)
- [train_pair_pipeline.py 参数](./train-pair-pipeline)
- [常用配方](./recipes)
