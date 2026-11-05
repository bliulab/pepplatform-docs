# 数据格式规范

PepPlatform 数据集按任务类型采用不同的目录格式。本文详细说明平台支持的 4 种数据格式、各任务的字段要求，以及特殊文件的处理方式。无论使用 [内置数据集](./builtin) 还是 [自定义上传](./upload)，最终都会被规范化为以下格式之一。

## 格式总览

平台支持 4 种数据格式：

| 格式 | 适用任务 | 目录结构 | 关键文件 |
| --- | --- | --- | --- |
| `sequence_dir` | `pep_function` | `{root}/{train,val,test}/` | `seqs.fasta` + `labels.csv` |
| `pair_split_dir` | `pep_protein_interaction` / `pep_hlai` / `pep_hlaii` | `{root}/{train,val,test}/` | `pairs.csv` + `labels.csv`（+ `seqs.fasta`） |
| `pair_root` | legacy/raw 兼容格式 | `{root}/processed/*.csv` | 原始 CSV；建议先规范化为 `pair_split_dir` |
| `pair_dir` | 上传的扁平打包 | `{root}/{train,val,test}.csv` | 上传后规范化到 `normalized/{split}/` |

::: tip 术语
本文中 `{root}` 指数据集根目录，`{split}` 指 `train` / `val` / `test` 三个划分。`test` 划分在所有格式中都是可选的。
:::

## Web 上传中的 TSV

Web 数据集上传仍使用 `.zip`。以下输入表格可以将 `.csv` 换成小写 `.tsv`，表头与字段要求不变：

- `train/`、`val/`、可选 `test/` 中的 `labels.tsv` 和 `pairs.tsv`。
- PPI / HLA-I 扁平打包中的 `train.tsv`、`val.tsv`、可选 `test.tsv`。

TSV 使用 tab 分隔，含 tab、换行或双引号的字段应按 CSV 引号规则转义。单列标签表同样可以使用 `.tsv`。不同表格允许混用 CSV 和 TSV；同目录同名文件同时存在时，优先使用 CSV，即使该 CSV 校验失败也不会回退到 TSV。

上传时保留原 TSV，并生成缺失的同名 CSV，再执行原有校验及归一化。已有 CSV 不会被改写，也不会根据内容猜测分隔符。下文目录结构、报告和实验读取仍使用标准 CSV；FASTA 要求及样本顺序保持不变。此能力限于 Web 上传，不扩展 CLI 直接读取 TSV 或内置数据集的格式，也不转换其他辅助 TSV 文件。

推理面板可直接导入 `.tsv`：单序列表需要 `sequence`、`seq` 或 `peptide` 列；配对表需要 `peptide` / `pep` 及当前任务支持的伴侣列。`.csv` 固定按逗号读取，`.tsv` 固定按 tab；`.txt` 或无扩展名输入只检查首个非空行中引号外的分隔符，逗号优先，否则使用 tab。整份文件使用同一分隔符，推理结果下载仍为 CSV。

## Web 上传中的 TXT

ZIP 内支持 `train/`、`val/`、可选 `test/` 下的 `labels.txt`、`pairs.txt` 和 `seqs.txt`；PPI / HLA-I 还支持扁平的 `train.txt`、`val.txt`、`test.txt`。文件名使用小写。TXT 文件使用 UTF-8（可带 BOM），支持 LF 和 CRLF。

- 表格 TXT 带表头和至少一条数据，字段与相应 CSV 相同；各行列数必须与表头一致。分隔符按表头中引号外的逗号或制表符确定，同时存在两者时报错，没有分隔符时按单列表格读取。CSV 引号转义规则适用，也支持带引号的多行字段。
- `seqs.txt` 每行一条序列，去除行首尾空白后仅允许 ASCII 字母；拒绝空记录、内部空白、数字或 FASTA 标题，并指出行号。保留顺序、重复值和大小写，生成 `>s1`、`>s2` 等确定性 FASTA 标题。标签仍需单独提供并与序列逐行对应。
- 同名文件优先级为 CSV > TSV > TXT，序列为 FASTA > TXT。高优先级文件失败不会回退；已有 CSV、FASTA 不被改写。

