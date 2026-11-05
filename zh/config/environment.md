# 环境变量参考

本页按功能列出平台配置变量。后端默认值与 Compose 覆盖值可能不同，下表按对应场景说明。每项包含变量名、默认值、是否必需、说明及源码位置。

## 认证与会话

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_AUTH_ENABLED` | `1` | 否 | 认证总开关，设为 `0` 关闭认证（仅限开发） | `pepplatform/web/auth.py` |
| `PEP_SESSION_SECRET` | 本地：`dev-insecure-session-secret`；Compose：无默认值 | Compose 和生产环境必需 | 会话签名密钥，生产环境必须设为长随机字符串 | `pepplatform/web/auth.py` |
| `PEP_PUBLIC_BASE_URL` | `http://127.0.0.1:5173` | HTTPS 必需 | 平台公网基础 URL，用于 Cookie secure 标志和邮件链接生成 | `pepplatform/web/auth.py` |
| `PEP_COOKIE_SECURE` | 根据 `PEP_PUBLIC_BASE_URL` 协议推导 | 否 | 强制安全 Cookie，HTTPS 后设为 `true` | `pepplatform/web/auth.py` |
| `PEP_SESSION_DAYS` | `14` | 否 | 会话有效期（天），最小 1 | `pepplatform/web/auth.py` |
| `PEP_EMAIL_CODE_TTL_MINUTES` | `10` | 否 | 邮箱验证码 / 密码重置码有效期（分钟） | `pepplatform/web/auth.py` |
| `PEP_EMAIL_CODE_MAX_ATTEMPTS` | `5` | 否 | 验证码最大错误尝试次数，超出后失效 | `pepplatform/web/auth.py` |
| `PEP_ENV` | 本地：`development`；Compose：`production` | 公开部署必需 | 部署环境标识，设为 `production` 后关闭明文验证码回退 | `pepplatform/web/auth.py` |
| `PEP_AUTH_DEBUG_CODES` | 本地非生产环境为 `1`；Compose 为 `0` | 否 | 是否在发信失败时返回明文 `debug_code`；显式设置可覆盖 `PEP_ENV` 推导 | `pepplatform/web/auth.py` |
| `PEP_INITIAL_ADMIN_EMAIL` | — | 否 | 初始管理员邮箱（启动时创建） | `pepplatform/web/auth.py` |
| `PEP_INITIAL_ADMIN_PASSWORD` | — | 否 | 初始管理员密码 | `pepplatform/web/auth.py` |

::: warning debug_code 与生产环境
注册、重发验证、找回密码、管理员重发验证在发信失败时会返回明文 `debug_code`，便于本地开发。
`PEP_ENV=production` 默认关闭该回退；显式设置的 `PEP_AUTH_DEBUG_CODES` 优先，设为 `0` 可不返回调试码。所提供 Compose 默认使用 `PEP_ENV=production` 与 `PEP_AUTH_DEBUG_CODES=0`，并转发这两个设置。覆盖配置时应检查后端的实际环境。
:::

## 数据库

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_DATABASE_URL` | 未设置则用本地 SQLite（`.pepplatform_web/metadata.sqlite3`） | PostgreSQL 必需 | SQLAlchemy 连接字符串，格式 `postgresql+psycopg://user:pass@host:port/db` | `pepplatform/web/app.py` |
| `POSTGRES_PASSWORD` | 无默认值 | Compose 必需 | PostgreSQL 容器密码 | `docker-compose.yml` |
| `POSTGRES_USER` | `pepplatform` | 否 | PostgreSQL 用户名 | `docker-compose.yml` |
| `POSTGRES_DB` | `pepplatform` | 否 | PostgreSQL 数据库名 | `docker-compose.yml` |

::: tip Alembic 迁移
`alembic/env.py` 优先读取 `PEP_DATABASE_URL`，未设置时回退到 `alembic.ini` 中的 SQLite 路径。这意味着同一份 `alembic.ini` 同时适用于本地 SQLite 和 Docker PostgreSQL。
:::

## SMTP 邮件

