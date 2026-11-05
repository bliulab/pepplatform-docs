# Physicochemical Distance Transformation 科学契约

PepPlatform 的公开 `pdt` 编码器实现 Liu 等人提出的序列型
Physicochemical Distance Transformation（PDT）：*Using Amino Acid
Physicochemical Distance Transformation for Fast Protein Remote Homology
Detection*, PLoS ONE 7(9):e46633 (2012)，DOI
[10.1371/journal.pone.0046633](https://doi.org/10.1371/journal.pone.0046633)。

它不是论文中的 profile-based 变体。Profile-based PDT 必须先根据 PSI-BLAST
frequency profile，以第 n 高频氨基酸替换每个位置；这一流程不属于当前公开
`pdt` 路线。

## 数学定义

实现使用论文补充材料中 531 个完整 AAIndex1 属性。每个属性 `j` 先在 20 种
标准氨基酸上执行总体标准化：

```text
I[j,a] = (P[j,a] - mean_20(P[j])) / std_population_20(P[j])
```

对于规范化序列 `A_1 ... A_L`，距离 `lambda` 的特征为：

```text
PDT[j,lambda] = sum(i=1..L-lambda)
                 (I[j,A_i] - I[j,A_(i+lambda)])^2 / (L-lambda)
```

特征按属性优先排列：第一个 AAIndex accession 的全部 lag，然后是第二个
accession，依此类推。向量维度为 `531 * pdt_lag`；默认 `pdt_lag=8`，与论文
实验设置一致。

## 输入与 artifact

`pdt` 要求 `tokenizer=kmer, k=1`，但直接读取完整原始残基序列，不受 tokenizer
`max_length` 截断。输入会去除首尾空白并转大写；内部空白、空序列、非标准残基、
序列长度不大于 lag 和超过 `pdt_max_raw_length` 的输入均会被拒绝。

每个 artifact 都记录版本化 `pdt_encoder_contract`，其中包含论文 DOI、AAIndex
快照摘要、标准化与距离公式、特征顺序、lag、长度上限、dtype 和输出维度。缺少
完全一致契约的旧 artifact 必须重新训练。

运行时会验证随代码提供的 Text S1 派生快照；原始补充材料与作者 Text S2
源码摘要保存在 `pepplatform/pdt.py` 中，供审计和复现。