上传仅转换上述指定文件，保留原 TXT 并生成标准 CSV / FASTA，再执行既有任务校验。不会去重、排序、重新划分数据或生成标签；HLA-II 仍需配对表、标签和序列视图。此支持限于 Web 新上传，不扩展 CLI 或内置数据集读取。

发生 TXT 转换时，数据集 metadata 增加 `upload_conversion`：`version: 1`、`path_base: "archive_root"`，以及 `files` 列表。每项记录 `kind`（`table` / `sequences`）、`source`、`target`、`source_sha256`、`target_sha256`，表格另含 `delimiter`。路径相对于 ZIP 解压目录，包含可选包装目录；扁平布局的转换目标 CSV 保留在 `normalized/` 外，随后生成标准 split 文件。

## 1. sequence_dir — 单序列格式

用于 `pep_function` 任务。每个划分目录下包含一个 FASTA 序列文件和一个多标签 CSV。

### 目录结构

```
{root}/
  train/
    seqs.fasta        # FASTA 格式：>sample_id\nSEQUENCE
    labels.csv        # 多标签：首行为实际标签名表头，后续每行 0/1
  val/
    seqs.fasta
    labels.csv
  test/               # 可选
    seqs.fasta
    labels.csv
```

### seqs.fasta

标准 FASTA 格式，每条记录由 `>` 引导的样本 ID 行和紧随其后的肽段氨基酸序列组成：

```
>Train1
KLLSTGLVQNFPNTIISK
>Train2
GSCSCSGTISPYGLRTCRATKTKPSHPTTKETHPQTLPT
```

### labels.csv

- **首行**：表头，由数据集实际标签名组成；下方是两个合成标签的示例，逗号分隔：`label_a,label_b`
- **后续行**：每行对应一条 FASTA 记录，值为逗号分隔的 `0` / `1`，表示该样本是否属于对应类别（多标签，一条肽段可同时归属多个类别）

```csv
label_a,label_b
0,1
1,1
```

::: warning 数量一致
FASTA 记录数必须等于 `labels.csv` 的数据行数（即总行数减去 1 行表头），否则加载时报错。
:::

标签名称与含义由数据集提供，示例名称不代表生物学注释。

## 2. pair_split_dir — Pair 划分格式

用于 `pep_protein_interaction`、`pep_hlai`、`pep_hlaii` 三个 Pair 任务。每个划分目录下包含对定义、标签，以及可选的序列文件。

### 目录结构

```
{root}/
  train/
    pairs.csv         # Pair 定义
    labels.csv        # 二分类标签（0/1）
    seqs.fasta        # 可选；pep_hlaii 必需（require_sequence_view=True）
  val/
    pairs.csv
    labels.csv
    seqs.fasta
  test/               # 可选
    pairs.csv
    labels.csv
    seqs.fasta
```

### pairs.csv 列要求

`pairs.csv` 应使用下方列出的确切列名，**必须至少包含以下每组中的一列**：

| 组 | 可选列名 | 说明 |
| --- | --- | --- |
| 肽段列 | `peptide` 或 `pep` | 肽段序列 |
| 伴侣列 | `protein` 或 `hla` 或 `pair_pseudo` 或 `hla_pair` | 互作对侧序列或其编码 |
| 标签列 | `label` 或 `tgt` 或 `bind` | 二分类标签 0/1 |

可选列：`sample_id`、`combined_sequence`、`pair_pseudo` 等。

::: warning pep_hlaii 特殊要求
`pep_hlaii` 任务的 `pairs.csv` **必须包含** `peptide`、`pair_pseudo`、`label` 三列，可以包含其他辅助列；且因为 `require_sequence_view=True`，必须同时提供 `seqs.fasta`。
:::

### labels.csv（Pair 任务）

单列，表头为 `label`，值为 `0` 或 `1`：

```csv
label
0
1
```

### seqs.fasta（Pair 任务）

Pair 任务的 `seqs.fasta` 存放**合并序列**，拼接方式为：肽段 + `GGG` + 伴侣链（连接子 `CONCAT_LINKER = "GGG"`）。

