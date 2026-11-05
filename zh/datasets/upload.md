# 自定义数据集上传

除 [内置数据集](./builtin) 外，你可以上传自己的数据集用于训练与评估。上传通过 Web API 完成，系统会自动校验目录结构并按需规范化。

也可先用[公开数据库命令行工具](./public-databases-cli)获取数据、冻结来源并离线构建，再上传通过校验的标准 ZIP。

## 上传接口

```
POST /api/datasets/upload
Content-Type: multipart/form-data
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `task_type` | string | 是 | 任务类型：`pep_function` / `pep_protein_interaction` / `pep_hlaii` / `pep_hlai` |
| `name` | string | 是 | 数据集名称 |
| `archive` | file | 是 | `.zip` 压缩包 |

详细的字段格式要求见 [数据格式规范](./format)。

## CSV、TSV 和 TXT 输入

ZIP 内下述表格均可换成同名小写 `.tsv` 或 `.txt`：`labels.csv`、`pairs.csv`，以及 PPI / HLA-I 扁平布局中的 `train.csv`、`val.csv`、`test.csv`。TXT 表格必须带表头，使用逗号或制表符分隔；单列标签表也支持。序列文件可使用 `seqs.txt`，每行一条序列，标签仍需单独提供。

例如，肽功能任务可以上传：

```text
my-dataset.zip
  train/
    seqs.txt
    labels.txt
  val/
    seqs.txt
    labels.txt
```

`seqs.txt` 示例：

```text
ACDEFGHIK
LMNPQRSTV
```

表格 TXT 的字段要求与 CSV 相同；例如配对任务的 `pairs.txt` 可以是：

```text
peptide,protein,label
ACDEFGHIK,LMNPQRSTV,1
LMNPQRSTV,ACDEFGHIK,0
```

TXT 使用 UTF-8（可带 BOM），支持 LF / CRLF。`seqs.txt` 去除行首尾空白后必须每行仅含英文字母，不允许空记录、内部空白或 FASTA 标题；保留顺序、重复序列和大小写。表格分隔符由表头中引号外的逗号或制表符确定，同时存在两种时拒绝上传；含分隔符、换行或双引号的字段使用 CSV 引号规则。

同目录同名表格按 **CSV > TSV > TXT** 选择，序列按 **FASTA > TXT** 选择；高优先级文件校验失败不会回退。系统保留原 TXT，生成标准 CSV / FASTA 后执行既有校验，不自动生成标签或划分数据。详见[格式规范](./format)。

## 各任务类型的 ZIP 结构

### pep_function（sequence_dir）

```
my-dataset.zip
  train/
    seqs.fasta
    labels.csv
  val/
    seqs.fasta
    labels.csv
  test/               # 可选
    seqs.fasta
    labels.csv
```

### pep_protein_interaction / pep_hlai

**方案 A — pair_split_dir：**

```
my-dataset.zip
  train/
    pairs.csv
    labels.csv
  val/
    pairs.csv
    labels.csv
```

**方案 B — pair_dir（扁平 CSV）：**

```
my-dataset.zip
  train.csv
  val.csv
  test.csv            # 可选
```

系统会自动将方案 B 规范化到 `normalized/{split}/` 子目录下。

### pep_hlaii（pair_split_dir + require_sequence_view）

```
my-dataset.zip
  train/
    pairs.csv         # 必须包含：peptide, pair_pseudo, label
    labels.csv
    seqs.fasta        # 必需
  val/
    pairs.csv
    labels.csv
    seqs.fasta
```

::: warning HLA-II 必须包含 seqs.fasta
`pep_hlaii` 任务启用 `require_sequence_view=True`，因此每个划分都必须提供 `seqs.fasta`（也可由 `seqs.txt` 转换），且标准化后的 `pairs.csv` 必须包含 `peptide`、`pair_pseudo`、`label` 三列，否则校验失败。
:::

## 上传流程

1. 按对应任务类型的格式要求准备 ZIP 压缩包；
2. 通过 Web 界面（数据集页面 → 上传）或 API 上传；
3. 系统校验压缩包结构，必要时自动规范化；
4. 数据集出现在你的数据集列表中，`source` 标记为 `upload`。

::: tip 自动解包
ZIP 内可以将所有文件包裹在一个根目录中，系统会自动解包并定位真实数据根目录，无需手动拍平。
:::

::: tip 划分可选
`test` 划分在所有任务中都是可选的。若只提供 `train` / `val`，平台会在评估阶段自动处理。
:::

## 删除数据集

```
DELETE /api/datasets/{dataset_id}
```

**删除规则：**

- 仅 `source: upload` 的自定义数据集可删除，[内置数据集](./builtin) 不可删除；
- 若仍有实验引用该数据集，则无法删除，需先解除引用。

## 下一步

- 了解各格式字段要求：[数据格式规范](./format)
- 浏览可用内置数据：[内置数据集](./builtin)
- 安装与部署：[安装](../install/requirements)
