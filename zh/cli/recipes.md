# 常用配方

本页给出四类任务的端到端命令行示例。所有命令均在项目根目录下执行。

以上路径为需要替换的示例；使用独立的新输出目录。以下描述是成功运行时的输出约定，不表示这些示例已经完成训练或达到某种性能。

## 配方一：治疗性肽功能预测（pep_function）

```bash
python scripts/train_sequence_pipeline.py --artifact_dir /path/to/new-function-run \
  --task_type pep_function \
  --data_dir /path/to/function-data \
  --tokenizer kmer \
  --encoder onehot \
  --model cnn \
  --epochs 50 \
  --batch_size 64 \
  --lr 1e-3
```

**参数说明**

| 参数 | 作用 |
| --- | --- |
| `--task_type pep_function` | 治疗性肽功能（多标签）预测任务 |
| `--tokenizer kmer` | k-mer 分词器 |
| `--encoder onehot` | one-hot 编码，保留序列顺序 |
| `--model cnn` | CNN 序列模型（等价于 `--sequence_model cnn --training_mode end_to_end --classifier mlp`） |
| `--epochs 50` | 训练 50 轮 |
| `--batch_size 64` | 批大小 64 |
| `--lr 1e-3` | 学习率 1e-3 |

- 将 `--data_dir` 替换为已准备好的功能任务数据目录；文档仓库不提供训练数据。
- 经典路径：kmer 分词 + one-hot 编码 + CNN 序列模型。

**预期输出**：每轮训练/验证指标打印到控制台，存在测试划分且启用测试评估时输出测试指标；模型检查点、配置与指标摘要保存到 artifact 目录。

**查看结果**：直接查看控制台日志中的指标；产物保存在 artifact 目录中，可用 `scripts/replay_experiment_metrics.py` 回填或复核验证指标。

## 配方二：肽–蛋白相互作用预测（pep_protein_interaction）

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-ppi-run \
  --task_type pep_protein_interaction \
  --task_root /path/to/ppi-task \
  --tokenizer esm2 \
  --pair_strategy two_stream \
  --interaction_level vector \
  --predictor_type classifier \
  --classifier mlp \
  --epochs 20 \
  --batch_size 32
```

**参数说明**

| 参数 | 作用 |
| --- | --- |
| `--task_type pep_protein_interaction` | 肽–蛋白相互作用预测任务 |
| `--tokenizer esm2` | ESM2 预训练分词器 |
| `--pair_strategy two_stream` | 双流结构，两侧分别编码 |
| `--interaction_level vector` | 向量级交互 |
| `--predictor_type classifier` | 使用分类器作为预测器 |
| `--classifier mlp` | MLP 分类器作用于融合向量 |
| `--epochs 20` | 训练 20 轮 |
| `--batch_size 32` | 批大小 32 |

- 预训练路径：ESM2 编码器。
- 双流 + 向量级交互，融合后送入 MLP 分类器。

**预期输出**：每轮指标打印到控制台，仅当存在测试划分且启用测试评估时，才会输出最终测试指标；产物保存到 artifact 目录。

**查看结果**：查看控制台日志中的指标；产物在 artifact 目录中。

## 配方三：肽–HLA-I 配体呈递预测（pep_hlai）

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-hlai-run \
  --task_type pep_hlai \
  --task_root /path/to/hlai-task \
  --tokenizer esm2 \
  --pair_strategy two_stream \
  --interaction_level token \
  --interaction_model bi_cross_attn \
  --training_mode end_to_end \
  --epochs 20 \
  --batch_size 32
```

**参数说明**

| 参数 | 作用 |
| --- | --- |
| `--task_type pep_hlai` | 肽–HLA-I 配体呈递预测任务 |
| `--tokenizer esm2` | ESM2 预训练分词器 |
| `--pair_strategy two_stream` | 双流结构 |
| `--interaction_level token` | token 级交互 |
| `--interaction_model bi_cross_attn` | 双向交叉注意力 |
| `--training_mode end_to_end` | 端到端训练 |
| `--epochs 20` | 训练 20 轮 |
| `--batch_size 32` | 批大小 32 |

