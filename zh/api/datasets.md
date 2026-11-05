# 数据集

数据集模块管理训练数据的列举、上传与删除，并提供数据集报告预览。启用认证时，已登记内置数据集对登录账户可见；上传数据集按拥有者与管理员权限访问。删除数据集前需确认无实验引用。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## GET /api/datasets

- **方法**: `GET`
- **路径**: `/api/datasets`
- **认证**: 需要登录
- **用途**: 列出当前用户可见的数据集（含内置与自有上传）。

```bash
curl http://127.0.0.1:8081/api/datasets \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
[
  {
    "id": "builtin-ppi-quick",
    "name": "Built-in peptide-protein interaction quick dataset",
    "task_type": "pep_protein_interaction",
    "source": "builtin",
    "format": "pair_split_dir",
    "owner_user_id": null
  },
  {
    "id": "upload-1",
    "name": "My dataset",
    "task_type": "pep_function",
    "source": "upload",
    "format": "sequence_dir",
    "owner_user_id": "a1b2c3d4"
  }
]
```

## POST /api/datasets/upload

- **方法**: `POST`
- **路径**: `/api/datasets/upload`
- **认证**: 需要登录
- **用途**: 上传 `.zip` 数据集压缩包（multipart 上传），自动解包校验。

```bash
curl -X POST http://127.0.0.1:8081/api/datasets/upload \
  -b cookies.txt \
  -F "task_type=pep_function" \
  -F "name=My dataset" \
  -F "archive=@dataset.zip"
```

请求参数（multipart/form-data）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `task_type` | string | 任务类型，如 `pep_function`、`pep_protein_interaction` |
| `name` | string | 数据集名称 |
| `archive` | file | `.zip` 压缩包文件 |

ZIP 内支持 `labels.tsv`、`pairs.tsv`，以及 PPI / HLA-I 扁平表 `train.tsv`、`val.tsv`、`test.tsv`，目录与列要求见 [数据格式规范](../datasets/format#web-上传中的-tsv)。上传时保留原 TSV 并转换为标准 CSV；同名 CSV 已存在时优先使用且不覆盖。CSV 解析、API 返回格式及 CLI 读取方式不变。

响应示例节选（`200`，值仅作示意）：返回新建数据集对象。校验失败返回 `400`。

## DELETE /api/datasets/{dataset_id}

- **方法**: `DELETE`
- **路径**: `/api/datasets/{dataset_id}`
- **认证**: 需要登录
- **用途**: 删除上传的数据集。仅上传数据集可删除，且无实验引用时方可删除。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `dataset_id` | 数据集 ID |

```bash
curl -X DELETE http://127.0.0.1:8081/api/datasets/upload-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "dataset_id": "upload-1", "artifact_deleted": true }
```

非上传数据集返回 `409`；仍被实验引用返回 `409`；无权限返回 `403`；不存在返回 `404`。

## GET /api/datasets/{dataset_id}/report

- **方法**: `GET`
- **路径**: `/api/datasets/{dataset_id}/report`
- **认证**: 需要登录
- **用途**: 构建数据集报告，含统计摘要与数据预览。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `dataset_id` | 数据集 ID |

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `limit` | int | 5 | 预览样本数量 |

```bash
curl "http://127.0.0.1:8081/api/datasets/builtin-ppi-quick/report?limit=10" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回数据集报告对象（含样本统计、分布、预览行等）。无权限返回 `403`；不存在返回 `404`。

## TXT 上传转换

新上传还支持指定位置的 `labels.txt`、`pairs.txt`、`seqs.txt` 及受支持的扁平划分 TXT 表。后端保留原件并生成缺失的标准 CSV/FASTA；不会静默替换已有高优先级文件。文件名、优先级、分隔符及转换溯源见[数据格式](../datasets/format)。该支持不扩展 CLI 读取器。
