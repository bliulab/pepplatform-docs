# 推理

推理模块用于对已训练模型执行预测。支持序列列表或肽段-蛋白配对两种输入模式，并强制推理配额限制。推理结果可导出为 CSV 或删除。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## POST /api/models/{model_id}/predict

- **方法**: `POST`
- **路径**: `/api/models/{model_id}/predict`
- **认证**: 需要登录
- **用途**: 执行推理，按模型类型接受 `sequences`（单序列模型）或 `pairs`（Pair 模型），强制推理配额。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `model_id` | 模型 ID |

```bash
# 单序列模型
curl -X POST http://127.0.0.1:8081/api/models/model-1/predict \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sequences": ["ACDEFGHIKL", "MNPQRSTVWY"]
  }'

# Pair 模型
curl -X POST http://127.0.0.1:8081/api/models/model-1/predict \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "pairs": [
      {"peptide": "ACDEFGHIK", "protein": "MNPQRSTVWY"}
    ]
  }'
```

请求体（二选一，按模型类型提供）：

```json
{
  "sequences": ["ACDEFGHIKL", "MNPQRSTVWY"],
  "pairs": [
    { "peptide": "ACDEFGHIK", "protein": "MNPQRSTVWY" }
  ]
}
```

::: tip 输入模式
`sequences` 可传字符串（自动转为单元素列表）或列表；`pairs` 为对象列表，每项必须包含 `peptide` 与 `protein`。虽然后端只要求至少提供一种输入，但实际预测会按模型 bundle 类型消费其中一种，建议不要在同一请求中混传。
:::

::: tip 可推理路线
推理接口支持训练时保存了 reusable bundle 的单序列模型、预训练 embedding/classical 模型、Pair vector/token/sequence/embedding 模型，以及带参考图产物的 Pair graph 模型。若模型为 `metrics only` 或 bundle 缺少必要产物，会返回 `409`。
:::

::: warning Profile 推理
使用 PSSM/PSFM 等 profile 特征的模型可能在推理时临时生成 profile，并在响应中附带 `diagnostics.profile`。这要求后端可访问 BLAST+，且模型 bundle 包含 `profile_generation` 所需的 subject fasta / BLAST DB 元数据；否则请求会返回 `409` 并说明阻断原因。
:::

响应示例节选（`200`，值仅作示意）：

```json
{
  "labels": ["non_interaction", "interaction"],
  "thresholds": [0.41, 0.57],
  "score_kind": "probability",
  "legacy_evaluation_protocol": false,
  "predictions": [
    {
      "sequence": "ACDEFGHIKL",
      "scores": [0.32, 0.68],
      "predicted_labels": ["interaction"]
    }
  ],
  "run_id": "run-1"
}
```

序列经典分类器的 `score_kind` 与实际下游分类器一致：未校准 `svm` 返回 `margin`，概率型路线返回 `probability`。单标签和多标签预测都使用 bundle 中保存的验证集 operating point。

Pair 模型响应示例：

```json
{
  "model_id": "model-1",
  "labels": ["non_interaction", "interaction"],
  "predictions": [
    {
      "peptide": "ACDEFGHIK",
      "protein": "MNPQRSTVWY",
      "score": 0.82,
      "score_kind": "probability",
      "threshold": 0.5,
      "is_interaction": true,
      "prediction_label": "Interact",
      "scores": [0.82]
    }
  ],
  "run_id": "run-1"
}
```

配额超限返回 `429`；模型不支持推理或推理产物缺失返回 `409`；不存在返回 `404`。

## GET /api/inference-runs/{run_id}/csv

- **方法**: `GET`
- **路径**: `/api/inference-runs/{run_id}/csv`
- **认证**: 需要登录
- **用途**: 下载推理运行结果为 CSV 文件。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `run_id` | 推理运行 ID |

```bash
curl http://127.0.0.1:8081/api/inference-runs/run-1/csv \
  -b cookies.txt \
  -o predictions.csv
```

响应示例节选（`200`，值仅作示意）：返回 `text/csv` 文件（`Content-Disposition: attachment`），列含 `input_index`、`sequence`（或 `peptide`/`protein`）、`top_label`、`top_score`、`predicted_labels` 及各标签分数和验证阈值列。无权限返回 `403`；不存在返回 `404`。

## DELETE /api/inference-runs/{run_id}

- **方法**: `DELETE`
- **路径**: `/api/inference-runs/{run_id}`
- **认证**: 需要登录
- **用途**: 删除推理运行记录。

```bash
curl -X DELETE http://127.0.0.1:8081/api/inference-runs/run-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "run_id": "run-1", "deleted": true }
```

无权限返回 `403`；不存在返回 `404`。

## POST /api/models/{model_id}/predict/stream

请求体和账户配额检查与普通 `/predict` 一致，响应为 `text/event-stream`。阶段事件为 `stage`，最终成功为 `done`（包含完整推理响应及历史保存信息），失败为 `error`；空闲连接可能收到 SSE 注释心跳。开始流式响应前的鉴权或输入错误仍使用普通 HTTP 错误；流开始后必须检查终止事件，不能仅依据 HTTP 200 判断成功。

普通和流式推理均使用保存的验证阈值，并保留当前账户的推理历史。排名集成分数随完整请求批次变化；不要拆成单行请求，也不要把 rank 分数解释为概率。原始 SVM margin 同样不等于校准概率，参见[分类器](../concepts/classifiers)。
