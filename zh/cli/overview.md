# CLI 概览

PepPlatform 通过命令行脚本完成模型训练、特征缓存与数据预处理。所有脚本均从源码运行，无需安装包，在项目根目录下直接调用即可。

## 入口点

### 主训练脚本

- **`scripts/train_pipeline.py`** — **统一调度入口**，按 `--task_type` 转发到 sequence 或 pair 专用脚本，主要用于兼容旧命令。
- **`scripts/train_sequence_pipeline.py`** — 单序列任务专用脚本，用于 `pep_function`，支持经典流水线与预训练模型两条路径。
- **`scripts/train_pair_pipeline.py`** — Pair 任务专用脚本，用于 `pep_protein_interaction`、`pep_hlaii`、`pep_hlai`。

::: tip 三个入口的关系
新命令推荐直接使用专用脚本：单序列走 `train_sequence_pipeline.py`，多肽与 protein / HLA-I / HLA-II 的互作任务走 `train_pair_pipeline.py`。`train_pipeline.py` 保留为薄调度器，方便旧命令继续运行。
:::

### 工具与辅助脚本

- **`tools/*.py`** — 离线 profile 缓存、分词器与嵌入训练、数据准备和审计。公开平台工具列表见[工具脚本](./tools)。
- **`scripts/replay_experiment_metrics.py`** — 重放实验并回填验证指标。
- **`scripts/import_legacy_sqlite.py`** — 将旧版本地 SQLite 元数据导入 PostgreSQL。

## 如何运行

先按[CLI 安装](../install/cli-only)准备依赖，再从平台项目根目录运行脚本，无需执行 `pip install .`：

```bash
python scripts/train_pipeline.py
```

::: tip 运行目录
始终在项目根目录（`PepPlatform/`）下执行脚本，以便脚本正确定位 `datasets/`、`models/` 等相对路径。
:::

### 触发方式

| 方式 | 行为 |
| --- | --- |
| 无参数 | 启动交互式向导（推荐新手） |
| `--interactive` | 显式启动交互式向导 |
| `--advanced_wizard` | 启动高级向导，暴露更多选项 |
| 带其他参数 | 直接训练，不进入向导 |
| `--help` | 打印全部参数帮助后退出 |

```bash
# 交互式向导（推荐新手）
python scripts/train_pipeline.py

# 单序列任务
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50

# Pair 互作任务
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp

# 高级向导
python scripts/train_sequence_pipeline.py --advanced_wizard

# 查看调度入口帮助
python scripts/train_pipeline.py --help
```

## 主训练入口对比

| 脚本 | 适用任务 | 参数数量 | 向导类 |
| --- | --- | --- | --- |
| `scripts/train_pipeline.py` | 全部 4 类任务的调度入口 | 3 | — |
| `scripts/train_sequence_pipeline.py` | `pep_function` | 从源码生成 | `InteractiveConfigWizard` |
| `scripts/train_pair_pipeline.py` | 3 类 pair 任务 | 从源码生成 | `PPIInteractiveWizard` |

::: info 向导与命令行等价
交互式向导设置的就是命令行参数，两者完全等价。向导只是引导你逐项选择，最终生成的参数与手动指定一致。
:::

## 相关页面

- [交互式向导](./wizard) — 向导触发方式与引导流程
- [train_pipeline.py 参数](./train-pipeline) — 统一调度入口参数参考
- [train_sequence_pipeline.py 参数](./train-sequence-pipeline) — 单序列任务参数参考
- [train_pair_pipeline.py 参数](./train-pair-pipeline) — Pair 专用脚本完整参数参考（3 类任务）
- [工具脚本](./tools) — 离线缓存与预处理工具
- [常用配方](./recipes) — 四类任务的端到端示例
