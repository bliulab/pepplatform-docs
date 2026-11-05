# AI 规划 API（兼容命名）

用户界面将该模块称为“AI 工作台 / 实验规划”。`/api/agent` 路径和内部 execution plan 名称为兼容既有客户端而保留。网页端只生成、比较和复盘候选，每个实验都由用户在实验向导中确认。

`POST /api/agent/experiment-batches` 与 `POST /api/agent/execution-plans/{plan_id}/execute` 已进入一个次版本的弃用期。响应包含 `Deprecation: true` 和 `Warning: 299`；新客户端应使用单 action confirm 路径并由实验向导完成确认。

## AI 问答与会话历史

AI 问答使用账户隔离的持久化会话。同一会话可以逐轮切换 Provider 或模型；每条助手消息都会保留实际 Provider、模型、状态和 usage 快照。页面展示完整历史，送入模型的上下文限制为最近 40 条非空消息、总计最多 60,000 字符。

### POST /api/agent/chat/stream

以 Server-Sent Events 流式生成回答。新会话在第一条消息提交时创建；中止连接会保留已有部分并将消息标记为 `stopped`。

```json
{
  "conversation_id": "可选，续聊时传入",
  "provider_config_id": "prov-1",
  "content": "比较这个结果中的 AUPR 与 F1",
  "language": "zh",
  "max_tokens": 3000,
  "temperature": 0.3,
  "web_search": false
}
```

`web_search` 默认 `false`。设为 `true` 后，本轮最多执行一次 Tavily Basic Search；最终助手消息的 `web_search` 字段包含状态、查询、credit 数及编号来源。搜索不可用时仍会完成普通回答，并将原因写入该字段。

事件依次为：

- `meta`：会话、用户消息和空的助手消息记录；
- `search`：额度检查、搜索中、完成或不可用状态；
- `delta`：本次新增文本；
- `done`：最终持久化消息；
- `error`：错误详情和已持久化的部分消息。

### 会话 CRUD

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/agent/chat/conversations?q=&limit=50&offset=0` | 搜索并分页列出自己的会话 |
| `GET` | `/api/agent/chat/conversations/{id}?limit=100&before_ordinal=` | 获取会话与消息 |
| `PATCH` | `/api/agent/chat/conversations/{id}` | 用 `title` 重命名或用 `pinned` 置顶 |
| `DELETE` | `/api/agent/chat/conversations/{id}` | 删除会话及全部消息 |
| `GET` | `/api/agent/web-search/status` | 获取联网搜索配置、免费额度与重置日期，不返回 Key |

管理员也不能读取其他账户的私有会话。兼容接口 `POST /api/agent/chat` 仍可使用，但不会创建历史记录，也不提供流式响应。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## POST /api/agent/experiment-design

- **方法**: `POST`
- **路径**: `/api/agent/experiment-design`
- **认证**: 需要登录
- **用途**: 通过 AI 基于数据集上下文生成实验设计候选，支持失败时自动修复重试。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/experiment-design \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "推荐接下来三个实验配置",
    "language": "zh",
    "max_tokens": 2200
  }'
```

请求体：

```json
{
  "provider_config_id": "prov-1",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "推荐接下来三个实验配置",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "zh",
  "max_tokens": 2200
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "candidates": [
    {
      "id": "lane-1",
      "lane": "candidate-1",
      "title": "ESM2 + MLP baseline",
      "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
      "valid": true
    }
  ],
  "provider": "deepseek",
  "model": "deepseek-flash",
  "usage": { "total_tokens": 1800 },
  "context_manifest": { "context_chars": 4200 },
  "context_summary": "dataset: builtin-ppi-quick, task: pep_protein_interaction",
  "repair_attempted": false,
  "repair_succeeded": false,
  "warnings": []
}
```

供应商未启用返回 `400`，配置错误返回 `503`，供应商或解析错误返回 `502`。

## POST /api/agent/experiment-batches

> 已弃用：保留一个次版本用于兼容，之后关闭。请使用实验向导确认单个规划候选。

- **方法**: `POST`
- **路径**: `/api/agent/experiment-batches`
- **认证**: 需要登录
- **用途**: 创建并提交一批（1-3 个）实验。每个候选先经过 preflight 校验，全部通过后才创建实验。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/experiment-batches \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "对比三种编码器",
    "candidates": [
      { "lane": "a", "title": "ESM2 baseline", "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" } },
      { "lane": "b", "title": "BoW + SVM baseline", "config": { "tokenizer": "kmer", "encoder": "bow", "model": "svm" } }
    ]
  }'
```

请求体：

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "对比三种编码器",
  "candidates": [
    { "lane": "a", "title": "ESM2 baseline", "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" } }
  ]
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "batch_id": "f0e1d2c3",
  "created_experiments": [
    {
      "candidate_id": "a-1",
      "lane": "a",
      "title": "ESM2 baseline",
      "experiment": { "id": "exp-1", "name": "Agent a: ESM2 baseline", "status": "queued" }
    }
  ],
  "warnings": []
}
```

