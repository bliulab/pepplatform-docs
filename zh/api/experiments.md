# 实验

实验模块是 PepPlatform 训练流程的核心。支持提交前预检（preflight）、创建并提交训练任务、查询状态、取消、查看日志与分析结果，以及调用 AI 生成实验分析。实验提交后由后台 Runner 异步执行。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## GET /api/experiments

- **方法**: `GET`
- **路径**: `/api/experiments`
- **认证**: 需要登录
- **用途**: 列出当前用户的实验，返回含有效配置（含默认值来源）的实验列表。

```bash
curl http://127.0.0.1:8081/api/experiments \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
[
  {
    "id": "exp-1",
    "name": "pep_protein_interaction experiment",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "status": "succeeded",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "requested_config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" },
    "config_parameter_sources": { "tokenizer": "explicit", "encoder": "explicit", "model": "explicit" },
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

## POST /api/experiments/preflight

- **方法**: `POST`
- **路径**: `/api/experiments/preflight`
- **认证**: 需要登录
- **用途**: 在提交实验前校验配置合法性，返回归一化配置与校验结果。

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/preflight \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
  }'
```

请求体：

```json
{
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "valid": true,
  "errors": [],
  "error_codes": [],
  "normalized_config": {
    "task_type": "pep_protein_interaction",
    "tokenizer": "esm2",
    "encoder": "esm2",
    "model": "mlp"
  }
}
```

预检还会返回 `warnings`、`warning_codes` 和 `parameter_sources` 等字段。预检通过仅表示其已执行的检查通过，不能证明权重可下载、内存充足或每个运行时均已就绪；例如 ESM3 的 SDK 检查在初始化时执行。

## POST /api/experiments

- **方法**: `POST`
- **路径**: `/api/experiments`
- **认证**: 需要登录
- **用途**: 创建并提交训练实验。先执行 preflight 校验，通过后由 Runner 异步执行。

```bash
curl -X POST http://127.0.0.1:8081/api/experiments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "ESM2 + MLP 实验",
    "dataset_id": "builtin-ppi-quick",
    "task_type": "pep_protein_interaction",
    "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
  }'
```

请求体：

```json
{
  "name": "ESM2 + MLP 实验",
  "dataset_id": "builtin-ppi-quick",
  "task_type": "pep_protein_interaction",
  "config": { "tokenizer": "esm2", "encoder": "esm2", "model": "mlp" }
}
```

响应示例节选（`200`，值仅作示意）：返回新建实验对象（含 `status: "queued"`）。preflight 失败返回 `400`；配额超限返回 `429`。

## GET /api/experiments/{experiment_id}

- **方法**: `GET`
- **路径**: `/api/experiments/{experiment_id}`
- **认证**: 需要登录
- **用途**: 获取单个实验详情，含有效配置与参数来源。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `experiment_id` | 实验 ID |

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回实验对象（含 `config`、`requested_config`、`config_parameter_sources`）。无权限返回 `403`；不存在返回 `404`。

## DELETE /api/experiments/{experiment_id}

- **方法**: `DELETE`
- **路径**: `/api/experiments/{experiment_id}`
- **认证**: 需要登录
- **用途**: 删除实验及其产物（含关联模型产物）。仅已结束（succeeded/failed/canceled）的实验可删除。

```bash
curl -X DELETE http://127.0.0.1:8081/api/experiments/exp-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "experiment_id": "exp-1",
  "artifact_deleted": true,
  "model_artifacts_deleted": 1
}
```

实验仍在运行返回 `409`；不存在返回 `404`。

## POST /api/experiments/{experiment_id}/cancel

- **方法**: `POST`
- **路径**: `/api/experiments/{experiment_id}/cancel`
- **认证**: 需要登录
- **用途**: 取消排队或运行中的实验。

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/exp-1/cancel \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回更新后的实验对象（`status` 变为 `canceled`）。状态不可取消返回 `409`；不存在返回 `404`。

## GET /api/experiments/{experiment_id}/logs

- **方法**: `GET`
- **路径**: `/api/experiments/{experiment_id}/logs`
- **认证**: 需要登录
- **用途**: 获取训练日志文本。

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1/logs \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "content": "Epoch 1/10 - loss: 0.45 - val_loss: 0.50\n..." }
```

日志文件不存在时返回空字符串。

## GET /api/experiments/{experiment_id}/analysis

- **方法**: `GET`
- **路径**: `/api/experiments/{experiment_id}/analysis`
- **认证**: 需要登录
- **用途**: 获取实验分析结果（含评估指标）。分析产物无法读取时返回空分析结构并附带警告。

```bash
curl http://127.0.0.1:8081/api/experiments/exp-1/analysis \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

