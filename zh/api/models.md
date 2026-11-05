# 模型

模型模块管理训练完成的模型，支持列举、查看详情、检查推理就绪状态、重命名、删除以及查看推理运行记录。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## GET /api/models

- **方法**: `GET`
- **路径**: `/api/models`
- **认证**: 需要登录
- **用途**: 列出当前用户的已训练模型。

```bash
curl http://127.0.0.1:8081/api/models \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
[
  {
    "id": "model-1",
    "name": "ESM2 + MLP model",
    "experiment_id": "exp-1",
    "task_type": "pep_protein_interaction",
    "supports_inference": true,
    "bundle_path": "/path/to/bundle",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

## GET /api/models/{model_id}

- **方法**: `GET`
- **路径**: `/api/models/{model_id}`
- **认证**: 需要登录
- **用途**: 获取单个模型详情。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `model_id` | 模型 ID |

```bash
curl http://127.0.0.1:8081/api/models/model-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回模型对象。无权限返回 `403`；不存在返回 `404`。

## GET /api/models/{model_id}/inference-readiness

- **方法**: `GET`
- **路径**: `/api/models/{model_id}/inference-readiness`
- **认证**: 需要登录
- **用途**: 检查模型推理就绪状态，报告是否可从原始序列直接推理。

```bash
curl http://127.0.0.1:8081/api/models/model-1/inference-readiness \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "model_id": "model-1",
  "ready": true,
  "profile_required": false,
  "status": "not_required",
  "mode": "standard",
  "checks": [],
  "errors": [],
  "warnings": []
}
```

::: warning Profile 依赖
依赖 PSSM/PSFM 等 profile 编码器的路线会检查运行时 profile 生成能力。若模型 bundle 带有 `profile_generation` 产物且后端可用 BLAST+，推理可以按需生成 PSSM/PSFM；旧 bundle 缺少这些产物时会被标记为不可推理，并在 `errors` / `warnings` 中给出原因。
:::

::: tip Pair 与图模型
Pair 模型的可推理性取决于训练后是否保存了 reusable bundle。`sample_graph` 路线还需要图参考特征（如 `graph_reference.pt`）和对应模型状态；缺失时 readiness 会返回阻断项。
:::

不存在返回 `404`。

就绪报告反映模型包及其 profile、图依赖中已实现的检查，不会执行完整预测，也不能证明每个预训练运行时、权重下载条件与内存要求均已满足。

## PATCH /api/models/{model_id}

- **方法**: `PATCH`
- **路径**: `/api/models/{model_id}`
- **认证**: 需要登录
- **用途**: 重命名模型（最多 120 个字符）。

```bash
curl -X PATCH http://127.0.0.1:8081/api/models/model-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name": "Best ESM2 model"}'
```

请求体：

```json
{ "name": "Best ESM2 model" }
```

响应示例节选（`200`，值仅作示意）：返回更新后的模型对象。名称为空返回 `400`；超长返回 `400`；不存在返回 `404`。

## DELETE /api/models/{model_id}

- **方法**: `DELETE`
- **路径**: `/api/models/{model_id}`
- **认证**: 需要登录
- **用途**: 删除模型及其产物文件。

```bash
curl -X DELETE http://127.0.0.1:8081/api/models/model-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "model_id": "model-1", "artifact_deleted": true }
```

删除产物失败返回 `500`；不存在返回 `404`。

## GET /api/models/{model_id}/inference-runs

- **方法**: `GET`
- **路径**: `/api/models/{model_id}/inference-runs`
- **认证**: 需要登录
- **用途**: 列出指定模型的推理运行记录。

```bash
curl http://127.0.0.1:8081/api/models/model-1/inference-runs \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回推理运行记录列表。模型不存在返回 `404`。
