# 集成 API

以下接口在启用认证时要求登录，并检查数据集与模型的访问权限。集成创建走专用接口，不接受通过普通实验配置中的 `web_ensemble` 绕过。

## GET /api/ensembles/capabilities

返回 `enabled`、`schema_version`、任务、融合方法、权重来源、可选目标与默认设置。方法为 `probability_mean`、`logit_mean`、`rank_mean`，权重来源为 `equal`、`custom`、`validation`；`evaluate_test` 默认 `false`。

## POST /api/ensembles/preflight

请求示例（ID 替换为当前账户可用资源）：

```json
{
  "name": "Validation ensemble",
  "task_type": "pep_function",
  "dataset_id": "builtin-pep-function-quick",
  "member_ids": ["model-a", "model-b"],
  "method": "probability_mean",
  "weight_source": "equal",
  "objective": "macro_f1",
  "threshold_objective": "macro_f1",
  "grid_step": 0.05,
  "seed": 42,
  "evaluate_test": false
}
```

请求省略 `schema_version` 时使用后端支持的定义格式。

`custom` 权重另传 `weights` 数组，顺序与成员一致。`dual_f1_sacc` 目标需传对应 `objective_params` 或 `threshold_objective_params`，包含两个参考值。成功响应包含 `valid`、`errors`、`error_codes`、规范化 `definition`、`label_names`、`validation_count`、成员摘要及 `validation_policy`。预检失败一般仍返回 HTTP 200、`valid: false`，客户端必须检查报告。

## POST /api/ensembles

接受与预检相同的字段，创建并入队一个普通实验，返回实验对象。名称长度为 1–120；禁用创建返回 409，定义不合法返回 400，配额不足沿用平台配额错误。成员需具备当前格式的评估信息，并满足标签顺序、验证数据身份和 Web 管理范围要求，不能嵌套。

结果使用普通实验、模型和推理接口访问。`rank_mean` 至少要求两行完整推理批次且结果依赖批次组成。详见[集成模型指南](../web-ui/ensembles)。