- 预训练路径：ESM2。
- 双流 + token 级双向交叉注意力，端到端训练。

**预期输出**：每轮指标打印到控制台，仅当存在测试划分且启用测试评估时，才会输出最终测试指标；产物保存到 artifact 目录。

**查看结果**：查看控制台日志中的指标；产物在 artifact 目录中。

## 配方四：肽–HLA-II 配体呈递预测（pep_hlaii）

```bash
python scripts/train_pair_pipeline.py --artifact_dir /path/to/new-hlaii-run \
  --task_type pep_hlaii \
  --task_root /path/to/hlaii-task \
  --tokenizer kmer \
  --encoder pssm \
  --pair_strategy two_stream \
  --interaction_level token \
  --interaction_model cross_attn \
  --training_mode end_to_end \
  --epochs 10 \
  --batch_size 32
```

**参数说明**

| 参数 | 作用 |
| --- | --- |
| `--task_type pep_hlaii` | 肽–HLA-II 配体呈递预测任务 |
| `--tokenizer kmer` | k-mer 分词器 |
| `--encoder pssm` | PSSM 编码（需 BLAST+ 与 PSSM 缓存） |
| `--pair_strategy two_stream` | 双流结构 |
| `--interaction_level token` | token 级交互 |
| `--interaction_model cross_attn` | 交叉注意力交互模型 |
| `--training_mode end_to_end` | 端到端训练 |
| `--epochs 10` | 训练 10 轮 |
| `--batch_size 32` | 批大小 32 |

- 经典路径：kmer + PSSM 编码。
- 双流 + token 级交叉注意力，端到端训练。

::: warning PSSM 依赖
`--encoder pssm` 需要本地安装 BLAST+，并预先用 `tools/build_pssm_cache.py` 构建缓存。
:::

::: tip epochs 默认值
对 `pep_hlaii` 任务，若未显式指定 `--epochs`，默认为 `10`。
:::

**预期输出**：每轮指标打印到控制台，仅当存在测试划分且启用测试评估时，才会输出最终测试指标；产物保存到 artifact 目录。

**查看结果**：查看控制台日志中的指标；产物在 artifact 目录中。

## 离线预训练模型

对于无公网访问的服务器，可将预训练模型快照放在项目 `models/` 目录下，并启用离线模式避免 Hugging Face 网络重试：

```bash
PEPPLATFORM_OFFLINE_MODE=1 python scripts/train_sequence_pipeline.py --artifact_dir /path/to/new-function-run \
  --task_type pep_function \
  --data_dir /path/to/function-data \
  --tokenizer esm2 \
  --esm2_model ./models/esm2 \
  --model cnn \
  --epochs 50
```

::: info 离线模式
`PEPPLATFORM_OFFLINE_MODE=1` 使训练优先使用本地模型目录，并在请求的预训练模型缺失时快速失败。模型目录示例：`models/esm2`、`models/protbert`、`models/prott5`、`models/EvolutionaryScale/esmc-600m-2024-12`、`models/esm3-sm-open-v1`。
:::

## 相关页面

- [CLI 概览](./overview)
- [交互式向导](./wizard)
- [train_pipeline.py 参数](./train-pipeline)
- [train_sequence_pipeline.py 参数](./train-sequence-pipeline)
- [train_pair_pipeline.py 参数](./train-pair-pipeline)
- [工具脚本](./tools)

## 示例数据前置条件

本页命令需要先准备对应任务的数据。存在功能快速数据集时，可显式传入 `--data_dir datasets/task_peptide_function/data_quick_384`，它与默认完整数据目录不同。Pair 示例需要对应任务的配对数据及必要的伙伴映射；PSSM/PSFM 路线还需要 BLAST 和相应 profile 参考库或缓存。参见[数据格式](../datasets/format)及[内置数据集](../datasets/builtin)。