返回实际生成的分析字段，如 `metrics`、`curves`、投影与重要性结果，以及 `warnings`。缺失结果可能以 `available: false` 或空结构表示；请检查实际字段。示例数值不代表平台性能。

## POST /api/experiments/{experiment_id}/ai-analysis

- **方法**: `POST`
- **路径**: `/api/experiments/{experiment_id}/ai-analysis`
- **认证**: 需要登录
- **用途**: 调用 AI 生成实验分析与总结，可自定义 prompt 与语言。

```bash
curl -X POST http://127.0.0.1:8081/api/experiments/exp-1/ai-analysis \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider_config_id": "prov-1",
    "prompt": "总结本实验，解释指标中最重要的证据，并推荐下一个实验",
    "language": "zh"
  }'
```

请求体：

```json
{
  "provider_config_id": "prov-1",
  "prompt": "总结本实验，解释指标中最重要的证据，并推荐下一个实验",
  "include": {},
  "language": "zh",
  "max_tokens": 1200
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "answer": "本实验使用 ESM2 + MLP...",
  "provider": "deepseek",
  "model": "deepseek-flash",
  "usage": { "total_tokens": 900 },
  "context_manifest": { "sections": [] },
  "warnings": []
}
```

供应商未启用返回 `400`；配置错误返回 `503`；供应商错误返回 `502`。

## POST /api/experiments/{experiment_id}/resume-downstream

为失败的 SVM 实验创建下游恢复运行。源实验必须归当前账户可访问，状态为 `failed`，并保留通过完整性校验的恢复包。要求继续使用 SVM 及相同校准模式，创建前执行正常 Preflight 和实验配额检查。

```json
{"overrides": {"svm_max_iter": 10000, "svm_convergence_policy": "bounded_retry"}}
```

`overrides` 只允许：`svm_c`、`svm_class_weight`、`svm_max_iter`、`svm_tol`、`svm_kernel`、`svm_gamma`、`svm_convergence_policy`、`ml_scaler`、`ml_reduction`、`ml_reduction_dim`、`pca_dense_memory_limit_gib`、`kpca_memory_limit_gib`、`kpca_kernel`、`kpca_gamma`、`ml_auto_tune`、`ml_tuning_budget`、`ml_tuning_objective`、`ml_tuning_mode`、`ml_tuning_max_candidates`、`ml_cv_folds`。未知字段返回 400，源状态或恢复包不可用返回 409。成功返回新实验，原实验不被覆盖；`resume` 记录源实验、阶段和包身份。

## 实验诊断会话

所有接口检查当前账户及实验可见性，诊断历史与通用研究问答分开保存。

| 方法 | 路径 | 行为 |
| --- | --- | --- |
| GET | `/api/experiments/{experiment_id}/analysis/conversations` | 列表；`q`、`limit=50`、`offset=0` |
| GET | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | 会话消息；`limit=100`、`before_ordinal` |
| PATCH | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | 用 `title` 重命名或 `pinned` 置顶 |
| DELETE | `/api/experiments/{experiment_id}/analysis/conversations/{conversation_id}` | 删除会话与消息 |
| GET | `/api/experiments/{experiment_id}/analysis/messages/{message_id}` | 单条消息及结构化诊断报告 |
| POST | `/api/experiments/{experiment_id}/analysis/stream` | 创建首轮报告或续聊 |

流式请求：

```json
{"provider_config_id": "prov-1", "content": "解释本实验的验证结果", "language": "zh", "max_tokens": 4000, "include": {}}
```

续聊添加 `conversation_id`。只接受运行中或已结束实验，排队状态返回 409。新会话首轮产生结构化报告，可先收到 `stage`；后续问答产生增量 `delta`。`meta` 提供会话与消息记录，`done` 提供持久化消息，`error` 提供错误及保存状态。该诊断不执行网页搜索或直接创建训练候选；交给 AI 规划后仍需用户确认。

版本记录见[版本 API](./versions)，可视化任务见[可视化 API](./visualizations)。

## PATCH /api/experiments/{experiment_id}

用 `{"name": "新名称"}` 重命名当前账户可见的实验。去除首尾空白后需为 1–120 字符，且不能含控制字符。返回更新后的实验；非法输入返回 400。重命名不会更改训练配置。
