# 管理员

管理员模块提供用户管理、配额调整、会话控制与审计日志查询。所有接口均要求管理员权限（`role: admin`），已登录的非管理员访问返回 `403`；启用认证时，未登录请求返回 `401`。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## GET /api/admin/overview

- **方法**: `GET`
- **路径**: `/api/admin/overview`
- **认证**: 需要管理员
- **用途**: 获取管理概览中的用户、工作负载与最近 24 小时安全指标。

```bash
curl http://127.0.0.1:8081/api/admin/overview \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "generated_at": "2026-07-20T12:00:00+00:00",
  "usage_date": "2026-07-20",
  "users": {
    "total": 42,
    "active": 39,
    "disabled": 3,
    "unverified": 5,
    "new_last_7_days": 7
  },
  "workload": {
    "experiments_created_today": 18,
    "inference_requests_today": 230,
    "inference_inputs_today": 14500,
    "active_experiments": 4
  },
  "security_24h": {
    "failed_logins": 2,
    "admin_actions": 6,
    "session_revoke_events": 1,
    "user_deletions": 0
  }
}
```

`usage_date` 与名称含 `today` 的工作负载指标均按 UTC 自然日统计；安全指标按接口调用时间向前滚动 24 小时统计。

## GET /api/admin/users

- **方法**: `GET`
- **路径**: `/api/admin/users`
- **认证**: 需要管理员
- **用途**: 列出用户，支持搜索、按角色/状态/邮箱验证情况筛选与分页。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `search` | string | 空 | 按邮箱/显示名模糊搜索 |
| `role` | string | 空 | `admin` 或 `user` |
| `status` | string | 空 | `active` 或 `disabled` |
| `email_verified` | bool | 空 | 按邮箱验证状态筛选 |
| `sort` | string | `created_at` | 排序字段：`created_at`、`display_name`、`email`、`role` 或 `status` |
| `order` | string | `desc` | 排序方向：`asc` 或 `desc` |
| `limit` | int | 50 | 每页数量，最大 200 |
| `offset` | int | 0 | 偏移量 |

```bash
curl "http://127.0.0.1:8081/api/admin/users?role=user&status=active&limit=20" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回用户列表分页结果（含 `items`、`total`、`limit`、`offset`）。每个用户摘要包含配额、UTC 当日用量和资源统计。角色、状态、排序字段或排序方向非法返回 `400`。

## GET /api/admin/users/{user_id}

- **方法**: `GET`
- **路径**: `/api/admin/users/{user_id}`
- **认证**: 需要管理员
- **用途**: 获取用户详细信息（含资源统计、配额、会话数等）。

**路径参数**：

| 参数 | 说明 |
| --- | --- |
| `user_id` | 用户 ID |

```bash
curl http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回用户详情对象。不存在返回 `404`。

## PATCH /api/admin/users/{user_id}

- **方法**: `PATCH`
- **路径**: `/api/admin/users/{user_id}`
- **认证**: 需要管理员
- **用途**: 更新用户角色或状态。禁用用户时自动撤销其所有会话。不能降级或禁用自己的管理员权限。

```bash
curl -X PATCH http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"role": "admin", "status": "active"}'
```

请求体（字段可选）：

```json
{ "role": "admin", "status": "active" }
```

响应示例节选（`200`，值仅作示意）：返回更新后的用户摘要。值非法返回 `400`；试图移除自身管理员权限返回 `400`；不存在返回 `404`。

## POST /api/admin/users/{user_id}/revoke-sessions

- **方法**: `POST`
- **路径**: `/api/admin/users/{user_id}/revoke-sessions`
- **认证**: 需要管理员
- **用途**: 撤销指定用户的所有会话。不能撤销自己的会话。

```bash
curl -X POST http://127.0.0.1:8081/api/admin/users/a1b2c3d4/revoke-sessions \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "user": { "id": "a1b2c3d4", "email": "user@example.com" },
  "revoked_sessions": 3
}
```

