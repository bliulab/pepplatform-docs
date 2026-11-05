# 编码器

编码器（Encoder）是平台将分词后的序列转换为数值输入的统称。K-mer 经典特征路线当前提供 23 种编码器选项（`--encoder` 参数），按是否保留序列顺序分为**保序编码器**与**全局编码器**两大类。

::: info 数量的统计口径
这个数字统计的是 K-mer 路线上每一个可接受的 `--encoder` 取值。每个 BLOSUM62 兜底变体（`pssm_blosum62_hybrid`、`psfm_blosum62_hybrid`、`ac_pssm_blosum62_hybrid`、`cc_pssm_blosum62_hybrid`、`acc_pssm_blosum62_hybrid`）都可单独指定，因此单独计数；若按特征族口径把兜底变体归入各自的 PSI-BLAST 父项，总数会更小。另外，其他分词器只支持其中子集，分词器数量与编码器数量并非两两组合的关系。详见[分词器](./tokenizers)。
:::

Encoder 不复制 Tokenizer 的词表。以 `index` 为例，字符串 token 的 ID 查表由
Tokenizer 提供，`IndexEncoder` 调用该映射并构造最终 tensor；对于已产生原生 ID
的分词器，它直接规范化长度并构造 tensor。这样 Tokenizer 决定 token 空间，
Encoder 决定表示形式。

::: warning 已删除 Property
`property`、`physchem` 和 `physicochemical(property)` 已从训练与推理中删除。
旧 Property 模型必须改用其他编码器重新训练；平台仍在 AC/CC/ACC 与 PDT 内部
分别使用受契约约束的理化属性表，但不再将其公开为独立编码器。
:::

## 编码器分类

| 类别 | 含义 | 下游衔接 |
| --- | --- | --- |
| 保序编码器（Sequence-preserving） | 保留有序的逐位置结构 | 序列模型（CNN/RNN/GRU/LSTM/Transformer） |
| 全局编码器（Global） | 将序列压缩为一个向量 | 经典分类器，可选经[特征变换](./feature-transforms) |

### 保序编码器

| 编码器 | 说明 |
| --- | --- |
| `index` | 将每个 token 映射为其在词表中的整数索引，最基础的离散编码 |
| `onehot` | 将每个 token 编码为 one-hot 向量，保留逐位置结构 |
| `blosum62` | `k=1` 为标准 BLOSUM62 half-bit log-odds 替换分数行；`k>1` 为明确标记的 BLOSUM62-derived 行均值扩展 |
| `pssm` | Position-Specific Scoring Matrix，基于序列profile 的逐位置打分，依赖 PSI-BLAST |
| `pssm_blosum62_hybrid` | 显式混合特征：优先使用 PSI-BLAST PSSM，仅在搜索成功、零非自身命中且未产生 PSSM 时使用 BLOSUM62 分数行 |
| `psfm` | Position-Specific Frequency Matrix，逐位置频率矩阵，依赖序列 profile |
| `psfm_blosum62_hybrid` | 显式混合特征：优先使用 PSI-BLAST weighted-observed PSFM；仅在搜索成功、零非自身命中且未同时产生必需的 checkpoint/ASCII PSFM 输出时使用 BLOSUM62-derived target-frequency profile |
| `word2vec` | 基于 word2vec 训练的静态 token 嵌入，逐位置保留序列顺序 |
| `glove` | 标准 GloVe 加权最小二乘目标训练的静态 token 嵌入 |
| `fasttext` | 基于 fastText 的静态 token 嵌入，支持子词信息 |

#### Index 与 One-hot 契约

`index` 是 token ID 接口，不是连续数值特征。它输出形状为 `[L]` 的定长
`torch.long` 张量：ID `0` 表示右侧 padding，未知 token 使用 Tokenizer 提供的
非零 `<UNK>` ID。原始 ID 只能进入首先学习 embedding 的序列预测器
（CNN/RNN/GRU/LSTM/Transformer），或者在该预测器学得 embedding 后再导出。
平台拒绝将原始 ID 展平后直接送入经典分类器、双流向量融合或样本图，因为词表
ID 的大小和间距没有语义。

