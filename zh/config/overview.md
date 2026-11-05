# 配置总览

PepPlatform 通过环境变量配置。Web 后端、CLI 命令和 Docker Compose 的加载方式有所不同。

## 配置来源与优先级

Web 后端按以下顺序读取配置，**先到先得**：

```
1. 进程环境变量
       ↓ 若未设置
2. 项目根目录 .env 文件
       ↓ 若未设置
3. 代码中的默认值
```

`.env` 只补充进程环境中尚未设置的变量。

## `.env` 自动加载

Web 后端启动时加载项目根目录的 `.env`，支持 `KEY=VALUE` 和 `export KEY=VALUE` 格式，不覆盖已有的进程环境变量。

这意味着你可以：

```bash
# 方式一：创建 .env 文件
cp .env.example .env
# 编辑 .env 填入密钥，然后直接启动
python -m uvicorn pepplatform.web.app:app --port 8081

# 方式二：export 环境变量（优先级更高，会覆盖 .env 中的同名值）
export PEP_LLM_KEY_ENCRYPTION_SECRET='replace-with-a-stable-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --port 8081
```

## Docker 与本地的差异

| 场景 | 配置方式 | 注意事项 |
| --- | --- | --- |
| Docker Compose | Shell 环境变量或项目 `.env` 为 `docker-compose.yml` 提供值 | Shell 环境变量优先于 `.env`；只有显式配置的变量会进入容器 |
| 本地 Web 开发 | `.env` 文件或 `export` | 后端自动加载 `.env`；前端通过 `frontend/.env.local` 配置 Vite proxy |
| CLI 训练与 Alembic | `export` | 读取进程环境变量，不自动加载项目 `.env` |

为 Compose 增加后端配置时，参见[容器环境覆盖](../install/docker#容器环境覆盖)。

::: warning 默认值差异
部分变量的默认值在代码和 `docker-compose.yml` 中不同：

- `PEP_SESSION_SECRET`：代码默认 `dev-insecure-session-secret`，docker-compose 默认 `change-me-before-production`
- `PEP_PUBLIC_BASE_URL`：代码默认 `http://127.0.0.1:5173`（Vite 端口），docker-compose 默认 `http://127.0.0.1:8080`（前端容器端口）

生产环境务必显式设置这些变量。
:::

## 生产部署配置

替换所使用组件的部署占位配置。初始化管理员是可选操作，使用时需同时提供邮箱与密码。

| 配置项 | 取值或生成方式 |
| --- | --- |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `PEP_SESSION_SECRET` | `openssl rand -hex 32` |
| `PEP_INITIAL_ADMIN_PASSWORD` | `openssl rand -base64 16` |
| `PEP_LLM_KEY_ENCRYPTION_SECRET` | `openssl rand -hex 32` |
| `PEP_INITIAL_ADMIN_EMAIL` | 管理员邮箱地址 |

```bash
# 生成随机密钥示例
openssl rand -hex 32    # 用于 PEP_SESSION_SECRET / PEP_LLM_KEY_ENCRYPTION_SECRET
openssl rand -base64 32 # 用于 POSTGRES_PASSWORD
openssl rand -base64 16 # 用于 PEP_INITIAL_ADMIN_PASSWORD
```

## PEP_LLM_KEY_ENCRYPTION_SECRET 稳定性警告

::: danger 不可轮换
`PEP_LLM_KEY_ENCRYPTION_SECRET` 用于加密用户保存的 AI Provider API Key（PBKDF2-HMAC-SHA256 + XOR stream + HMAC）。

- **至少 16 个字符**，推荐 `openssl rand -hex 32` 生成。
- **重启与备份之间必须保持稳定**——该值存储在环境变量中，不在数据库里。
- **轮换该值会导致已保存的所有 AI Provider 密钥无法解密而失效**，需重新配置每个 AI 密钥。
- Docker Compose 启动时强制要求设置此变量（`docker-compose.yml` 使用 `${...:?}` 语法）。
:::

## 下一步

- [环境变量参考](./environment) — 所有环境变量的完整清单
- [部署运维](../deploy/overview) — 生产部署与加固