候选数量不在 1-3 范围返回 `400`；preflight 失败返回 `400`（含被拒绝候选详情）；配额超限返回 `429`。

## POST /api/agent/campaigns

- **方法**: `POST`
- **路径**: `/api/agent/campaigns`
- **认证**: 需要登录
- **用途**: 创建多轮迭代，设定数据集、任务类型、目标与最大轮次（1-20）。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/campaigns \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "迭代优化 peptide-protein interaction 模型",
    "max_rounds": 3
  }'
```

请求体：

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "迭代优化 peptide-protein interaction 模型",
  "max_rounds": 3
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "id": "camp-1",
  "task_type": "pep_protein_interaction",
  "dataset_id": "builtin-ppi-quick",
  "objective": "迭代优化 peptide-protein interaction 模型",
  "max_rounds": 3,
  "current_round_index": 0,
  "status": "active",
  "plans": []
}
```

数据集任务类型不匹配返回 `400`。

## GET /api/agent/campaigns

- **方法**: `GET`
- **路径**: `/api/agent/campaigns`
- **认证**: 需要登录
- **用途**: 列出迭代，支持按数据集、任务类型、状态筛选与分页。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dataset_id` | string | 空 | 按数据集筛选 |
| `task_type` | string | 空 | 按任务类型筛选 |
| `status` | string | 空 | 按状态筛选 |
| `limit` | int | 20 | 每页数量（最大 100） |
| `offset` | int | 0 | 偏移量 |

```bash
curl "http://127.0.0.1:8081/api/agent/campaigns?status=active&limit=10" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "campaigns": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

## GET /api/agent/campaigns/{campaign_id}

- **方法**: `GET`
- **路径**: `/api/agent/campaigns/{campaign_id}`
- **认证**: 需要登录
- **用途**: 获取单个迭代及其所有执行计划。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `campaign_id` | 迭代 ID |

```bash
curl http://127.0.0.1:8081/api/agent/campaigns/camp-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回迭代对象，`plans` 字段包含该迭代下的所有执行计划。不存在返回 `404`。

## POST /api/agent/campaigns/{campaign_id}/rounds

- **方法**: `POST`
- **路径**: `/api/agent/campaigns/{campaign_id}/rounds`
- **认证**: 需要登录
- **用途**: 生成下一轮执行计划。要求上一轮实验全部完成且已复盘，否则返回 `409`。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/campaigns/camp-1/rounds \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "language": "zh",
    "max_tokens": 2200
  }'
```

请求体（`provider_config_id` 必填，其余可选）：

```json
{
  "provider_config_id": "prov-1",
  "objective": "基于上一轮复盘优化",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "zh",
  "max_tokens": 2200
}
```

响应示例节选（`200`，值仅作示意）：返回新生成的执行计划。迭代非 active 返回 `409`；已达最大轮次返回 `409`；上一轮未完成或未复盘返回 `409`。

## POST /api/agent/execution-plans

- **方法**: `POST`
- **路径**: `/api/agent/execution-plans`
- **认证**: 需要登录
- **用途**: 通过 AI 生成独立执行计划（不绑定迭代），含实验创建/取消动作。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "objective": "规划下一批实验动作",
    "language": "zh"
  }'
```

请求体：

```json
{
  "provider_config_id": "prov-1",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "objective": "规划下一批实验动作",
  "include": {},
  "baseline_experiment_ids": [],
  "language": "zh",
  "max_tokens": 2200
}
```

响应示例节选（`200`，值仅作示意）：返回执行计划对象，含 `actions`、`context_manifest`、`trace` 等字段。

## GET /api/agent/execution-plans

- **方法**: `GET`
- **路径**: `/api/agent/execution-plans`
- **认证**: 需要登录
- **用途**: 列出执行计划，支持按数据集、任务类型、状态、迭代筛选与分页。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dataset_id` | string | 空 | 按数据集筛选 |
| `task_type` | string | 空 | 按任务类型筛选 |
| `status` | string | 空 | 按状态筛选 |
| `campaign_id` | string | 空 | 按迭代筛选 |
| `limit` | int | 20 | 每页数量（最大 100） |
| `offset` | int | 0 | 偏移量 |

```bash
curl "http://127.0.0.1:8081/api/agent/execution-plans?status=draft&limit=10" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "plans": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
```

## DELETE /api/agent/execution-plans/{plan_id}

- **方法**: `DELETE`
- **路径**: `/api/agent/execution-plans/{plan_id}`
- **认证**: 需要登录
- **用途**: 删除执行计划。若仍有排队或运行中的实验则拒绝删除。

```bash
curl -X DELETE http://127.0.0.1:8081/api/agent/execution-plans/plan-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "plan_id": "plan-1", "deleted": true }
```

存在未完成实验返回 `409`，不存在返回 `404`。

## GET /api/agent/execution-plans/{plan_id}

- **方法**: `GET`
- **路径**: `/api/agent/execution-plans/{plan_id}`
- **认证**: 需要登录
- **用途**: 获取单个执行计划，自动刷新关联实验的执行状态。

