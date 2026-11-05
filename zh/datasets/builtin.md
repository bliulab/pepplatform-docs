# 内置数据集目录

源码中的目录定义了四类任务的 7 个数据集条目。**源码发布包和所提供的 Docker 镜像均不附带这些数据集**。只有相应源路径存在时，平台才会登记对应条目；目录名称不证明数据有效或规模与名称一致。

## 数据集目录

| ID | 任务 |
| --- | --- |
| `builtin-pep-function-quick` | `pep_function` |
| `builtin-pep-function` | `pep_function` |
| `builtin-pep-hlaii` | `pep_hlaii` |
| `builtin-pep-hlaii-full` | `pep_hlaii` |
| `builtin-ppi` | `pep_protein_interaction` |
| `builtin-ppi-quick` | `pep_protein_interaction` |
| `builtin-hlai` | `pep_hlai` |

运行时会按实际存在的文件选择规范化划分目录或历史源目录，应在数据集页和报告中检查实际条目。新数据可通过[自定义上传](./upload)提供；目录登记不能替代数据校验或路线预检。

## 标签与规模

`pep_function` 是多标签任务，标签名称与数量由数据集的 `labels.csv` 决定，并不固定为 15 类。Pair 任务使用二元标签。当前发布包不包含上述研究数据，本文不对它们的样本量、类别比例或基准性能作保证。

## 验证上传格式

如仅需验证单序列上传流程，可在源码根目录生成合成 ZIP：

```bash
python tools/build_web_route_smoke_dataset.py --output output/synthetic-sequences.zip
```

该工具生成少量人工序列与两个示例标签，用于流程检查；它不提供真实生物学标签或性能基准。随后可在数据集页上传，并检查数据集报告。

## 下一步

- [数据格式](./format)
- [自定义上传](./upload)
- [公开数据库 CLI](./public-databases-cli)
- [任务类型](../concepts/tasks)