`onehot` 输出形状为 `[L,V]` 的 `torch.float32` 张量。每个真实 token（包括
`<UNK>`）恰好激活一个词表维度，padding 行全为零。两种编码都会截断到 `L`、
对较短 token 流执行右侧补齐，并拒绝非法或超出词表范围的 ID。

这两者是通用的类别编码原语，而不是某篇论文特有的算法，因此平台直接记录其
数学定义和张量契约，不人为指定所谓“原始论文”。引用应归属于定义词表的
Tokenizer，以及消费该编码的模型或特征方法。

### 全局编码器

| 编码器 | 说明 |
| --- | --- |
| `bow` | Bag-of-Words，统计 token 频次得到一个全局向量 |
| `TF-IDF` | 词频-逆文档频率加权的全局向量；`tfidf` 为同义别名 |
| `textrank` | 基于 TextRank 关键性得分加权的全局向量 |
| `ac` | Auto Covariance 自协方差编码，以 `--ac_lag` 控制滞后阶数 |
| `cc` | Cross Covariance 交叉协方差编码，以 `--cc_lag` 控制滞后阶数 |
| `acc` | Auto-Cross Covariance 自交叉协方差编码，以 `--acc_lag` 控制滞后阶数 |
| `pdt` | Physicochemical Distance Transformation（531 个 AAIndex1 属性、完整原始序列），以 `--pdt_lag` 控制滞后阶数 |
| `ac_pssm` | 严格 PSSM 自协方差编码，以 `--ac_pssm_lag` 控制滞后阶数 |
| `cc_pssm` | 严格 PSSM 有向交叉协方差编码，以 `--cc_pssm_lag` 控制滞后阶数 |
| `acc_pssm` | 严格 PSSM 自交叉协方差编码，以 `--acc_pssm_lag` 控制滞后阶数 |
| `ac_pssm_blosum62_hybrid` | AC-PSSM–BLOSUM62 Hybrid，使用独立 profile cache 和 lag 参数 |
| `cc_pssm_blosum62_hybrid` | CC-PSSM–BLOSUM62 Hybrid，使用独立 profile cache 和 lag 参数 |
| `acc_pssm_blosum62_hybrid` | ACC-PSSM–BLOSUM62 Hybrid，使用独立 profile cache 和 lag 参数 |

### PDT 契约

公开 `pdt` 对应 Liu 等人 2012 年提出的 **Physicochemical Distance
Transformation**（DOI `10.1371/journal.pone.0046633`）。它使用论文补充材料
中的 531 个完整 AAIndex1 指标；每个指标先在 20 种标准氨基酸上按总体标准差
标准化，再对每个 lag 计算归一化属性差的平方均值。特征按 AAIndex 属性优先、
lag 递增排列，维度为 `531 * pdt_lag`。

该编码器只接受 `tokenizer=kmer, k=1`，读取完整原始序列且不受
`max_length` 截断。空序列、非标准残基、`sequence_length <= pdt_lag` 和超过
`pdt_max_raw_length` 的输入会明确报错。论文中的 profile-based PDT 是依赖
PSI-BLAST frequency profile 的另一变体，当前 `pdt` 不冒充该变体。旧 PDT
artifact 不具备该科学契约，必须重新训练。
完整公式、数据来源与 artifact 字段见 [PDT 科学契约](./pdt-contract)。

### AC-PSSM / CC-PSSM / ACC-PSSM 契约

六个 PSSM covariance encoder 都读取完整 `[L,20]` score profile，按列减去
完整序列均值，并以 `L-d` 为距离 `d` 的分母。AC 每个 lag 输出 20 维；CC 按
`source -> target` 排列 380 个有向、非对角特征；ACC 在每个 lag 中依次拼接
20 维 AC 和 380 维 CC。计算要求 `L > lag`，不受 `max_length` 截断影响。

