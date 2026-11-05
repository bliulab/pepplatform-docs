# Docker Compose 部署

::: info 源码获取
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

所提供的 Docker Compose 配置用于构建 PostgreSQL、FastAPI 后端、Nginx 托管的 Vue 前端。使用对应功能前，需要准备配置、数据及相应模型资源；构建成功不表示所有训练或推理路线均已就绪。

## 前置条件

- 已安装 Docker 与 Docker Compose
- 确认环境满足 [环境要求](./requirements)

## 第一步：获取源码并配置密钥

```bash
git clone https://github.com/AlbertTeslaWizard/PepPlatform.git
cd PepPlatform
cp .env.example .env
openssl rand -hex 32
```

编辑 `.env`，为 `POSTGRES_PASSWORD`、`PEP_SESSION_SECRET` 和 `PEP_LLM_KEY_ENCRYPTION_SECRET` 分别生成独立值；命令每运行一次生成一个值。Compose 会拒绝空的必需密钥。数据库密码需适用于 URL，十六进制字符串即可。

如需首次启动时创建管理员，同时填写 `PEP_INITIAL_ADMIN_EMAIL` 和 `PEP_INITIAL_ADMIN_PASSWORD`。这两个字段默认留空；未配置 SMTP 时，应先创建管理员以便登录。邮件注册和密码重置仍需可用 SMTP。

::: warning 保持加密密钥稳定
`PEP_LLM_KEY_ENCRYPTION_SECRET` 用于加密用户保存的 AI API Key。请在重启与备份之间保留原值，变更后已有密文将无法读取。会话密钥也应保持稳定。不要将 `.env` 提交到仓库。
:::

## 第二步：启动服务

```bash
docker compose up --build
```

启动完成后，浏览器访问 <http://127.0.0.1:8080> 即可使用平台。

::: info 端口配置
默认对外端口为 `8080`，可通过 `PEP_HTTP_PORT` 环境变量修改。
:::

## 服务架构

`docker-compose.yml` 定义了 3 个服务：

| 服务 | 镜像 / 构建 | 说明 |
| --- | --- | --- |
| **db** | `postgres:16` | 元数据数据库，数据持久化在 `postgres_data` 卷 |
| **backend** | 本地构建 `docker/backend.Dockerfile` | FastAPI 后端，启动时自动执行 `alembic upgrade head` |
| **frontend** | 本地构建 `docker/frontend.Dockerfile` | Nginx 托管的 Vue 生产构建，对外暴露 80 端口 |

## SMTP 邮件配置

启用公开注册前，在 `.env` 中填写有效的 SMTP 设置。以下是需要替换的示例：

```bash
PEP_SMTP_HOST='smtp.example.com'
PEP_SMTP_PORT='587'
PEP_SMTP_USER='your-smtp-user'
PEP_SMTP_PASSWORD='your-smtp-password'
PEP_SMTP_FROM='noreply@example.com'
```

## HTTPS 部署

如部署在 TLS 反向代理之后，在 `.env` 中设置真实外部地址。未指定 `PEP_COOKIE_SECURE` 时，后端会根据 HTTPS 自动启用安全 Cookie，也可显式指定：

```bash
PEP_PUBLIC_BASE_URL='https://pep.example.com'
PEP_COOKIE_SECURE=true
```

## 导入旧版 SQLite 数据

将旧版 SQLite 元数据导入 PostgreSQL 的步骤见[数据库导入指南](./database#从旧版-sqlite-导入-postgresql)。

## 下一步

部署完成后，参考 [安装验证](./verify) 确认各服务正常运行。如需调整可选配置，请查阅 [可选配置](./optional-config)。

## 当前 Docker 资源范围

镜像安装 CPU 版 PyTorch，Compose 当前没有申请 GPU；宿主机有 GPU 并不意味着容器能够使用它。GPU 部署需要匹配的 PyTorch/CUDA 镜像和显式设备访问配置。`models/` 预训练快照被排除在构建上下文外，需要另行配置挂载、缓存或在线下载。源码发布包不附带数据集，且 `datasets/` 被排除在 Docker 构建上下文外，参见[内置数据集](../datasets/builtin)。

## 容器环境覆盖

Compose 默认转发 `PEP_ENV=production`、`PEP_AUTH_DEBUG_CODES=0`，不在发信失败时向用户返回调试验证码；公开注册前仍需配置 SMTP。仅限本地开发且需要调试验证码时，可在 `.env` 中同时设置 `PEP_ENV=development` 和 `PEP_AUTH_DEBUG_CODES=1`。SMTP 的 SSL、STARTTLS 和超时开关均已转发。

## 模型挂载与下载缓存

Hugging Face 下载缓存保存在 `pep_runtime` 卷的 `/var/lib/pepplatform/huggingface`。需要授权的模型可在 `.env` 中设置 `HF_TOKEN`，并先按模型提供方的要求获取访问权限。

若已准备好本地模型快照，在仓库根目录创建 `compose.models.yaml`：

```yaml
services:
  backend:
    volumes:
      - ./models:/app/models:ro
    environment:
      PEPPLATFORM_OFFLINE_MODE: "1"
```

然后执行 `docker compose -f docker-compose.yml -f compose.models.yaml up --build`。相对挂载路径从基础 Compose 文件所在目录解析；模型目录结构见 [CLI 离线模型](./cli-only#第五步-离线预训练模型-可选)。只在所需快照完整时启用离线模式。
