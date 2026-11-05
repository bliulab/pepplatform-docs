# 部署架构总览

::: info 源码获取
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

PepPlatform 使用 Docker Compose 作为生产部署方式，包含 3 个服务。本页介绍整体架构、服务关系与生产加固要点。

## 服务拓扑

```text
Browser -> Nginx / Vue (:8080)
                | /api
                v
          FastAPI (:8000)
                |
                +-> PostgreSQL (:5432)
                +-> pep_runtime (datasets, experiments, models, versions)
```

## 服务详解

### db — PostgreSQL 16

| 项 | 值 |
| --- | --- |
| 镜像 | `postgres:16` |
| 端口 | `5432`（仅容器内访问，不发布到宿主机） |
| 数据卷 | `postgres_data:/var/lib/postgresql/data` |
| 健康检查 | `pg_isready`，间隔 10s，超时 5s，重试 5 次 |
| 默认数据库 | `pepplatform`（可通过 `POSTGRES_DB` 配置） |

### backend — FastAPI

| 项 | 值 |
| --- | --- |
| 构建 | `docker/backend.Dockerfile`（基于 `python:3.10-slim`） |
| 端口 | `8000`（仅容器内访问） |
| 数据卷 | `pep_runtime:/var/lib/pepplatform` |
| 依赖 | `db`（健康检查通过后启动） |
| 启动命令 | `alembic upgrade head && uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8000` |

::: info 单 worker
Dockerfile 中 uvicorn 使用单 worker（无 `--workers` 参数）。生产环境如需多进程，参见 [运维操作](./operations)。
:::

### frontend — Nginx + Vue SPA

| 项 | 值 |
| --- | --- |
| 构建 | `docker/frontend.Dockerfile`（多阶段：Node 22 构建 → Nginx 1.27 部署） |
| 端口 | 容器内 `80`，映射到宿主机 `${PEP_HTTP_PORT:-8080}` |
| 配置 | `docker/nginx.conf` |
| 上传限制 | `client_max_body_size 512m`（支持大数据集上传） |

Nginx 配置要点：
- `/api/` 反向代理到 `http://backend:8000/api/`，转发 `Host`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`
- 其他路径走 SPA fallback：`try_files $uri $uri/ /index.html`

## 数据卷

| 卷名 | 服务 | 内容 | 备份优先级 |
| --- | --- | --- | --- |
| `postgres_data` | db | PostgreSQL 数据库（用户、实验、模型元数据） | **最高** |
| `pep_runtime` | backend | 运行时数据（数据集、实验产物、模型文件） | **高** |


## 生产加固

### 1. 替换部署占位配置

```bash
# 生成随机密钥
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export PEP_SESSION_SECRET=$(openssl rand -hex 32)
export PEP_INITIAL_ADMIN_EMAIL='admin@example.com'
export PEP_INITIAL_ADMIN_PASSWORD=$(openssl rand -base64 16)
export PEP_LLM_KEY_ENCRYPTION_SECRET=$(openssl rand -hex 32)
```

或将以上变量写入 `.env` 文件（参见 [配置总览](../config/overview)）。

### 2. HTTPS / TLS 终止

PepPlatform 的 Docker 栈**不处理 TLS**——TLS 在外部反向代理（如 Nginx、Caddy、Cloudflare）终止。部署在 TLS 代理之后时：

```bash
export PEP_PUBLIC_BASE_URL='https://pep.example.com'
export PEP_COOKIE_SECURE=true
```

- `PEP_PUBLIC_BASE_URL` 告知后端公网地址，用于邮件链接和 Cookie 设置
- `PEP_COOKIE_SECURE=true` 强制会话 Cookie 仅通过 HTTPS 传输

## 完整启动流程

```bash
# 1. 进入可访问的源码工作副本
cd /path/to/PepPlatform

# 2. 创建 .env 文件
cp .env.example .env
# 按所用组件编辑配置


# 3. 构建并启动
docker compose up --build

# 4. 验证
curl http://127.0.0.1:8080/api/health
# 预期: {"ok":true,...}
```

## 下一步

- [数据库迁移](./migrations) — Alembic 迁移链与操作命令
- [备份与恢复](./backup-restore) — PostgreSQL 与运行时数据备份
- [运维操作](./operations) — 健康检查、日志、性能调优
- [配置参考](../config/overview) — 完整环境变量清单