启用公开注册前需配置 SMTP。`smtp_configured` 要求同时设置 `PEP_SMTP_HOST` 和 `PEP_SMTP_FROM`（`auth.py`）。

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_SMTP_HOST` | — | 邮件功能必需 | SMTP 服务器地址 | `pepplatform/web/auth.py` |
| `PEP_SMTP_PORT` | `587` | 否 | SMTP 端口；`465`/`994` 自动切换为隐式 TLS | `pepplatform/web/auth.py` |
| `PEP_SMTP_USER` | — | SMTP 服务要求认证时 | SMTP 登录账号（QQ/163/126 为完整邮箱地址） | `pepplatform/web/auth.py` |
| `PEP_SMTP_PASSWORD` | — | SMTP 服务要求认证时 | SMTP 密码或邮箱授权码 | `pepplatform/web/auth.py` |
| `PEP_SMTP_FROM` | 同 `PEP_SMTP_USER` | 邮件功能必需 | 发件人地址；QQ/163/126 必须与登录账号一致 | `pepplatform/web/auth.py` |
| `PEP_SMTP_SSL` | `auto` | 否 | 隐式 TLS 开关。`auto` 按端口判断（465/994 开、其余关），`1`/`0` 强制覆盖 | `pepplatform/web/auth.py` |
| `PEP_SMTP_STARTTLS` | `1` | 否 | STARTTLS 升级开关（隐式 TLS 时自动关闭）；仅本地 MailHog 一类服务才应关闭 | `pepplatform/web/auth.py` |
| `PEP_SMTP_TIMEOUT` | `15` | 否 | 连接/发信超时（秒，最小 1） | `pepplatform/web/auth.py` |

::: tip 连接方式
`587` + STARTTLS（默认）与 `465` + 隐式 TLS 都支持。TLS 握手使用系统 CA 校验服务器证书（`ssl.create_default_context`），
证书不匹配会直接发信失败，不会静默降级。如果服务商只提供 465，**只需改端口**，不需要改代码。
:::

::: tip QQ 邮箱示例
```bash
PEP_SMTP_HOST=smtp.qq.com
PEP_SMTP_PORT=587
PEP_SMTP_USER=your_sender@qq.com
PEP_SMTP_PASSWORD='QQ 邮箱设置 → 账号与安全 → 安全设置 中生成的授权码'
PEP_SMTP_FROM=your_sender@qq.com
```
密码是[邮箱授权码](https://help.mail.qq.com/detail/106/985)，不是 QQ 登录密码。
配置完成后，可通过注册或密码重置流程验证发信；后端仅在启动时读取 SMTP 配置。
:::

## AI / LLM

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_LLM_KEY_ENCRYPTION_SECRET` | — | 所提供 Compose 启动时必需；本地用于保存 AI 密钥 | 加密用户保存的 AI API Key，至少 16 字符，需保留原值以读取既有密文 | `pepplatform/web/ai.py` |
| `PEP_LLM_HTTP_TIMEOUT_SECONDS` | `60` | 否 | AI Provider HTTP 请求超时（秒） | `pepplatform/web/ai.py` |
| `PEP_LLM_MAX_CONTEXT_CHARS` | `60000` | 否 | 发送给 LLM 的 JSON 上下文最大字符数（最小 8000，超出截断） | `pepplatform/web/ai.py` |
| `PEP_TAVILY_API_KEY` | — | 联网搜索必需 | 服务器级 Tavily Free/Researcher Key；必须关闭 PAYGO，密钥不会发送到前端 | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_ENABLED` | `true` | 否 | Agent 问答联网搜索总开关；缺少 Tavily Key 时仍保持不可用 | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_TIMEOUT_SECONDS` | `12` | 否 | Tavily 用量与搜索请求超时（秒） | `pepplatform/web/web_search.py` |
| `PEP_WEB_SEARCH_USAGE_CACHE_SECONDS` | `300` | 否 | Tavily 免费额度状态缓存时间（秒） | `pepplatform/web/web_search.py` |

