# AI Provider

The AI Provider module manages user large-language-model provider configurations. PepPlatform uses these configs to power Agent experiment design, execution-plan generation, and experiment analysis. API keys are encrypted at rest, with only the last 4 characters stored in plaintext for display.

::: tip Interactive API docs
The backend provides interactive API references at `http://127.0.0.1:8081/docs` (Swagger UI) and `http://127.0.0.1:8081/redoc` (ReDoc). Use the actual backend address for your deployment; the Docker frontend proxies `/api/` by default.
:::

::: warning Key security
API keys are encrypted with `PEP_LLM_KEY_ENCRYPTION_SECRET` and never returned in full in responses. The default provider is deepseek.
:::

## GET /api/ai/providers

- **Method**: `GET`
- **Path**: `/api/ai/providers`
- **Auth**: Login required
- **Purpose**: List the current user's AI provider configurations.

```bash
curl http://127.0.0.1:8081/api/ai/providers \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

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

- **Method**: `GET`
- **Path**: `/api/ai/provider-presets`
- **Auth**: None
- **Purpose**: List built-in provider presets (deepseek, openai, etc.) with recommended `base_url` and default model.

```bash
curl http://127.0.0.1:8081/api/ai/provider-presets
```

Example response excerpt (`200`; values are illustrative):

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

- **Method**: `POST`
- **Path**: `/api/ai/providers`
- **Auth**: Login required
- **Purpose**: Create an AI provider config. `api_key` is required and is encrypted at rest.

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

Request body:

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

Example response excerpt (`200`; values are illustrative): returns the newly created provider config (without the key ciphertext). Invalid params return `400`; missing encryption config returns `503`.

## PATCH /api/ai/providers/{provider_id}

- **Method**: `PATCH`
- **Path**: `/api/ai/providers/{provider_id}`
- **Auth**: Login required
- **Purpose**: Update a provider config. `api_key` is optional; when provided, the key is rotated.

**Path parameters**:

| Param | Description |
| --- | --- |
| `provider_id` | Provider config ID |

```bash
curl -X PATCH http://127.0.0.1:8081/api/ai/providers/prov-1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"model": "deepseek-v4-pro", "enabled": true}'
```

Request body (all fields optional):

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

Example response excerpt (`200`; values are illustrative): returns the updated provider config. Not found returns `404`.

## DELETE /api/ai/providers/{provider_id}

- **Method**: `DELETE`
- **Path**: `/api/ai/providers/{provider_id}`
- **Auth**: Login required
- **Purpose**: Delete a provider config.

**Path parameters**:

| Param | Description |
| --- | --- |
| `provider_id` | Provider config ID |

```bash
curl -X DELETE http://127.0.0.1:8081/api/ai/providers/prov-1 \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{ "provider_id": "prov-1", "deleted": true }
```

Not found returns `404`.

## POST /api/ai/providers/{provider_id}/test

- **Method**: `POST`
- **Path**: `/api/ai/providers/{provider_id}/test`
- **Auth**: Login required
- **Purpose**: Test provider connectivity by sending a short test message. Disabled providers return `400`.

**Path parameters**:

| Param | Description |
| --- | --- |
| `provider_id` | Provider config ID |

```bash
curl -X POST http://127.0.0.1:8081/api/ai/providers/prov-1/test \
  -b cookies.txt
```

Example response excerpt (`200`; values are illustrative):

```json
{
  "ok": true,
  "provider": "deepseek",
  "model": "deepseek-flash",
  "answer_preview": "OK",
  "usage": { "total_tokens": 16 }
}
```

Configuration error returns `503`; provider API error returns `502`.
