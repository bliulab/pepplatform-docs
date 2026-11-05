# 认证

认证模块负责用户注册、邮箱验证、登录会话、个人资料，以及密码重置流程。PepPlatform 使用基于 Cookie 的会话认证：登录或邮箱验证成功后，服务端会设置 `pep_session` Cookie，后续请求需携带该 Cookie 以标识身份。

## 网页入口与访客预览

平台根地址 `/` 和兼容地址 `/welcome` 始终显示 Welcome，适合作为论文中的平台链接。工作台地址为 `/dashboard`。

开启认证时，访客可以浏览功能界面、切换配置步骤并填写普通表单字段。数据集、实验、模型、排行榜和聊天历史等个人资源仍需登录后查看；指向具体资源的详情链接、账户设置和管理后台也要求登录。上传、预检、训练、集成创建、推理和 AI 请求会在实际操作前引导登录，后端继续执行原有身份和资源归属检查。

登录默认进入 `/dashboard`；从功能页发起登录时，登录、注册及邮箱验证流程会保留站内返回地址，密码重置也保留该地址。普通表单草稿仅暂存于当前标签页的 `sessionStorage`，恢复后删除；文件、密码和 API 密钥不包含在草稿中。登录后需再次点击执行，文件需重新选择。退出后返回 Welcome，并清理个人查询缓存、聊天状态和草稿。

右上角使用“账户 / Account”文字菜单，包含资料设置、AI 服务和退出登录；管理员额外拥有管理入口。

`PEP_AUTH_ENABLED=0` 仍允许在 `/dashboard` 直接使用本地工作台，根地址仍为 Welcome。公开部署应保留认证开启。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

::: warning 基础地址
本地开发环境基础地址为 `http://127.0.0.1:8081/api`；Docker 部署环境为 `http://127.0.0.1:8080/api`。以下示例以本地开发地址为准。
:::

## POST /api/auth/register

- **方法**: `POST`
- **路径**: `/api/auth/register`
- **认证**: 无需认证
- **用途**: 注册新用户，邮箱需合法，密码至少 8 位；注册后发送验证邮件。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

请求体：

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "auth_enabled": true,
  "user": {
    "id": "a1b2c3d4",
    "email": "user@example.com",
    "display_name": "user",
    "email_verified": false,
    "role": "user",
    "status": "active"
  },
  "quota": { "daily_experiment_limit": 10, "daily_concurrent_experiment_limit": 2, "daily_inference_request_limit": 50, "daily_inference_input_limit": 5000 },
  "usage": { "experiments_created": 0, "inference_requests": 0, "inference_inputs": 0 },
  "resource_counts": { "experiments": 0, "models": 0, "datasets": 0, "inference_runs": 0 },
  "verification_sent": true,
  "email": "user@example.com"
}
```

::: tip 邮件未配置或发信失败时
当 SMTP 未配置或发信失败时，`verification_sent` 为 `false`。开发环境（`PEP_ENV` 不为 `production`）会额外返回 `debug_code` 字段；
生产环境默认不返回该字段，但显式 `PEP_AUTH_DEBUG_CODES` 可覆盖默认值。详见[环境变量](../config/environment#认证与会话)。
:::

## POST /api/auth/verify-email

- **方法**: `POST`
- **路径**: `/api/auth/verify-email`
- **认证**: 无需认证
- **用途**: 使用邮件验证码验证邮箱，验证成功后创建会话并设置 Cookie。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "user@example.com", "code": "123456"}'
```

请求体：

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

响应示例节选（`200`，值仅作示意）：返回包含 `user`、`quota`、`usage` 的认证载荷，并通过 `Set-Cookie` 设置 `pep_session`。验证码错误或过期返回 `400`。

## POST /api/auth/resend-verification

- **方法**: `POST`
- **路径**: `/api/auth/resend-verification`
- **认证**: 无需认证
- **用途**: 重新发送邮箱验证码。若邮箱已验证则返回 `verification_sent: false`。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