::: warning PEP_LLM_KEY_ENCRYPTION_SECRET
该密钥用于加密所有用户保存的 AI Provider API Key。**轮换该值会导致已保存的密钥全部失效**。详见 [配置总览](./overview#pep-llm-key-encryption-secret-稳定性警告)。
:::

## Web / 前端

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `VITE_API_TARGET` | `http://127.0.0.1:8081` | 否 | Vite dev server 的 `/api` 代理目标，仅用于开发服务器代理，不写入客户端构建产物 | `frontend/vite.config.ts` |
| `PEP_HTTP_PORT` | `8080` | 否 | Docker Compose 前端容器映射的宿主机端口 | `docker-compose.yml` |

::: tip 前端无 import.meta.env
前端代码中**不使用** `import.meta.env.*`。唯一的 Vite 变量 `VITE_API_TARGET` 仅在 `vite.config.ts` 中用于 dev proxy 配置，不会出现在客户端构建产物中。
:::

## BLAST / Profile

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` | `300` | 否 | Profile 编码器推理时 PSI-BLAST / makeblastdb 子进程超时（秒），大数据库需增大此值 | `pepplatform/web/inference.py` |
| `PEP_TOP_NGRAM_MAX_RESIDUES` | `10000` | 否 | 单条序列使用 Top-n-gram 时允许的最大残基数；只限制 Top-n-gram，不影响数据集的其他实验路线 | `pepplatform/top_ngram.py` |

## 推理

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEPPLATFORM_INFERENCE_BATCH_SIZE` | 模型元数据中的 `inference_batch_size` / `predict_batch_size` / `batch_size`，再回退到 `64` | 否 | Web 推理时的通用批大小覆盖值，必须为正整数 | `pepplatform/web/inference.py` |
| `PEPPLATFORM_GRAPH_INFERENCE_BATCH_SIZE` | 当前请求样本数 | 否 | 图预测器推理批大小覆盖值，必须为正整数，实际值不会超过当前请求样本数 | `pepplatform/web/inference.py` |

## 运行时

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEP_RUNTIME_ROOT` | `<project>/.pepplatform_web` | 否 | 运行时数据根目录（数据集、实验、模型、SQLite），Docker 中设为 `/var/lib/pepplatform` | `pepplatform/web/paths.py` |

## 离线模式 / Hugging Face

| 变量 | 默认值 | 必需 | 说明 | 源码 |
| --- | --- | --- | --- | --- |
| `PEPPLATFORM_OFFLINE_MODE` | — | 否 | 设为 `1`/`true`/`yes`/`on` 启用离线模式，强制使用本地预训练模型，缺失时快速报错 | `pepplatform/web/preflight.py` |
| `PEPPLATFORM_HF_ENDPOINT` | `https://hf-mirror.com` | 否 | PepPlatform 专用 HF 镜像端点，优先级低于 `HF_ENDPOINT` | `pepplatform/web/preflight.py` |
| `HF_ENDPOINT` | — | 否 | 标准 Hugging Face 端点，优先级高于 `PEPPLATFORM_HF_ENDPOINT` | `pepplatform/web/preflight.py` |
| `HF_HOME` | — | 否 | Hugging Face 主目录，`<HF_HOME>/hub` 用于搜索缓存的预训练模型 | `pepplatform/workflow.py` |
| `HUGGINGFACE_HUB_CACHE` | — | 否 | Hugging Face hub 缓存目录，优先搜索 | `pepplatform/workflow.py` |

::: info 训练子进程注入的环境变量
`ExperimentRunner.build_subprocess_env()`（`pepplatform/web/runner.py`）在启动训练子进程时自动注入以下变量，用户无需手动配置：

| 变量 | 注入条件 |
| --- | --- |
| `HF_HUB_OFFLINE=1` | 离线模式开启时 |
| `TRANSFORMERS_OFFLINE=1` | 离线模式开启时 |
| `HF_HUB_DISABLE_XET=1` | 始终注入（若未设置） |
| `HF_HUB_DOWNLOAD_TIMEOUT=120` | 始终注入（若未设置） |
| `HF_HUB_ETAG_TIMEOUT=30` | 始终注入（若未设置） |
:::

## 下一步

- [配置总览](./overview) — 配置来源、`.env` 加载机制、密钥生成
- [部署运维](../deploy/overview) — 生产部署与加固

## 集成与 ESM3 运行时

| 变量 | 默认值 | 说明 | 源码 |
| --- | --- | --- | --- |
| `PEP_WEB_ENSEMBLES_ENABLED` | `1` | 控制新集成创建，已有模型推理与历史保留 | `pepplatform/web/ensemble_service.py` |
| `PEPPLATFORM_ESM3_IDLE_TTL_SECONDS` | `300` | ESM3 推理运行时空闲保留秒数，最小 1；非法数值回退到 300 | `pepplatform/web/inference.py` |

Compose 显式传入集成开关，目前不自动转发 ESM3 空闲覆盖值；容器部署如需调整，应在 backend 的环境配置中显式添加。