试图撤销自身会话返回 `400`；不存在返回 `404`。

## POST /api/admin/users/{user_id}/resend-verification

- **方法**: `POST`
- **路径**: `/api/admin/users/{user_id}/resend-verification`
- **认证**: 需要管理员
- **用途**: 为用户重新发送邮箱验证码。已验证用户返回 `verification_sent: false`。

```bash
curl -X POST http://127.0.0.1:8081/api/admin/users/a1b2c3d4/resend-verification \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "user": { "id": "a1b2c3d4", "email": "user@example.com" },
  "verification_sent": true
}
```

不存在返回 `404`。

## DELETE /api/admin/users/{user_id}

- **方法**: `DELETE`
- **路径**: `/api/admin/users/{user_id}`
- **认证**: 需要管理员
- **用途**: 删除用户（不删除其资源）。不能删除自己。用户仍有资源时返回 `409`。

```bash
curl -X DELETE http://127.0.0.1:8081/api/admin/users/a1b2c3d4 \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "user_id": "a1b2c3d4",
  "email": "user@example.com",
  "deleted": true,
  "deleted_counts": { "sessions": 3 }
}
```

试图删除自己返回 `400`；用户有资源返回 `409`；不存在返回 `404`。

## PATCH /api/admin/users/{user_id}/quotas

- **方法**: `PATCH`
- **路径**: `/api/admin/users/{user_id}/quotas`
- **认证**: 需要管理员
- **用途**: 更新用户配额限制。

```bash
curl -X PATCH http://127.0.0.1:8081/api/admin/users/a1b2c3d4/quotas \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "daily_experiment_limit": 20,
    "daily_concurrent_experiment_limit": 4,
    "daily_inference_request_limit": 100,
    "daily_inference_input_limit": 10000
  }'
```

请求体：

```json
{
  "daily_experiment_limit": 20,
  "daily_concurrent_experiment_limit": 4,
  "daily_inference_request_limit": 100,
  "daily_inference_input_limit": 10000
}
```

响应示例节选（`200`，值仅作示意）：返回更新后的完整配额对象。参数非法返回 `400`；不存在返回 `404`。

## GET /api/admin/audit-logs

- **方法**: `GET`
- **路径**: `/api/admin/audit-logs`
- **认证**: 需要管理员
- **用途**: 查询审计日志，支持全文搜索、按事件类型或用户作用域及日期范围筛选与分页。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `event_type` | string | 空 | 按事件类型筛选（如 `auth.login_failed`） |
| `actor_user_id` | string | 空 | 按操作者筛选 |
| `target_user_id` | string | 空 | 按目标用户筛选 |
| `user_id` | string | 空 | 匹配操作者或目标用户，适合用户活动页 |
| `search` | string | 空 | 搜索事件类型、IP、元数据及操作者/目标用户的邮箱或显示名 |
| `created_from` | string | 空 | 起始日期（ISO 格式） |
| `created_to` | string | 空 | 截止日期（ISO 格式） |
| `limit` | int | 50 | 每页数量 |
| `offset` | int | 0 | 偏移量 |

```bash
curl "http://127.0.0.1:8081/api/admin/audit-logs?event_type=auth.login_failed&limit=20" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回审计日志分页结果（含 `items`、`total`、`limit`、`offset`）。每条记录同时包含已解析的 `actor` 与 `target` 用户摘要（用户已删除时为 `null`）。

## GET /api/admin/audit-event-types

- **方法**: `GET`
- **路径**: `/api/admin/audit-event-types`
- **认证**: 需要管理员
- **用途**: 返回当前审计日志中存在的事件类型，供筛选器使用。

```bash
curl http://127.0.0.1:8081/api/admin/audit-event-types \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：返回 `{ "items": [{ "event_type": "auth.login_failed", "count": 12 }] }`。事件类型去重后按出现次数降序排列，同次数按名称排序。
