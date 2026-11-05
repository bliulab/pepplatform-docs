# 公开数据库：命令行获取与离线构建

新增工具在训练之前独立运行，生成现有 Web 上传功能接受的 ZIP。它不注册或替换内置数据集，不运行训练，也不更改已有论文数据与实验锁。运行环境为 Python 3.10+，仅依赖标准库。

当前支持 DBAASP → 功能肽活性子集、IntAct → 肽–蛋白直接互作、IEDB → HLA-I/HLA-II 结合实验。数据库有记录不等于能组成可靠训练集；缺少证据或任一划分缺少正负样本时，工具输出报告并拒绝发布 ZIP。

## 三步使用

先复制 `tools/public_dataset_recipes/` 中对应的 `.recipe` 文件。文件内容是 JSON，扩展名不影响解析。四份示例限定少量记录，用于检查连接与规则，**不代表现成 benchmark**，不能直接组成完整的训练/验证/测试集。

按研究目标修改查询、序列长度和标签定义。HLA 配方中的 `/path/to/...` 必须替换为本地伪序列映射路径。请自行准备对应任务的伪序列映射文件；映射、下载数据和训练数据均不随文档仓库提供。已有映射按只读资源使用，获取时复制到新快照。

```bash
python tools/public_datasets.py fetch \
  --recipe /path/to/my.recipe --out /path/outside/repository/snapshot-001

python tools/public_datasets.py build \
  --snapshot /path/outside/repository/snapshot-001 \
  --recipe /path/to/my.recipe --out /path/outside/repository/dataset-001

python tools/public_datasets.py verify \
  --dataset /path/outside/repository/dataset-001
```

成功后上传 `dataset-001/dataset.zip`，选择配方中的任务类型。也可让既有训练命令读取 `dataset-001/dataset/`。构建与验证不访问网络；退出码 0 表示成功，2 表示错误。失败后保留目录供检查，重试使用新目录。

所有输出必须位于 Git checkout 外，且不能位于名为 `datasets`、`experiment_paper` 或 `.pepplatform_web` 的目录内。工具拒绝覆盖已有目录。第一阶段没有新增 Web API 或界面。

## 配方与数据解释

公共字段：`version: 1`、`task`、`source`、`query`、`peptide_length: [最短, 最长]`。默认 `page_size: 100`、`max_records: 10000`、`split: {"seed": 42, "ratios": [80, 10, 10]}`。

`query` 的值均为字符串。分页、排序和字段投影由工具管理，不能在配方中覆盖。`max_records` 是完整下载的保护上限，不是抽样数；超限时快照为不完整，必须缩小查询或提高上限重新获取。工具检查重复记录 ID 和可用的总数信息，但不承诺远端数据库在整个下载期间提供事务级快照。离线复现依赖实际保存的响应。

| 来源 | 查询约定 | 标签及序列边界 |
| --- | --- | --- |
| DBAASP | `/peptides` 官方查询参数，例如 `id.value`；再获取每条详情 | 仅未修饰的线性单体肽；按实际 `targetSpecies.name`、MIC 和单位精确匹配 |
| IEDB | `mhc_search` 的 PostgREST 过滤，例如 `mhc_class: eq.I`、`mhc_allele_name: eq.HLA-A*02:01`；关联 `mhc_export` | 仅明确人类 HLA 等位基因、未修饰线性肽和配方指定的结合实验方法 |
| IntAct | 单个 `query` 字符串，例如 `EBI-4392836`；采用官方搜索接口 | 明确的 peptide/protein 类型、直接互作、明确实验结论；从内嵌 PSI-MI XML 获取对应序列 |

**功能肽**的 `labels` 每项必须包含 `name`、`target_species`、`measure: MIC`、`unit`、`positive_max` 和 `negative_min`。例子中的 8/64 µM 只是示例研究阈值，不是统一的生物学判据。MIC ≤ 正阈值标为 1，MIC ≥ 负阈值标为 0；中间区域不标注。区间和不等式只有在其全部可能值落入同一类别时才生成标签。不自动换算单位，不把数据库未标注功能作为阴性。选择多个标签时，仅保留各标签均可判定的记录；输出列数由配方决定，无须补齐原 benchmark 的 15 类。

**HLA**使用 `binding_methods` 中列出的精确 `assay__method` 值，同时检查响应为结合测量；排除 ligand presentation/elution。数据库的 Positive、Positive-Low、Positive-Intermediate、Positive-High 映射为 1，Negative 映射为 0。这是来源定性结论，不是统一亲和力阈值，也不等同于既有 EL benchmark 的目标。映射表需要 `hla,pseudoseq[,status]` 或 `hla_pair,pseudoseq`；I 类 30aa，II 类 34aa，可含原资源中的 X。仅精确匹配；DRB 的单 β 链命名按既有资源约定展开为 `DRA*01:01|DRB…`。不支持模糊等位基因或近邻替代。输出保留 `hla` 或 `hla_pair/hla_alpha/hla_beta`，供既有读取器保留原始身份。

