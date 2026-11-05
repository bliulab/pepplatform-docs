# AI Provider

AI Provider 模块用于管理用户的大语言模型供应商配置。PepPlatform 通过这些配置驱动 Agent 实验设计、执行计划生成与实验分析等 AI 能力。API 密钥在存储时加密，仅保留最后 4 位明文用于展示。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

::: warning 密钥安全
API 密钥使用 `PEP_LLM_KEY_ENCRYPTION_SECRET` 加密存储，响应中永远不会返回完整密钥。默认供应商为 deepseek。
:::

## GET /api/ai/providers

- **方法**: `GET`
- **路径**: `/api/ai/providers`
- **认证**: 需要登录
- **用途**: 列出当前用户的所有 AI 供应商配置。

```bash
curl http://127.0.0.1:8081/api/ai/providers \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
[
  {
    "id": "prov-1",
    "provider": "deepseek",
    "display_name": "My DeepSeek",
    "base_url": "https://api.deepseek.com",
    "model": "deepseek-flash",
    "api_key_last4": "abcd",
    "enabled": true,
    "capabilities": {},
    "owner_user_id": "a1b2c3d4",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

## GET /api/ai/provider-presets

- **方法**: `GET`
- **路径**: `/api/ai/provider-presets`
- **认证**: 无需登录
- **用途**: 列出内置供应商预设（deepseek、openai 等），包含推荐的 `base_url` 与默认模型。

```bash
curl http://127.0.0.1:8081/api/ai/provider-presets
```

响应示例节选（`200`，值仅作示意）：

```json
[
  {
    "provider": "deepseek",
    "display_name": "DeepSeek",
    "base_url": "https://api.deepseek.com",
    "model": "deepseek-flash",
    "capabilities": {}
  }
]
```

## POST /api/ai/providers

- **方法**: `POST`
- **路径**: `/api/ai/providers`
- **认证**: 需要登录
- **用途**: 创建 AI 供应商配置，`api_key` 为必填项，存储时加密。

```bash
curl -X POST http://127.0.0.1:8081/api/ai/providers \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "provider": "deepseek",
    "display_name": "My DeepSeek",
    "base_url": "https://api.deepseek.com",
    "model": "deepseek-flash",
    "api_key": "sk-xxxxxxxxxxxxabcd",
    "enabled": true
  }'
```

请求体：

```json
{
  "provider": "deepseek",
  "display_name": "My DeepSeek",
  "base_url": "https://api.deepseek.com",
  "model": "deepseek-flash",
  "api_key": "sk-xxxxxxxxxxxxabcd",
  "enabled": true
}
```

响应示例节选（`200`，值仅作示意）：返回新建的供应商配置（不含密钥密文）。参数非法返回 `400`，加密配置缺失返回 `503`。

## PATCH /api/ai/providers/{provider_id}

- **方法**: `PATCH`
- **路径**: `/api/ai/providers/{provider_id}`
- **认证**: 需要登录
- **用途**: 更新供应商配置。`api_key` 可选，提供时轮换密钥。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `provider_id` | 供应商配置 ID |

```bash
curl -X PATCH http://127.0.0.1:8081/api/ai/providers/prov-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"model": "deepseek-v4-pro", "enabled": true}'
```

请求体（所有字段可选）：

```json
{
  "provider": "deepseek",
  "display_name": "My DeepSeek",
  "base_url": "https://api.deepseek.com",
  "model": "deepseek-v4-pro",
  "api_key": "sk-newkey1234",
  "enabled": true
}
```

响应示例节选（`200`，值仅作示意）：返回更新后的供应商配置。不存在返回 `404`。

## DELETE /api/ai/providers/{provider_id}

- **方法**: `DELETE`
- **路径**: `/api/ai/providers/{provider_id}`
- **认证**: 需要登录
- **用途**: 删除供应商配置。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `provider_id` | 供应商配置 ID |

```bash
curl -X DELETE http://127.0.0.1:8081/api/ai/providers/prov-1 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "provider_id": "prov-1", "deleted": true }
```

不存在返回 `404`。

## POST /api/ai/providers/{provider_id}/test

- **方法**: `POST`
- **路径**: `/api/ai/providers/{provider_id}/test`
- **认证**: 需要登录
- **用途**: 测试供应商连通性，发送一条简短测试消息并返回结果。供应商未启用返回 `400`。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `provider_id` | 供应商配置 ID |

```bash
curl -X POST http://127.0.0.1:8081/api/ai/providers/prov-1/test \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "ok": true,
  "provider": "deepseek",
  "model": "deepseek-flash",
  "answer_preview": "OK",
  "usage": { "total_tokens": 16 }
}
```

配置错误返回 `503`，供应商接口错误返回 `502`。
