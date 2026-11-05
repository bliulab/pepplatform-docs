# 模型选择目标 {#model-selection-objectives}

平台把检查点选择、阈值拟合和自动调参作为独立阶段。所有选择使用训练/验证数据；测试集不参与权重、阈值或超参数选择。界面展示的排行榜排序指标也不等于训练时的选择目标。

## 目标与默认值 {#objectives-and-defaults}

| 阶段 | 单序列功能任务默认 | Pair 二分类默认 |
| --- | --- | --- |
| 检查点 `checkpoint_objective` | `macro_f1` | `auc` |
| 最终阈值 `threshold_objective` | `macro_f1` | `f1` |
| 自动调参 `tuning_objective` | `macro_f1` | `auc` |

支持的目标有 `f1`、`macro_f1`、`sacc`、`auc`、`aupr`、`dual_f1_sacc`，但必须满足任务和阶段约束。多标签中的 `f1` 别名规范化为 `macro_f1`；`sacc` 和双目标只适用于多标签。AUC/AUPR 使用连续分数，不能用作阈值拟合目标；类别条件不足时不以默认分数代替。

`dual_f1_sacc` 必须给出正且有限的 `reference_f1`、`reference_sacc`。它按两个参考值归一化，依次最大化较小达成率、达成率之和、F1、SAcc；不是两项指标的简单平均。

## 阈值搜索 {#threshold-search}

F1 类目标默认使用 `f1_exact_v1`；SAcc 和双目标默认使用 `coordinate_quantile32_v1`。高级选项还包括 `coordinate_all_v1`。`f1_exact_v1` 不能优化 SAcc 或双目标。预测使用 `score >= threshold`，相同目标值时采用更大的阈值。

高级参数 `checkpoint_threshold_objective` 和 `checkpoint_threshold_search_profile` 可以单独控制检查点比较时的阈值计算；省略时沿用最终阈值设置。恢复最佳检查点后重新拟合最终验证阈值，再冻结用于测试和推理。

## CLI 与 Web {#cli-and-web}

```bash
python scripts/train_sequence_pipeline.py --list_objectives
python scripts/train_pair_pipeline.py --list_objectives
```

训练时可指定：

```bash
python scripts/train_sequence_pipeline.py --task_type pep_function   --data_dir /path/to/function-data --tokenizer kmer --encoder onehot --model cnn   --checkpoint_objective macro_f1 --threshold_objective macro_f1   --tuning_objective macro_f1 --epochs 10
```

数据目录须满足[数据格式](../datasets/format)。自动调参需要另行启用 `--ml_auto_tune`；仅设置目标不会启动搜索。`ml_tuning_objective` 是调参目标的兼容字段；若与 `tuning_objective` 同时设置，二者必须一致。

Web 在实验向导中配置对应目标，使用 Preflight 核对实际支持组合。模型产物保存版本化的 `selection_contract`，包含目标定义、参数、搜索配置和检查点作用范围。导出嵌入路线的检查点属于表征阶段，不能当作最终下游分类器的结果。