**PPI**排除扩展复合物、突变、缺失明确序列和带 participant feature 的记录；后者可能涉及标签、融合、截短或修饰，需要人工核实。不会从全长蛋白任意截取片段，也不会根据共现生成阳性。当前优先使用 IntAct XML 自带的序列，不进行猜测性 UniProt 补全。严格筛选后可能没有足够阴性。

全部任务仅接受大写的 20 种标准氨基酸肽序列；不将可能代表 D-氨基酸的小写字符直接改成大写。相同样本的一致证据合并，冲突证据整组排除。HLA 样本以肽和原始等位基因身份去重，PPI 以肽和蛋白序列去重。

## 划分、重叠与补充标注

同一肽及其所有伙伴按 `SHA256(seed + ":" + peptide)` 整组分桶，默认目标比例 80/10/10。实际比例由数据决定，不反复换种子。每个划分、每个标签都必须有正负样本。报告明确：该规则消除精确肽重复跨划分，不保证同源肽或伙伴隔离。

如需精确重叠检查，通过 `resources.benchmarks` 显式提供同任务的参考索引 JSON；相对资源路径以配方所在目录为基准。获取时将该索引冻结到快照，离线构建只读取冻结副本。未提供索引时，重叠状态为 `not_available`，表示未进行参考数据检查。工具不会自动搜索源码 checkout 或读取其他参考数据集。

参考索引包含 `status: "checked"`、`task` 和 `files` 列表。每个文件记录说明用的 `path`、来源 `sha256`、肽序列哈希 `peptides` 和样本哈希 `samples`。肽身份使用 UTF-8 序列的 SHA-256；样本身份使用 `pepplatform.public_data.benchmarks.sample_key(task, peptide, partner_id)`，功能任务的 partner 为空字符串。索引提供者负责其来源身份；获取过程冻结索引字节，不重新打开索引所描述的参考文件。已有同任务索引可以继续使用。精确重叠检查不能证明同源性隔离或数据独立性。

可选的 `resources.supplements` 指向人工整理的实验标注 JSON 数组，每条必须包含：

```json
{
  "source_id": "local-assay-001",
  "task": "pep_protein_interaction",
  "peptide": "ACDEFGHIK",
  "protein": "ACDEFGHIKLMNPQRSTVWY",
  "labels": [0],
  "reference": "实际文献及实验位置",
  "evidence_type": "experimental",
  "unmodified": true,
  "label_definition": "direct_binding_positive=1,negative=0"
}
```

HLA 补充记录用 `partner_id` 指定原始等位基因，仍须精确匹配冻结映射。功能肽补充记录不需要伙伴，`label_definition` 必须与配方整个 `labels` 列表一致，`labels` 是同顺序 0/1 数组。所有补充记录明确标为 `user_experimental_supplement`；工具校验声明与一致性，不自动认证文献或人工标注真伪。未知值、预测标签及构造负样本不予接受。

## 溯源、验证与离线复现

快照保留响应原字节、请求 URL、时间、可用响应版本头、配方、辅助文件及 SHA-256。没有上游版本头时明确记录未提供，不编造数据库发布版本。失败快照的 `snapshot.json` 为 `complete: false`。

成功产物包含 `dataset.zip`、标准数据目录、`accepted.json`、`rejections.json`、`report.json`、`manifest.json` 和本次构建器源码 `builder/`。ZIP 内也包含配方、数据报告及逐样本溯源。上传后辅助文件随包保留；现有页面不会自动展示新增报告的所有字段，请直接查看 JSON。

同一快照、配方、构建器和 Python 版本产生相同数据文件与 ZIP。ZIP 使用固定条目时间及未压缩存储，避免压缩库版本造成差异。保存原始快照才能重建；仅记录查询不能保证未来远端返回相同数据。要改变配方或刷新数据库，生成新快照，不覆盖历史版本。

若软件已经升级，可以使用已保存构建器：

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/path/to/dataset-001 python -c \
  'from builder import build; build("/path/to/snapshot-001", "/path/to/my.recipe", "/path/to/rebuilt-001")'
```

使用清单记录的 Python 版本，并关闭字节码写入，避免向已封存的构建器目录添加缓存文件。`verify` 比较文件库存与哈希、样本身份、标签顺序、FASTA/Pair 对应、划分、报告和 ZIP 内容。哈希用于完整性检查，不代表上游实验结论已被平台独立验证，也不提供数字签名认证。

## Python 接口

Python 接口为 `pepplatform.public_data.fetch(recipe_path, out, benchmark_root=...)`、`build(snapshot, recipe_path, out)`、`verify(dataset_dir)`。

来源与使用约定见 [DBAASP API](https://www.dbaasp.org/api?page=rest)、[IEDB IQ-API](https://discuss.iedb.org/t/immune-epitope-database-query-api-iq-api/154)、[IntAct API](https://www.ebi.ac.uk/intact/ws/interaction/swagger-ui/index.html)。引用或分发数据时遵循各来源要求。