严格三种 encoder 只接受 PSI-BLAST PSSM。三个带
`_blosum62_hybrid` 后缀的 encoder 在 PSI-BLAST 正常完成、零非自身命中且未输出
PSSM 时改用原始 BLOSUM62 score rows，再执行相同公式。每个 hybrid encoder
使用自己的 feature type、cache、manifest、index path、lag key 和显式 hybrid
特征名；它们不读取通用 `pssm_index_path`，也不复用
相关 profile 输入与 Hybrid 边界见下方的 Profile 依赖编码器说明。

### AC / CC / ACC Guo-7 契约与引用边界

公开名称 `ac`、`cc`、`acc` 分别表示 **Auto Covariance**、**Cross
Covariance** 和 **Auto-Cross Covariance**，不是 Correlation。三者只接受
`tokenizer=kmer, k=1`，直接读取完整原始残基序列，不受保序路线的
`max_length` 截断影响。`--covariance_max_raw_length` 默认和硬上限均为
`100000`；输入会去除首尾空白并转大写，但空序列、内部空白、非标准 20 种
氨基酸、超过上限以及 `sequence_length <= lag` 都会明确报错，不补零。

属性固定为 Guo 等人 2008 Supplementary Table S1 的七列，顺序为
`H1, H2, V, P1, P2, SASA, NCI`。每一列先在 20 种标准氨基酸上以 float64
执行总体标准化（`ddof=0`），且不提前舍入：

`Z[a,j] = (P[a,j] - mean_20AA[j]) / population_sd_20AA[j]`

对长度为 `n` 的完整序列，再减去该序列每个属性的均值。对距离 `d`：

`AC(d,j) = 1/(n-d) × Σ_i (Z[i,j]-mean_seq[j]) × (Z[i+d,j]-mean_seq[j])`

`CC(d,j,k) = 1/(n-d) × Σ_i (Z[i,j]-mean_seq[j]) × (Z[i+d,k]-mean_seq[k]), j != k`

CC 是有向量：`j at i -> k at i+d` 与反方向是两个特征。输出以 lag 为主序；
AC 每个 lag 按七属性排列，CC 每个 lag 按 source 属性、target 属性排列并跳过
对角线。因此 lag 为 `L` 时，AC、CC、ACC 的维度分别为 `7L`、`42L`、
`49L`；ACC 严格等于完整 AC 块与完整 CC 块的拼接。内部计算为 float64，最终
tensor 为 float32，并提供稳定 feature names。

