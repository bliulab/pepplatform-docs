# DT 实现附录

平台中的 `dt` 指 **Distance-based Top-n-gram**。当前公开实现固定为论文的
Top-1 变体，不是普通序列的距离哈希，也不再接受旧的 PSSM-score 哈希实现：

> Liu, B., Xu, J., Zou, Q., Xu, R., Wang, X., & Chen, Q. (2014).
> Using distances between Top-n-gram and residue pairs for protein remote
> homology detection. *BMC Bioinformatics, 15*(Suppl 2), S3.
> https://pmc.ncbi.nlm.nih.gov/articles/PMC4015815/

## 论文核心表示

先从 PSI-BLAST **目标频率矩阵**的每一行选取频率最高的氨基酸，得到 Top-1
序列 (T=t_1\ldots t_L)。并列频率按固定顺序
`ARNDCQEGHILKMFPSTWYV` 决定，以保证训练和推理一致。

对每个位置加入 d0 词 (t_i)；对每个
(d=1,\ldots,D)，加入从左到右的定向词
(t_i\_d\_t_{i+d})。DT 特征字母表按论文固定为
`ARDCQEHIGNLKMFPSTWYV`。列索引为：

\[
\operatorname{index}(a)=0,\ldots,19,
\]

\[
\operatorname{index}(a\_d\_b)
=20+(d-1)\times400+\operatorname{index}(a)\times20
+\operatorname{index}(b).
\]

因此精确维数是 (20+400D)，不存在哈希碰撞。`D=0` 合法，此时只保留
20 个 d0 Top-1 计数。BoW 对完整词流输出原始出现次数，不做归一化，属于
论文核心表示。

论文示例 Top-1 序列 `KFFK`、`D=2` 对应的源位置优先词流为：

```text
K, K_1_F, K_2_F, F, F_1_F, F_2_K, F, F_1_K, K
```

这个确定性顺序只定义平台扩展的词流语义，不改变 BoW 计数。

## 平台扩展

`tfidf` 与 `textrank` 是论文核心 DT-BOW 之上的平台扩展。TF-IDF 只从训练
split 的 profile 词流拟合文档频率，使用
`log((N+1)/(df+1))+1`，并将训练期 IDF 随模型工件保存。weighted TextRank
在完整的源位置优先词流上以原始分数迭代至收敛，只在最终执行一次 L1
归一化。这两种输出不会被描述为 2014 论文的
原始 DT 计数向量。

## Profile、长度与资源契约

- DT 使用与 Top-n-gram 相同的 PSI-BLAST 目标频率 manifest。旧 PSSM
  分数 index 不是等价输入。
- profile 样本同时绑定 sample ID、规范化序列长度和 SHA-256；错配、缺失或
  损坏会明确报错。并列选择策略固定，禁止依赖不稳定排序。
- `max_length` 的单位是原始残基数。训练前会按数据集最长序列自动上调，DT
  不会静默截断后再声称使用了完整论文表示。
- `dt_max_distance` 只接受整数 `0–200`，默认 `5`。论文实验使用
  `dMAX=150`；默认 5 是控制维度和计算量的工程默认值，不是论文最优值声明。
- 稠密特征分配前按样本数和精确维数估算，预算由
  `dt_dense_memory_limit_gib` 控制，默认 4 GiB。
- `profile_on_missing=error` 为严格模式；显式选择
  `blosum62_target_frequency` 时使用版本化的 BLOSUM62 目标频率先验，并在
  profile provenance 与模型契约中记录。

## 工件兼容性

DT 模型工件与特征缓存记录 Top-1、字母表、d0、距离、词流
顺序、精确维数、target-frequency manifest 摘要和 fallback 策略。推理时会
逐项校验，并要求 DT TF-IDF 工件包含训练期 IDF。缺少 `dt_contract`、仍包含
哈希宽度语义或来自旧 PSSM 哈希实现的模型不能无损转换，必须重新训练并导出。