```bash
curl http://127.0.0.1:8081/api/agent/execution-plans/plan-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回执行计划对象（含 `actions`、`execution`、`status` 等）。不存在返回 `404`。

## POST /api/agent/execution-plans/{plan_id}/refresh

- **方法**: `POST`
- **路径**: `/api/agent/execution-plans/{plan_id}/refresh`
- **认证**: 需要登录
- **用途**: 刷新执行计划的执行状态，同步关联实验的最新状态并更新进度。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/refresh \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回刷新后的执行计划。不存在返回 `404`。

## PATCH /api/agent/execution-plans/{plan_id}/actions/{action_id}

- **方法**: `PATCH`
- **路径**: `/api/agent/execution-plans/{plan_id}/actions/{action_id}`
- **认证**: 需要登录
- **用途**: 编辑待执行（pending）的 `create_experiment` 动作配置。已执行或非创建类动作不可编辑。

```bash
curl -X PATCH http://127.0.0.1:8081/api/agent/execution-plans/plan-1/actions/act-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "title": "调整后的实验"
  }'
```

请求体：

```json
{
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
  "title": "调整后的实验"
}
```

响应示例节选（`200`，值仅作示意）：返回更新后的执行计划。动作不存在返回 `404`；非 editable 状态返回 `409`；`config` 非对象返回 `400`。

## POST /api/agent/execution-plans/{plan_id}/actions/{action_id}/confirm

- **方法**: `POST`
- **路径**: `/api/agent/execution-plans/{plan_id}/actions/{action_id}/confirm`
- **认证**: 需要登录
- **用途**: 由实验向导确认一个 pending 的 `create_experiment` 动作。后端会使用最终配置重新运行 Preflight，校验任务、数据集、计划归属与配额，然后创建实验并回写计划进度。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/actions/act-1/confirm \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "人工确认的 Agent 候选",
    "task_type": "pep_function",
    "dataset_id": "dataset-1",
    "config": { "tokenizer": "kmer", "encoder": "index", "model": "cnn" }
  }'
```

响应示例节选（`200`，值仅作示意）：返回已入队的实验对象。同一动作重复确认会返回原实验，不会重复创建。最终 Preflight 失败返回 `400`；上下文或动作状态冲突返回 `409`；配额超限返回 `429`。

## POST /api/agent/execution-plans/{plan_id}/execute

> 已弃用：保留一个次版本用于兼容，之后关闭。请使用 `/actions/{action_id}/confirm`。

- **方法**: `POST`
- **路径**: `/api/agent/execution-plans/{plan_id}/execute`
- **认证**: 需要登录
- **用途**: 兼容旧客户端的批量执行接口。当前 Web UI 不调用此接口；新的交互应逐个进入实验向导并使用上面的 `confirm` 接口。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/execute \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "approved_action_ids": ["act-1", "act-2"] }'
```

请求体：

```json
{ "approved_action_ids": ["act-1", "act-2"] }
```

响应示例节选（`200`，值仅作示意）：返回更新后的执行计划，`execution` 中包含 `created_experiments` 与 `canceled_experiments`。审批动作不存在或无效返回 `400`；配额超限返回 `429`。

## POST /api/agent/execution-plans/{plan_id}/review

- **方法**: `POST`
- **路径**: `/api/agent/execution-plans/{plan_id}/review`
- **认证**: 需要登录
- **用途**: 对已执行的执行计划进行 AI 复盘，生成总结与下一步建议。要求所有实验已完成。

```bash
curl -X POST http://127.0.0.1:8081/api/agent/execution-plans/plan-1/review \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "prompt": "复盘本轮实验并推荐下一批动作",
    "language": "zh"
  }'
```

请求体：

```json
{
  "provider_config_id": "prov-1",
  "prompt": "复盘本轮实验并推荐下一批动作",
  "include": {},
  "language": "zh",
  "max_tokens": 1600
}
```

响应示例节选（`200`，值仅作示意）：返回更新后的执行计划，`review` 字段包含 AI 生成的总结、建议与风险评估。实验未完成返回 `409`；无可用报告返回 `409`；供应商错误返回 `502`/`503`。

## 流式规划与复核

| 方法 | 路径 | 非流式对应操作 |
| --- | --- | --- |
| POST | `/api/agent/execution-plans/stream` | 生成方案 |
| POST | `/api/agent/campaigns/{campaign_id}/rounds/stream` | 创建迭代下一轮 |
| POST | `/api/agent/execution-plans/{plan_id}/review/stream` | 复核方案 |

请求字段和权限沿用对应非流式接口。响应为 SSE，主要事件为 `stage` 和最终 `done`，`done` 的事件数据包含 `plan`；心跳是 SSE 注释，异常以 `error` 事件报告。进度事件不意味着已保存完整方案。完成规划或复核不会自动执行实验，每个候选仍需按确认流程进入向导。研究问答的 `delta` 事件与规划进度不是同一种协议。

## POST /api/agent/chat

兼容的非流式问答。要求登录、启用的 `provider_config_id` 及非空消息对象数组 `messages`。返回完整回答，但不创建持久化会话历史；需要历史的新客户端应使用流式接口。