方法谱系应引用 [Wold 等人 (1993)](https://doi.org/10.1016/0003-2670(93)80437-P)
提出的 ACC 思想，以及 [Sjöström 等人 (1995)](https://doi.org/10.1016/0169-7439(95)80104-H)
的早期蛋白序列应用。平台七属性和序列 AC 公式直接依据
[Guo 等人 (2008)](https://doi.org/10.1093/nar/gkn159)。Guo 2008 的实验实际
使用的是 AC；本平台的 CC/ACC 是把 Wold 的有向 ACC 分解一致应用于 Guo-7
通道，不能写成 Guo 实验直接评估过 CC/ACC。Guo 实验使用 lag 30，而平台默认
lag 是 10；只有显式设置为 30 才能声称复现该参数。

[BioSeq-BLM (2021)](https://doi.org/10.1093/nar/gkab829) 只能作为后续平台实现
对照，不能称作 AC/CC/ACC 的原创来源。导出工件保存公式、属性顺序及原始/
标准化表摘要、lag、方向、完整序列策略、长度上限和输出维度；旧 AC/CC/ACC
工件缺少该契约或契约被篡改时，推理以 `covariance_contract_unsupported`
拒绝并要求重训。

### BoW / TF-IDF 契约与引用边界

平台可以继续使用公开名称 `bow` 与 `tfidf`。它们描述的是通用表示族，而不是
某一篇论文中唯一、不可变的算法。
[Harris (1954)](https://doi.org/10.1080/00437956.1954.11659520)
适合作为分布式语言思想的历史来源，但平台不把它表述为“BoW 原始算法论文”。IDF 的文献来源引用
[Spärck Jones (1972)](https://doi.org/10.1108/eb026526)，TF 与 IDF 的乘积加权
引用 [Salton & Yang (1973)](https://doi.org/10.1108/eb026562)。将这类词频表示
迁移到生物序列的背景可引用
[BioSeq-BLM](https://doi.org/10.1093/nar/gkab829)。这些引用说明思想谱系；
平台下面的平滑、词表和工件规则以本实现契约为准。

对 `kmer`、`dr`、`top-n-gram`、`dt` 四种
Tokenizer，全局频率编码读取**完整 token 流**，不受保序模型的
`max_length` 截断影响。PAD 不参与统计，UNK 作为真实词表项计数。令文档中
第 j 个 token 的出现次数为 `c_j`：

- BoW：`x_j = c_j`，输出原始次数，不执行 L1/L2 后归一化。
- TF：`tf_j = c_j / Σ_k c_k`；没有 token 的合法短序列输出全零向量。
- IDF：仅在训练集拟合，`idf_j = ln((N+1)/(df_j+1)) + 1`。
- TF-IDF：`x_j = tf_j × idf_j`，乘积后不再做 L1/L2 归一化。

`N` 包含训练集中的零-token 文档，因此它们会影响 IDF 分母，但自身仍编码为
零向量。TF-IDF 构造时必须且只能提供非空训练文档或已持久化 IDF 之一；平台
不再用全 1 向量静默代替缺失状态。单序列任务只拟合 train split；同构 pair
把 train 中两种角色合为一个语料，异构双流则按角色分别拟合，validation/test
均不参与。

`--frequency_max_raw_length` 默认 `50000`，平台硬上限 `100000`；超过配置值
会明确报错。导出工件记录频率编码公式、完整流策略、特征维度、词表摘要、训练文档
数、训练语料摘要和拟合范围。IDF tensor 使用 bundle 相对路径，并记录
SHA-256、dtype 与 shape；推理会拒绝缺失、篡改、路径越界或维度不符的状态。
缺少当前频率编码元数据的旧工件按历史语义加载：通用 K-mer 系 BoW 保留旧有截断和
L1 归一化，旧 TF-IDF 保留截断后的相对 TF；DR/Top-n-gram/DT 保留各自原有
完整流语义。旧 TF-IDF 只有在自带完整 IDF 时才能推理，否则必须重训。

### Weighted TextRank 契约与引用边界

`textrank` 的迭代核严格采用
[Mihalcea 与 Tarau (2004), Section 2.2](https://aclanthology.org/W04-3252/) 的
weighted TextRank。平台构造无向加权 token 图；宽度为 2 的滑动窗口包含两个
token，因此只连接相邻位置。边权 `w_ij` 是两个不同 token 的位置共现次数，
自环忽略，PAD 不进入图，UNK 作为普通有效节点。所有节点原始分数初始化为
1.0，并以 float64、同步更新执行：

`S(V_i) = (1-d) + d × Σ_{V_j∈In(V_i)} [w_ji / Σ_{V_k∈Out(V_j)} w_jk] × S(V_j)`

其中 `d=0.85`。每轮只读取上一轮的**未归一化原始分数**；当最大节点绝对变化
小于 `1e-4` 时收敛。10,000 轮仍未收敛会报错，不返回部分结果。只有原始分数
收敛并写入稠密词表向量后，才执行一次 L1 归一化并转为 float32；迭代过程中
绝不归一化。

四条路由的图节点来自各自明确的 token 流：`kmer` 使用 Tokenizer 输出的截断
流；`dr` 使用完整规范化序列产生的源位置优先 DR 流；`top-n-gram` 使用完整
profile 残基流；`dt` 使用完整源位置优先 DT 流。模型工件保存上述算法与词流
契约；缺失或不匹配契约的旧 TextRank 工件必须重训。

论文主表可将该方法称为 **TextRank**，方法部分应写 **weighted TextRank**，
并说明蛋白 token 图和收敛后 L1 规则。该命名表示遵从原论文的通用 weighted
TextRank 模型，不表示复现其 Section 3.1 中基于英文 POS 过滤的无权关键词抽取
实验。

## Profile 依赖编码器

以下编码器依赖序列 profile（通过 PSI-BLAST 生成）：

`pssm`、`pssm_blosum62_hybrid`、`psfm`、`psfm_blosum62_hybrid`、`ac_pssm`、`cc_pssm`、`acc_pssm`、
`ac_pssm_blosum62_hybrid`、`cc_pssm_blosum62_hybrid`、
`acc_pssm_blosum62_hybrid`

::: warning Profile 依赖路由
这些路由需要样本特异的 profile。训练与 Web 按需推理必须具备本地
NCBI BLAST+ 和由 Train 冻结的 subject FASTA；或者使用已经通过 profile manifest
校验的 profile 索引。旧的扁平 JSON/`.pt` 缓存不能继续使用。
:::

### 科学命名与引用边界

`blosum62` 的 20×20 核心矩阵逐项采用标准 BLOSUM62，列顺序固定为
`ARNDCQEGHILKMFPSTWYV`，数值单位为 half-bit log-odds score。B/Z/X 使用
标准扩展行，J/U/O 映射到 X，非字母字符报错。对 `k=1`，称为
“BLOSUM62 score encoding”并引用
[Henikoff & Henikoff (1992)](https://doi.org/10.1073/pnas.89.22.10915)
是准确的；对 `k>1`，平台取 k-mer 内各残基分数行的算术平均，这必须写成
“PepPlatform 的 BLOSUM62-derived mean aggregation”，不能归因于原论文。

`pssm` 是 NCBI PSI-BLAST 最后一轮 ASCII PSSM 中的逐位置整数分数，因而可以
称为“PSI-BLAST PSSM”。思想谱系引用
[Altschul et al. (1997)](https://doi.org/10.1093/nar/25.17.3389)；由于平台运行
现代 BLAST+，固定启用组成校正等后续实现参数，还应引用
[Schäffer et al. (2001)](https://doi.org/10.1093/nar/29.14.2994) 与
[Camacho et al. (2009)](https://doi.org/10.1186/1471-2105-10-421)。
论文中应写“现代 NCBI BLAST+ 对 PSI-BLAST 方法的实现”，不应声称逐字复现
1997 年软件。

`psfm` 直接读取 PSI-BLAST ASN.1 checkpoint 的
`weightedResFreqsPerPos`（伪计数前的加权观测残基频率），保留没有观测的零行；
它不是对 PSSM 分数执行 softmax，也不是 target-frequency PSFM。主表可简称
PSFM，但方法中应首次限定为“PSI-BLAST weighted-observed position-specific
frequency matrix”。零观测行通过显式残基 mask 与 padding 区分。
`psfm_blosum62_hybrid`、`pssm_blosum62_hybrid` 和三个 PSSM covariance hybrid 都不是纯 PSSM/PSFM，论文
方法、图例和消融实验必须使用各自完整名称，并分别报告 fallback 样本数。

严格 `pssm`、`psfm`、`ac_pssm`、`cc_pssm`、`acc_pssm` 的
`profile_on_missing` 只能为 `error`。五个显式 hybrid 只能使用
`blosum62_hybrid`，且操作错误、超时、解析失败、有同源命中却没有输出等情况
均硬失败。所有 PSSM/PSFM 编码器均按原始残基位置定义，因此要求 `k=1`。

相关参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--pssm_index_path` | `''` | PSSM 索引路径 |
| `--ac_pssm_blosum62_hybrid_index_path` | `''` | AC hybrid 专用索引；不回退到 `--pssm_index_path` |
| `--cc_pssm_blosum62_hybrid_index_path` | `''` | CC hybrid 专用索引；不回退到 `--pssm_index_path` |
| `--acc_pssm_blosum62_hybrid_index_path` | `''` | ACC hybrid 专用索引；不回退到 `--pssm_index_path` |
| `--ac_pssm_blosum62_hybrid_lag` | `10` | AC hybrid 最大 lag |
| `--cc_pssm_blosum62_hybrid_lag` | `10` | CC hybrid 最大 lag |
| `--acc_pssm_blosum62_hybrid_lag` | `10` | ACC hybrid 最大 lag |
| `--psfm_index_path` | `''` | PSFM 索引路径 |
| `--profile_iterations` | — | PSI-BLAST 迭代次数 |
| `--profile_evalue` | — | PSI-BLAST E-value |
| `--profile_inclusion_evalue` | — | 纳入下一轮 profile 的 E-value 阈值 |
| `--profile_threads` | — | PSI-BLAST 线程数 |
| `--profile_on_missing` | `error` | 严格 profile 使用 `error`；显式 PSSM/PSFM hybrid 使用 `blosum62_hybrid`；Top-n-gram/DT 另有 `blosum62_target_frequency` |

## 编码器与分词器的兼容性

并非所有编码器都能与所有分词器搭配。编码器的可用集合取决于所选分词器：

| 分词器 | 可用编码器 |
| --- | --- |
| `kmer` | 全部已发布经典编码器；PSSM/PSFM 系编码器仅允许 `k=1` |
| `dr` | `index`, `onehot`, `bow`, `tfidf`, `textrank`, `word2vec`, `glove`, `fasttext` |
| `top-n-gram` | `bow`, `tfidf`, `textrank` |
| `dt` | `bow`, `tfidf`, `textrank` |
| `bpe` | `index` |
| `wordpiece` | `index` |
| `unigram` | `index` |

::: info
向导会根据所选分词器自动过滤可用的编码器，无需手动记忆兼容关系。详见 [分词器](./tokenizers)。
:::

## 静态嵌入相关参数

word2vec / glove / fasttext 编码器可配置嵌入训练参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--embedding_vector_size` | `128` | 嵌入维度 |
| `--embedding_window` | `5` | 上下文窗口大小 |
| `--embedding_min_count` | `1` | 最小词频 |
| `--embedding_epochs` | `20` | 嵌入训练轮数 |
| `--embedding_workers` | `1` | word2vec / fastText 训练线程数；内置 GloVe 使用 CPU 批训练 |
| `--word2vec_path` | `''` | 预训练 word2vec 路径 |
| `--glove_path` | `''` | 预训练 GloVe 路径 |
| `--fasttext_path` | `''` | 预训练 fastText 路径 |

### GloVe 实现与专属参数

平台内置的 `glove` 使用 PyTorch 实现[原始 GloVe 论文](https://nlp.stanford.edu/pubs/glove.pdf)的加权最小二乘目标，在非零共现项上训练 word/context 两套向量及 bias。共现窗口按距离倒数加权，输出向量为 word 与 context 向量之和。该实现不依赖 Docker、Stanford C 二进制或本机 C 编译器。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--glove_x_max` | `100.0` | 权重函数达到上限时的共现次数 |
| `--glove_alpha` | `0.75` | 权重函数指数，范围 `(0, 1]` |
| `--glove_learning_rate` | `0.05` | AdaGrad 学习率 |
| `--glove_batch_size` | `4096` | 稀疏非零共现项的批大小 |

`--glove_path` 为空时，平台只用训练集自动训练并缓存向量；显式提供路径时直接加载该文件，不会覆盖或重新训练。外部文件采用兼容的文本格式，但其训练算法由用户负责确认。
