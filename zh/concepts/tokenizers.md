# 分词器

分词器（Tokenizer）将氨基酸序列切分为 token 序列，是经典特征路线的第一步。平台提供 **7 种经典分词器**与 **5 种预训练分词器**。

::: info 数量的统计口径
这里的数字统计的是可用的 `--tokenizer` 取值：7 种经典分词器、5 种预训练分词器。各分词器可用的编码器不同，两组选项并非两两组合的笛卡尔积，详见[编码器](./encoders)。
:::

在平台实现契约中，Tokenizer 同时定义切分规则以及对应的词表或原生 token ID
空间。K-mer 等分词器可以先产生字符串 token，再通过自身词表映射为 ID；BPE、
WordPiece、Unigram 与预训练分词器可以直接产生底层 tokenizer 的原生 ID 或模型
输入。Encoder 在此契约之上决定最终使用 index、one-hot、计数或连续特征表示。

## 经典分词器

经典分词器通过 `--tokenizer` 参数选择，共 7 种：

| 分词器 | 说明 | 关键参数 |
| --- | --- | --- |
| `kmer` | k-mer 滑窗切分，将序列切为长度为 k 的重叠子串 | `--k`（默认 `2`，范围 `1–3`） |
| `dr` | Distance-based Residue（DR）：由 d0 单残基与定向 d-gap 残基对组成（[Liu et al., 2014](https://doi.org/10.1186/1471-2105-15-S2-S3)；[实现边界](./dr-appendix)） | `--dr_max_distance`（默认 `5`，范围 `0–200`）、`--dr_max_raw_length` |
| `top-n-gram` | 从 PSI-BLAST 目标频率谱逐位选取频率最高的 n 个氨基酸 | `--top_ngram_n`（默认 `2`，范围 `1–3`） |
| `dt` | Distance-based Top-n-gram：固定 Top-1，统计 d0 与定向 d-gap Top-1 对（[Liu et al., 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4015815/)；[实现附录](./dt-appendix)） | `--dt_max_distance`（默认 `5`，范围 `0–200`） |
| `bpe` | Byte-Pair Encoding 字节对编码，基于子词频率合并 | `--bpe_path`、`--bpe_vocab_size`（默认 `1000`） |
| `wordpiece` | WordPiece 子词分词，使用贪心最长匹配 | `--wordpiece_path`、`--wordpiece_vocab_size`、`--wordpiece_max_raw_length` |
| `unigram` | Unigram 语言模型分词；推理使用 Viterbi，训练可选可复现的在线采样 | `--unigram_path`、`--unigram_vocab_size`、`--unigram_sampling` |

::: warning Profile 依赖分词器
`top-n-gram` 与 `dt` 属于 profile 依赖分词器，两者都必须使用 PSI-BLAST
目标频率 manifest；旧 PSSM 分数缓存不能替代它。旧哈希 DT 工件必须重训。
:::

### BPE 算法与平台契约

平台可继续将该路线命名为 `bpe`。其内部变体标识为
`protein_byte_level_bpe`：训练从单字符蛋白质字母表出发，反复统计并合并
语料中最高频的相邻 token 对，推理时按已学习的 merge 顺序确定性切分。这与
BPE 的核心算法思想一致；`ByteLevel(add_prefix_space=False)`、蛋白质字母表
和固定特殊 token 是面向本平台输入与模型接口的工程约束。

输入首先移除所有空白并转为大写，只接受
`ACDEFGHIKLMNPQRSTVWYXBZJUO`。空序列或其他字符会明确报错，不会静默映射。
特殊 token ID 固定为 `<PAD>=0`、`<UNK>=1`、`<CLS>=2`、`<SEP>=3`、
`<MASK>=4`，以满足编码器和预测模型对 padding 的约定。加载时会严格检查
JSON 的 `model.type=BPE`、ByteLevel 配置、特殊 ID、字母表、dropout 和
CLS/SEP 后处理；WordPiece、损坏或不兼容的 JSON 不会被当作 BPE 接受。

WordPiece 的 `max_input_chars_per_word=100` **不适用于 BPE**。BPE 模型没有
这个参数，因此超过 100 个残基的蛋白质不会仅因长度而整体变成 `<UNK>`。
需要区分的是 `max_length`：它限制送入预测模型的最终 token 数，并包含
`<CLS>` 与 `<SEP>`；超出时会保留边界 token 并截断中间内容。若任务需要覆盖
更长蛋白质，应提高训练与推理一致使用的 `max_length`，而不是为 BPE 设置
WordPiece 参数。

`--bpe_path` 是训练集专用的托管缓存位置。缓存 provenance 会记录规范化语料
的有序摘要（保留重复）、词表配置、契约版本、`tokenizers` 版本和产物
SHA-256；任一项变化、文件损坏或旧缓存缺少 provenance 都会从训练集重建。
导出的新模型 bundle 会将 tokenizer 与 provenance 复制到 `tokenizers/`
目录，推理时校验 bundle 内相对路径和摘要，因此不依赖原训练机器上的绝对
路径。运行时固定使用 `tokenizers==0.21.4`。

### 标准 K-mer 的实现边界

`kmer` 使用连续、重叠、步长为 1 的滑动窗口。例如，`ACDE` 在 `k=2`
时得到 `AC`、`CD`、`DE`。标准 K-mer 的 `k` 只允许整数 `1–3`；平台会
全量建立 `26^k + 2` 个词条（额外两个词条为 PAD 和 UNK），因此 `k=3`
时词表大小为 17,578。

`max_length` 表示**最多保留的 K-mer token 数**，不是 `k`，也不是原始
残基数。先生成 K-mer，再按 `max_length` 截断；步长为 1 时，`M` 个
K-mer 最多覆盖 `M + k - 1` 个残基。

上述截断只适用于 `index`、`onehot`、`textrank` 等既有保序/图排序路径。
BoW 与 TF-IDF 会读取完整 K-mer 流。频率路线的原始序列安全限制由
`--frequency_max_raw_length` 单独控制，默认 50,000、硬上限 100,000。

该实现是 K-mer 分词器，不实现 spectrum kernel 的计数向量、内积或 SVM
分类部分。蛋白质序列中重叠 K-mer 表示的经典参考为：

> Leslie, C., Eskin, E., & Noble, W. S. (2002). The spectrum kernel: A string
> kernel for SVM protein classification. *Pacific Symposium on Biocomputing*,
> 564–575. https://doi.org/10.1142/9789812799623_0053

### Top-n-gram 的算法与契约

平台可以继续将该路线命名为 `top-n-gram`。它实现 Liu 等人 2008 年论文
定义的核心表示：先由 PSI-BLAST 多序列比对得到每个残基位置上 20 种标准
氨基酸的目标频率；再按频率降序取前 n 个氨基酸，并按名次连接为该位置的
Top-n-gram。例如某一位置的前三名为 D、P、R，则 `n=3` 时 token 为
`DPR`。每条长度为 L 的序列产生 L 个 token，完整特征空间严格为
`20^n`；`bow` 输出各 token 的原始出现次数。因此 `n=1/2/3` 时维数分别为
20、400、8000。

目标频率从 PSI-BLAST ASN.1 checkpoint 的 `freqRatios` 字段恢复，而不是
对 ASCII PSSM 中的整数 log-odds 分数排序。虽然字段沿用该历史名称，NCBI
实现写入的是计算真正 Q/P 比值之前的目标频率分子 Q；Top-n-gram 直接读取
并逐行归一化这些值，不会再次乘以背景频率。相同频率按固定氨基酸顺序
`ARNDCQEGHILKMFPSTWYV` 决胜，以保证跨运行确定性；这是论文未指定细节上的
工程约定，不改变 Top-n-gram 的定义。

`bow` 是与原论文直接对应的计数表示。`tfidf` 使用训练集拟合并随模型保存
IDF，`textrank` 在完整 token 流上计算图权重；二者是平台扩展，不应表述为
原论文的 SVM + LSA 实验复现。平台也不声称复现论文使用的序列数据库、
PSI-BLAST 版本、Gist SVM 或 LSA 超参数。平台使用自身记录的参考库与 PSI-BLAST 配置；这里不主张复现论文的实验结果。

生成的 profile 不截断也不补齐。训练时平台会统计当前数据集的原始序列长度，并将
Top-n-gram 的有效 `max_length` 解析为用户配置值与数据集实际最大值中的较大者；
自动提升会记录在 Preflight 与训练日志中。部署级安全上限由
`PEP_TOP_NGRAM_MAX_RESIDUES` 控制，默认 10000；超过该值只会阻止
Top-n-gram profile 生成，不影响数据集用于其他算法。保序、TextRank 与旧工件
推理仍以保存的有效 `max_length` 为硬上限；BoW/TF-IDF 加载完整 profile，
改由 `frequency_max_raw_length` 校验（Web 端在线生成 profile 时仍可能先受到
更严格的 profile 生成上限约束）。训练集构建的 PSI-BLAST 库仅来自
train split，并排除与查询序列完全相同的训练 subject。只要 PSI-BLAST 产出
合法目标频率 checkpoint，就保留该结果；没有非自身命中时会发出质量警告。
manifest 绑定序列长度、序列 SHA-256、矩阵 SHA-256、氨基酸顺序、排序策略、
profile 来源、fallback 原因与生成 provenance；矩阵使用禁止 pickle 的 NPZ
读取。旧缓存和旧模型缺少这些 profile 契约，必须重新生成 profile 并重新训练。

#### 附录：无可用目标频率时的 BLOSUM62 先验

PSI-BLAST 正常退出但没有创建 checkpoint，或 checkpoint 中存在和为零的目标
频率行时，平台默认使用明确标记的
`blosum62_target_frequency_v1` 扩展。对查询残基 `r`，20 种标准氨基酸
`a` 的先验定义为：

`Q(a | r) ∝ P_bg(a) × 2^(BLOSUM62(r,a) / 2)`

其中 `P_bg` 是固定的 BLOSUM62 背景概率，归一化后每行和为 1；非标准残基使用
背景概率本身。该矩阵不是 PSI-BLAST 结果，也不是论文原始算法的一部分，而是
平台为 train-only 小数据集和用户上传数据提供的显式工程扩展。manifest 中每个
样本都会记录 `profile_source=blosum62_substitution_prior`、
`fallback=true` 和 `fallback_reason`，整体 provenance 则记录
`fallback_policy=blosum62_target_frequency_v1`，因此训练、缓存和推理都能
识别其来源。

只有 PSI-BLAST 正常完成却无法提供目标频率时才允许此 fallback。进程超时、
非零退出、损坏或格式不合法的 ASN.1 等仍是硬错误，不会被先验掩盖。需要严格
复现时可显式设置 `profile_on_missing=error`，此时缺少可用 checkpoint 会直接
终止实验；one-hot、普通 `blosum62` 打分矩阵和零矩阵仍不允许用于
Top-n-gram。

原始算法参考：

> Liu, B., Wang, X., Lin, L., Dong, Q., & Wang, X. (2008). A discriminative
> method for protein remote homology detection and fold recognition combining
> Top-n-grams and latent semantic analysis. *BMC Bioinformatics*, 9, 510.
> https://doi.org/10.1186/1471-2105-9-510

### DT 的算法边界

平台可将该路线称为 `dt`，全称为 Distance-based Top-n-gram。它固定使用
Top-1 目标频率序列，包含 d0，并以精确 (20+400D) 维统计定向距离对，
不存在哈希空间或碰撞。BoW 是论文原始计数；TF-IDF 和 TextRank 是明确标注的
平台扩展。完整公式、`KFFK` 金样例以及工件兼容
规则见 [DT 实现附录](./dt-appendix)。

### Protein Unigram 与 subword regularization

`unigram` 使用 Hugging Face `UnigramTrainer` 完成 Kudo Unigram LM 的候选
子串生成、EM 概率估计和基于损失的迭代剪枝；平台推理固定使用 Viterbi
one-best。`<UNK>` 由 trainer 显式绑定，特殊 token ID 固定为
`<PAD>=0`、`<UNK>=1`、`<CLS>=2`、`<SEP>=3`、`<MASK>=4`。

输入去除空白并转为大写，只接受
`ACDEFGHIKLMNPQRSTVWYXBZJUO`。训练只读取 train split 中解析后的 FASTA
序列，不会读取 header 或 validation。产物使用固定词表顺序、稳定化 score、
严格 provenance 和原子双文件提交；旧的 `unk_id=null`、缺少 provenance 或
摘要不一致的模型会强制重建。

`--unigram_sampling` 默认关闭。显式开启时，神经网络训练按
`--unigram_nbest_size=64`、`--unigram_alpha=0.1` 从有限 n-best lattice
在线采样；seed 由全局 seed、epoch、样本 ID、序列角色和序列摘要派生，因此
不依赖 DataLoader worker 或访问顺序。validation、test、模型导出和线上推理
始终使用 Viterbi。直接的经典分类器不支持该在线正则化。

原始算法参考：

> Kudo, T. (2018). Subword Regularization: Improving Neural Network
> Translation Models with Multiple Subword Candidates. *ACL 2018*.
> https://aclanthology.org/P18-1007/

### Protein WordPiece 的实现边界

`wordpiece` 使用 Hugging Face `tokenizers==0.21.4` 训练 WordPiece 词表，
运行时按 `##` continuation 词表执行贪心最长匹配。Hugging Face 的
`WordPieceTrainer` 内部以 BPE trainer 构建词表，因此平台将其表述为
**BPE-based vocabulary training + WordPiece longest-match tokenization**，
不声称严格复现未公开的原始 WordPiece 训练实现。
训练产物记录训练集摘要、运行库版本和 SHA-256；并复用或随模型打包该
确切产物，因为底层 trainer 对同分候选使用其内部顺序，不承诺重新训练后
逐字节相同。

输入会去除空白并转为大写，`B/Z/J/U/O` 映射为 `X`；规范化后只允许标准
20 种氨基酸和 `X`。`max_length` 表示最终 token 数并包含 `<CLS>` 与
`<SEP>`，所以内容预算为 `max_length - 2`。原始残基长度由
`wordpiece_max_raw_length` 单独限制，默认 50,000；平台绝对上限为
100,000，超过限制时明确报错，不会退化为整条 `<UNK>`。

WordPiece 最初见于：

> Schuster, M., & Nakajima, K. (2012). Japanese and Korean Voice Search.
> *ICASSP 2012*, 5149–5152.
> https://doi.org/10.1109/ICASSP.2012.6289079

## 预训练分词器

预训练分词器与对应的预训练编码器捆绑使用，不可单独选择编码器。共 5 种：

| 分词器 ID | 默认模型 | 说明 |
| --- | --- | --- |
| `esm2` | `facebook/esm2_t30_150M_UR50D` | Evolutionary Scale Modeling 2 |
| `protbert` | `Rostlab/prot_bert` | ProtBERT，蛋白质领域 BERT |
| `prott5` | `Rostlab/prot_t5_xl_uniref50` | ProtT5，蛋白质领域 T5 |
| `esmc` | `EvolutionaryScale/esmc-600m-2024-12` | 官方 ESM-C 300M/600M（960/1152 维） |
| `esm3` | `EvolutionaryScale/esm3-sm-open-v1` | ESM3 |

选择预训练分词器即进入[预训练模型路线](./routes)，引导流程为：

1. `Choose feature extraction`
2. `Choose pretrained model`
3. `Choose classifier`

### ESM-C checkpoint 契约

`esmc` 可选择 EvolutionaryScale 官方 `esmc-300m-2024-12` 或
`esmc-600m-2024-12`，默认使用 600M。运行时固定为
`esm==3.2.0`，关闭 Flash Attention，
并对去除 BOS、EOS、PAD 后的残基表示做均值池化。官方权重文件为
`data/weights/esmc_600m_2024_12_v0.pth`，SHA256 必须为
`8ef856e1a237ee3f995442df997a962e70057faadecf38fc0c8561bd3c2f4324`。
`esm` Python 包与模型权重缓存相互独立；版本不符时无需删除权重目录，执行
`python -m pip install --no-cache-dir 'esm==3.2.0'` 即可。训练日志中的
`[esmc-provenance]` 记录和模型产物 `metadata.json` 会保存精确运行时版本、
设备信息、snapshot revision 与权重摘要，供实验复现和推理校验使用。

在线模式会在首次使用时自动下载所选官方 checkpoint；离线镜像分别放在
`models/EvolutionaryScale/esmc-300m-2024-12` 或
`models/EvolutionaryScale/esmc-600m-2024-12`，缺失权重会失败关闭。下载和使用时
需遵守官方 Hugging Face 模型卡中的许可条款。旧的 ESM++ 路线仍可通过
`--esmc_model Synthyra/ESMplusplus_small` 显式启用，其产物会标记为
`ESM++ 300M`，不会标记为官方 ESM-C。

## 关键参数速查

| 参数 | 默认值 | 适用分词器 | 说明 |
| --- | --- | --- | --- |
| `--k` | `2` | `kmer` | 窗口长度；仅允许 `1–3` |
| `--dr_max_distance` | `5` | `dr` | 最大残基间距；整数范围 `0–200` |
| `--dr_max_raw_length` | `50000` | `dr` | 原始残基长度上限；平台绝对上限为 `100000` |
| `--dr_dense_memory_limit_gib` | `4.0` | `dr` | 稠密 DR 特征的预分配内存预算（GiB） |
| `--top_ngram_n` | `2` | `top-n-gram` | 每个位置选取的氨基酸数；仅允许 `1–3` |
| `--frequency_profile_index_path` | `''` | `top-n-gram`, `dt` | 目标频率 profile manifest；不可使用旧 PSSM index |
| `--profile_on_missing` | `blosum62_target_frequency` | `top-n-gram`, `dt` | 缺少可用目标频率时使用显式 BLOSUM62 先验；可设为 `error` 启用严格模式 |
| `--topngram_dense_memory_limit_gib` | `4.0` | `top-n-gram` | 稠密 Top-n-gram 特征的预分配内存预算（GiB） |
| `--dt_max_distance` | `5` | `dt` | 最大 Top-1 对距离；整数范围 `0–200` |
| `--dt_dense_memory_limit_gib` | `4.0` | `dt` | 精确 `20 + 400*dMAX` 维稠密特征的预分配内存预算（GiB） |
| `--bpe_path` | `''` | `bpe` | 训练集 BPE 托管缓存路径 |
| `--bpe_vocab_size` | `1000` | `bpe` | BPE 词表大小 |
| `--unigram_path` | `''` | `unigram` | Unigram 模型路径 |
| `--unigram_vocab_size` | `1000` | `unigram` | Unigram 训练目标词表大小 |
| `--unigram_sampling` | `false` | `unigram` | 仅在神经网络 train split 启用在线采样 |
| `--unigram_nbest_size` | `64` | `unigram` | 采样候选切分数，范围 `2–256` |
| `--unigram_alpha` | `0.1` | `unigram` | 切分概率平滑/逆温度参数 |
| `--unigram_max_raw_length` | `50000` | `unigram` | 原始残基长度上限；平台绝对上限为 `100000` |
| `--wordpiece_path` | `''` | `wordpiece` | WordPiece 词表路径 |
| `--wordpiece_vocab_size` | `1000` | `wordpiece` | WordPiece 训练目标词表大小 |
| `--wordpiece_max_raw_length` | `50000` | `wordpiece` | 原始残基长度上限；平台绝对上限为 `100000` |

## 分词器与编码器的搭配

分词器决定了可用的编码器集合。详见 [编码器](./encoders#编码器与分词器的兼容性)。

::: tip 选择建议
- **通用基线**：`kmer` 可连接多类编码器，但不能任意组合：profile、AC/CC/ACC、PDT 等路线要求 `k=1`；具体范围以编码器契约和 Preflight 为准。
- **子词语义**：`bpe` / `wordpiece` / `unigram` 适合捕捉子词模式，但仅支持 `index` 编码。
- **频次特征**：`bow` / `TF-IDF` 系编码器可搭配 `kmer`、`dr`、`top-n-gram` 或 `dt`。
- **预训练表示**：资源条件满足时，可选择相应预训练分词器与编码器（如 `esm2`）；不保证任务性能更优。
:::