- 若 `pairs.csv` 中存在 `combined_sequence` 列，则直接使用该列的值；
- 否则由 `peptide` 与伴侣列拼接生成。

```
>sample_1
YNPEYQDESVLWTESGGGYNFHERXFATVLHILYFAYTYYDVRTETVHLETT
```

### 各任务 pairs.csv 表头示例

以下序列和标签仅用于演示字段；它们不是生物学标注。研究或训练应使用有来源依据的实际序列、标签与等位基因映射。

**PPI（pep_protein_interaction）**

```csv
sample_id,label,peptide,protein
example_1,0,ACDEFGHIK,ACDEFGHIKLMNPQRSTVWY
example_2,1,LMNPQRSTV,LMNPQRSTVWYACDEFGHIK
```

**HLA-I（pep_hlai）**

```csv
hla,pep,tgt
HLA-C*05:01,PAKHQLHVWRA,0
HLA-B*52:01,ESVNAAFE,0
```

**HLA-II（pep_hlaii）**

```csv
peptide,pair_pseudo,label
ACDEFGHIK,ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMNPQRS,0
```

::: details HLA-II 列说明
- `hla_pair`：`alpha|beta` 形式的等位基因对标识
- `pair_pseudo`：HLA-II 异二聚体 34aa 伪序列（用于编码对侧），需自行保留所用伪序列映射的来源
- `combined_sequence`：肽段 + `GGG` + 伪序列的合并视图，供序列模型直接使用
:::

## 3. pair_root — legacy/raw 兼容格式

`pair_root` 用于兼容早期或原始 benchmark CSV 目录。当前 Web 平台展示的内置 Pair 数据集已经以 `pair_split_dir` 为主；遇到 `pair_root` 时，建议先用工具脚本或上传规范化流程转成 `pair_split_dir`，再用于预览和训练。

**PPI 原始文件：**

- `{root}/processed/train.csv`
- `{root}/processed/test_1440.csv`（验证集按 90/10 自动切分自 train）

**HLA-I 原始文件：**

- `{root}/processed/{train,val,test}.csv`
- 当前内置 HLA-I benchmark 已规范化为 `data_bigmhc_el_100k_original_split/{train,val,test}/pairs.csv`，需另行准备对应数据，发布包不附带这些文件。

## 4. pair_dir — 扁平上传打包格式

上传数据集时若采用扁平 CSV 打包，系统会自动规范化为 `pair_split_dir` 结构；训练和预览实际读取规范化后的 `normalized/{split}/` 目录。

```
{root}/
  train.csv
  val.csv
  test.csv            # 可选
```

规范化后写入：

```
{root}/normalized/
  train/
    pairs.csv
    labels.csv
    seqs.fasta
  val/
    pairs.csv
    labels.csv
    seqs.fasta
```

## HLA-I 特殊文件：pseudoseqs_decoded.csv

`pep_hlai` 数据集根目录下的 `pseudoseqs_decoded.csv` 提供 HLA-I 伪序列映射，用于通过伪序列编码解析 HLA-I 伴侣链序列。

**列定义：**

| 列 | 说明 |
| --- | --- |
| `hla` | HLA-I 等位基因名称，如 `HLA-C*05:01` |
| `pseudoseq` | 伪序列（含 `X` 占位的锚位编码序列） |
| `status` | 状态标记，空字符串或 `ok` 表示可用 |

```csv
hla,pseudoseq,status
HLA-A*02:01,ACDEFGHIKLMNPQRSTVWYACDEFGHIKLMN,ok
```

上方伪序列为合成格式示例，不是真实 HLA-A*02:01 映射，使用时应替换为有来源依据的映射。

::: tip 加载规则
仅 `status` 为空或 `ok` 的行会被加载为伪序列映射；其他状态（如缺失/异常）的行会被跳过。
:::

## 下一步

- 查看各格式对应的内置数据集：[内置数据集](./builtin)
- 准备并上传你自己的数据：[自定义数据集上传](./upload)
- 了解任务建模路线：[任务类型](../concepts/tasks)
