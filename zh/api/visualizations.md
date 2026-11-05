# 可视化分析 API

接口基路径为 `/api/experiments/{experiment_id}/visualizations`，检查登录与实验访问权限。仅对 Web 管理的成功实验读取已冻结评估证据，不训练、不推理、不重新拟合阈值。

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| GET | `/api/experiments/{experiment_id}/visualizations/capabilities` | 可用划分、标签和分析类型，以及不可用原因 |
| POST | `/api/experiments/{experiment_id}/visualizations/jobs` | 创建分析任务或复用同证据、参数的缓存 |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}` | 查询任务状态 |
| POST | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/cancel` | 取消排队或运行任务 |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/result` | 读取结果，支持 `row_offset`、`column_offset`、`search` |
| GET | `/api/experiments/{experiment_id}/visualizations/jobs/{job_id}/export` | `format=csv` 导出完整聚合表，`format=json` 返回不含大矩阵的元数据 |

## 请求参数

```json
{"split": "validation", "kind": "stratified", "metric": "aupr"}
```

`split` 必须取自 capabilities。`kind` 可为 `stratified`、`labels`、`patterns`。分层分析 `metric` 可为 `acc`、`f1`、`auc`、`aupr`、`count`、`prevalence`，默认 `aupr`。标签模式的 `pattern` 为 `truth`、`prediction`、`false_negative`、`false_positive`，`scale` 为 `count` 或 `jaccard`。不接受其他请求字段。

任务状态包括 `queued`、`running`、`succeeded`、`failed`、`canceled`、`interrupted`。服务重启会将未完成任务标为 interrupted。结果按 50 行/列分页；CSV 是完整聚合结果，JSON 导出保留来源与参数元数据，PNG 导出由前端完成。

错误以 `detail.code` 表示：任务不存在为 404，队列满为 429，参数或证据错误为 422。不可用原因也可能出现在 capabilities 的正常响应中，客户端应先检查类型是否可用。参见[实验详情](../web-ui/experiment-detail)。
