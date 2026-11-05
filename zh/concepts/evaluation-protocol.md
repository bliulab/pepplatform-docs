# 评估协议

PepPlatform 对不同模型路线统一划分训练、验证与独立测试的用途，并在保存结果中记录特征拟合范围、图结构、决策阈值和评估指标。

## 独立测试原则

- 训练集用于模型参数，以及词表、静态嵌入、统计变换和 profile 参考库的拟合。
- 验证集用于检查点选择、早停和决策阈值确定。
- 独立测试集只接受已经固定的模型和阈值，不参与任何阈值搜索。

阈值拟合默认使用二分类 F1 或多标签逐标签 macro-F1；配置 SAcc 或双目标时使用对应的验证搜索。检查点、调参和阈值目标彼此独立，参见[模型选择目标](./selection-objectives)。最佳检查点恢复后，平台重新计算验证集分数和最终阈值，并将其原样应用于所有测试集及后续 Web 推理。

所有会学习数据分布的特征生成器都必须只在训练集拟合。样本图模型仅以训练节点构造 reference graph；验证/测试节点是只接收 `Train → query` 消息的临时查询节点，不存在反向消息或 query-query 边。

## 指标口径

多标签任务的主结果采用 exact-match accuracy、SAcc、macro-F1、macro-AUC 和 macro-AUPR。平台同时保存明确命名的 micro-AUC、micro-AUPR 以及 micro-averaged ROC/PR 曲线。二分类任务报告 ROC-AUC、AUPR、F1、accuracy、Balanced Accuracy、precision、Recall (Sensitivity)、specificity 和 MCC。

若某个数据划分不具备计算 AUC 或 AUPR 所需的类别条件，指标会被标记为不可用，不使用人为默认值替代。

## 可审计产物

保存的模型包含 `feature_fit_scope`、`evaluation_mode`、验证集 operating point、阈值来源、检查点指标、连续预测分数和结构化评估结果。格式版本字段供加载器检查兼容性。较早的文件可能缺少证明特征仅在训练集拟合所需的信息，应先核对其生成方式，再判断结果能否比较。

可使用 `python tools/audit_evaluation_protocol.py <results-dir>` 重新计算并核对目录内的文件格式兼容性、阈值来源和全部保存指标，而无需重新训练模型。
