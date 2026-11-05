# train_pipeline.py 参数参考

统一调度入口，按 `--task_type` 转发到专用训练脚本：单序列任务走 `train_sequence_pipeline.py`，pair 互作任务走 `train_pair_pipeline.py`。新命令推荐直接使用专用脚本；本入口主要用于兼容旧命令。

本页参数由 `gen_cli_ref.py` 从源码自动提取。

## 基本用法

```bash
# 兼容旧的单序列命令；实际转发到 train_sequence_pipeline.py
python scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50

# 兼容旧的 pair 命令；实际转发到 train_pair_pipeline.py
python scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp

# 查看调度入口帮助
python scripts/train_pipeline.py --help
```

<!-- BEGIN GENERATED CLI -->

> 共 `3` 个参数

## 任务与数据

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--task_type` | str | `'pep_function'` | `pep_function`, `pep_protein_interaction`, `pep_hlaii`, `pep_hlai` | 调度入口。根据任务类型转发到 `train_sequence_pipeline.py` 或 `train_pair_pipeline.py` |

## 输入输出与控制

| 参数 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| `--interactive` | flag (store_true) | `False` | — | Forward interactive mode to the selected task-specific entrypoint. |
| `--advanced_wizard` | flag (store_true) | `False` | — | Forward advanced wizard mode to the selected task-specific entrypoint. |

<!-- END GENERATED CLI -->
## 如何阅读参数表

下表为参数解析器默认值；`None` 或空值可能按任务与路线进一步解析，不表示任意选项组合都受支持。BooleanOptionalAction 同时接受对应的 `--no-...` 关闭形式。示例需要先准备数据，参见[常用配方](./recipes)。KPCA 的 `kpca_gamma` 省略时在 RBF/poly 核上取有效默认 `0.1`，其他核不使用此参数。[模型选择目标](../concepts/selection-objectives)说明公共解析辅助函数添加的参数及任务默认值。
