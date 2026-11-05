# 数据库迁移

PepPlatform 使用 Alembic 管理数据库 schema 迁移。本页介绍迁移链、操作命令以及 Docker 与本地开发的差异。

## 迁移链

当前源码定义了 12 个线性迁移，head 为 `20260918_0012`。下表按 `alembic/versions/` 的 revision 声明核对。

| 变更 | 修订 ID | 上一迁移 |
| --- | --- | --- |
| 初始认证与元数据 | `20260605_0001` | — |
| 用户资料 | `20260607_0002` | `20260605_0001` |
| 管理员配额与审计 | `20260608_0003` | `20260607_0002` |
| AI Provider 配置 | `20260609_0004` | `20260608_0003` |
| 执行计划 | `20260610_0005` | `20260609_0004` |
| 多轮迭代 | `20260611_0006` | `20260610_0005` |
| 聊天历史 | `20260719_0007` | `20260611_0006` |
| 联网搜索元数据 | `20260719_0008` | `20260719_0007` |
| 语言偏好与生成名称 | `20260720_0009` | `20260719_0008` |
| 实验诊断会话 | `20260720_0010` | `20260720_0009` |
| 结构化实验名称 | `20260721_0011` | `20260720_0010` |
| 内容版本 | `20260918_0012` | `20260721_0011` |

存在 downgrade 函数不代表可无损回滚。修改 schema 前应检查目标迁移并保留数据库与运行时备份。

## 操作命令

### 升级到最新版本

```bash
# Docker：自动执行（容器启动时 backend.Dockerfile CMD）
# 无需手动操作

# 本地开发：手动执行
alembic upgrade head
```

### 查看迁移历史

```bash
alembic history
```

### 回滚一个版本

```bash
alembic downgrade -1
```

### 回滚到指定版本

```bash
alembic downgrade 20260608_0003
```

## Docker vs 本地开发

| 场景 | 迁移执行方式 | 连接字符串来源 |
| --- | --- | --- |
| Docker Compose | 自动——容器启动时执行 `alembic upgrade head`（`docker/backend.Dockerfile`） | `PEP_DATABASE_URL` 环境变量（`docker-compose.yml` 中设置为 PostgreSQL） |
| 本地开发（SQLite） | 手动执行 `alembic upgrade head` | `alembic.ini` 中的 `sqlalchemy.url = sqlite:///.pepplatform_web/metadata.sqlite3` |
| 本地开发（PostgreSQL） | 手动执行 `alembic upgrade head` | `PEP_DATABASE_URL` 环境变量 |

::: tip env.py 逻辑
`alembic/env.py` 从进程环境读取 `PEP_DATABASE_URL`，未设置时回退到 `alembic.ini` 中的 SQLite 路径。它不加载项目 `.env`，选择其他数据库时需先导出连接变量。

Alembic 运行时使用 `pool.NullPool`（`alembic/env.py`），适合一次性迁移执行。
:::

## 运行时补偿机制

除了 Alembic 迁移，`MetadataStore.init_schema()`（`pepplatform/web/store.py`）在每次启动时执行轻量级补偿：

1. `STORE_METADATA.create_all(engine)` — 创建缺失的表
2. `_ensure_user_profile_columns()` — 幂等添加用户资料列
3. `_ensure_owner_columns()` — 幂等添加 owner 列
4. `_ensure_agent_columns()` — 幂等添加 Agent 相关列
5. `_ensure_localization_columns()` — 语言偏好与生成名称元数据
6. `_ensure_experiment_failure_column()` — 结构化训练失败
7. `_ensure_experiment_resume_column()` — 下游恢复元数据


这些启动辅助逻辑会创建缺失表并补齐部分列，不能证明与任意历史数据库 schema 兼容。

::: warning 补偿机制不替代 Alembic
运行时补偿处理缺失表和部分列，不是通用的 schema 或数据迁移替代方案。生产环境必须依赖 Alembic 迁移链。
:::

## 迁移失败排查

### 检查数据库连接

```bash
# PostgreSQL
pg_isready -U pepplatform -d pepplatform

# 确认 PEP_DATABASE_URL
echo $PEP_DATABASE_URL
```

### 查看当前版本

```bash
alembic current
```

### 查看完整链

```bash
alembic history --verbose
```

### 常见问题

| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| `Can't load plugin: sqlalchemy.dialects:postgresql.psycopg` | 缺少 psycopg 驱动 | `pip install psycopg[binary]` |
| `Connection refused` | PostgreSQL 未启动或连接字符串错误 | 检查 `PEP_DATABASE_URL` 和 `pg_isready` |
| `Target database is not up to date` | 迁移链中间有未执行的迁移 | 先 `alembic upgrade head` |
| `sqlalchemy.exc.OperationalError` | 权限或网络问题 | 检查数据库用户权限和网络连通性 |

## 从旧版 SQLite 迁移到 PostgreSQL

命令、依赖与记录归属行为见[数据库导入指南](../install/database#从旧版-sqlite-导入-postgresql)。

## 下一步

- [备份与恢复](./backup-restore) — 数据库备份操作
- [运维操作](./operations) — 日常运维与健康检查
