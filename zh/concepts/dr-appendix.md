# DR 实现附录

平台中的 `dr` 指 **Distance-based Residue**，不是 Distributed
Representation。核心表示遵循 Liu 等提出的蛋白质序列距离残基表示：

> Liu, B., Xu, J., Zou, Q., Xu, R., Wang, X., & Chen, Q. (2014).
> Using distances between Top-n-gram and residue pairs for protein remote
> homology detection. *BMC Bioinformatics, 15*(Suppl 2), S3.
> https://doi.org/10.1186/1471-2105-15-S2-S3

## 核心表示

对长度为 \(L\) 的序列 \(S=s_1\ldots s_L\)，d0 词为每个单残基
\(s_i\)；对每个 \(d=1,\ldots,D\)，加入所有从左到右的定向残基对
\((s_i,s_{i+d})\)。标准 20 氨基酸字母表顺序固定为
`ARDCQEHIGNLKMFPSTWYV`，所以特征维数为：

\[
20 + 20 \times 20 \times D.
\]

特征列按 d0 单残基、d1 的 400 个定向残基对、……、dD 的 400 个定向残基
对排列。BoW 输出这些词在完整规范化序列中的原始出现次数，因此它就是论文
核心的 DR 计数向量。`D=0` 是合法配置，此时仅保留 20 个单残基计数。

为支持有序编码器，平台把同一组词确定性地线性化为“源位置优先”：在位置
\(i\) 先输出 d0 的 \(s_i\)，再依次输出该位置有效的 d1 至 dD 残基对。
这一顺序不改变论文计数向量，只定义了 `index`、`onehot` 与静态嵌入路线的
序列语义。

## BioSeq-BLM 扩展

`tfidf`、`textrank`、`word2vec`、`glove` 和 `fasttext` 属于论文核心 DR
词表之上的编码扩展。它们参考 BioSeq-BLM 对 DR-BOW、DR-TFIDF、
DR-TextRank、DR2vec、DR-GloVe 与 DR-FastText 的组织方式：

> Li, H.-L., Pang, Y.-H., & Liu, B. (2021). BioSeq-BLM: a platform for analyzing DNA, RNA and
> protein sequences based on biological language models.
> *Nucleic Acids Research, 49*(22), e129.
> https://pmc.ncbi.nlm.nih.gov/articles/PMC8682797/

平台 TF-IDF 使用训练集文档频率、平滑
`log((N+1)/(df+1))+1` 和按文档总词数归一化的 TF；weighted TextRank 使用
宽度为 2 的窗口、阻尼 0.85，以未归一化原始分数迭代至收敛，然后只对最终
分数做一次 L1 归一化。这些是明确记录的平台变体，不冒充
2014 论文中的原始计数向量。静态嵌入训练使用同一条源位置优先的完整词流。

## 长度、输入与资源契约

- 输入会移除空白并转为大写，只接受上述 20 个标准氨基酸；空序列和歧义
  字符会明确报错。
- `dr_max_raw_length` 默认 50,000，平台绝对上限为 100,000。
- BoW、TF-IDF 和 TextRank 总是读取完整规范化序列，`max_length` 不参与
  这些全局特征；`index`、`onehot` 和静态嵌入按 DR token 数截断或补齐。
- `dr_max_distance` 只接受整数 `0–200`，平台默认值为 `5`。按计算预算与验证协议选择参数；该默认值不表示已经达到最优效果。
- 稠密输出在分配前按真实 dtype 和形状估算。预算由
  `dr_dense_memory_limit_gib` 控制，默认 4 GiB。

## 工件兼容性

DR 模型工件和特征/静态嵌入缓存记录字母表、距离、特征维数、
词流顺序和原始长度上限；静态向量随模型 bundle 打包。缺少 DR 契约或来自
旧 26 字符、缺失 d0 实现的工件不会被静默加载，需要重新训练并导出。