请求体：

```json
{ "email": "user@example.com" }
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "auth_enabled": true,
  "user": { "id": "a1b2c3d4", "email": "user@example.com", "email_verified": false, "role": "user", "status": "active" },
  "verification_sent": true,
  "email": "user@example.com"
}
```

## POST /api/auth/login

- **方法**: `POST`
- **路径**: `/api/auth/login`
- **认证**: 无需认证
- **用途**: 使用邮箱和密码登录，成功后设置会话 Cookie。账户被禁用或邮箱未验证时返回 `403`。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

请求体：

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

响应示例节选（`200`，值仅作示意）：返回认证载荷（含 `user`、`quota`、`usage`、`resource_counts`）并设置 Cookie。凭据错误返回 `401`。

## POST /api/auth/logout

- **方法**: `POST`
- **路径**: `/api/auth/logout`
- **认证**: 无需有效会话；清除请求中的 Cookie
- **用途**: 撤销当前会话并清除 Cookie。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/logout \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{ "ok": true }
```

## GET /api/auth/me

- **方法**: `GET`
- **路径**: `/api/auth/me`
- **认证**: 需要登录
- **用途**: 获取当前登录用户信息，包括配额与使用量。

```bash
curl http://127.0.0.1:8081/api/auth/me \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "auth_enabled": true,
  "user": {
    "id": "a1b2c3d4",
    "email": "user@example.com",
    "display_name": "User Name",
    "email_verified": true,
    "role": "user",
    "status": "active"
  },
  "quota": { "daily_experiment_limit": 10, "daily_concurrent_experiment_limit": 2, "daily_inference_request_limit": 50, "daily_inference_input_limit": 5000 },
  "usage": { "experiments_created": 0, "inference_requests": 0, "inference_inputs": 0 },
  "resource_counts": { "experiments": 0, "models": 0, "datasets": 0, "inference_runs": 0 }
}
```

## PATCH /api/auth/profile

- **方法**: `PATCH`
- **路径**: `/api/auth/profile`
- **认证**: 需要登录
- **用途**: 更新当前用户的显示名称（最多 40 个字符，不能含控制字符）。

```bash
curl -X PATCH http://127.0.0.1:8081/api/auth/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"display_name": "My Name"}'
```

请求体：

```json
{ "display_name": "My Name" }
```

响应示例节选（`200`，值仅作示意）：返回更新后的认证载荷。

## POST /api/auth/password-reset/request

- **方法**: `POST`
- **路径**: `/api/auth/password-reset/request`
- **认证**: 无需认证
- **用途**: 按邮箱请求密码重置验证码。请求体被接受后，无论邮箱是否存在均返回 `200`；是否投递需查看 `reset_sent`，不能只看 HTTP 状态。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

请求体：

```json
{ "email": "user@example.com" }
```

响应示例节选（`200`，值仅作示意）：

```json
{ "ok": true, "reset_sent": true, "email": "user@example.com" }
```

## POST /api/auth/password-reset/confirm

- **方法**: `POST`
- **路径**: `/api/auth/password-reset/confirm`
- **认证**: 无需认证
- **用途**: 使用验证码和新密码完成重置，新密码至少 8 位。验证码错误或过期返回 `400`。

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456", "password": "newpass456"}'
```

请求体：

```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "newpass456"
}
```

响应示例节选（`200`，值仅作示意）：返回认证载荷。验证码无效返回 `400`。

## PATCH /api/auth/preferences

更新当前账户的语言偏好，要求有效账户会话（即使部署关闭通用鉴权，此账户接口仍需要实际用户）。

```json
{"preferred_locale": "zh"}
```

`preferred_locale` 只接受 `zh` 或 `en`。返回与 `/api/auth/me` 同类的认证响应，非法值返回 400。它与只在当前浏览器切换界面语言的行为不同。
