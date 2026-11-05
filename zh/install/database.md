# 数据库配置

PepPlatform 的元数据（用户、实验、模型记录等）支持两种存储后端：生产环境使用 PostgreSQL，本地开发默认使用 SQLite，无需额外配置。

## PostgreSQL（生产环境）

Docker Compose 部署默认使用 PostgreSQL 16。后端通过 `PEP_DATABASE_URL` 连接数据库，连接字符串格式为：

```
PEP_DATABASE_URL=postgresql+psycopg://用户名:密码@主机:端口/数据库名
```

Docker Compose 中默认值为：

```bash
PEP_DATABASE_URL=postgresql+psycopg://pepplatform:pepplatform@db:5432/pepplatform
```

::: warning
生产环境请务必通过 `POSTGRES_PASSWORD` 等环境变量替换默认的弱密码。详见 [Docker Compose 部署](./docker)。
:::

## SQLite（本地开发默认）

本地 Web 开发时，若**未设置** `PEP_DATABASE_URL`，后端会自动使用 SQLite，数据库文件位于：

```
.pepplatform_web/metadata.sqlite3
```

无需安装任何数据库服务，开箱即用。详见 [本地 Web 开发](./local-web)。

## Alembic 数据库迁移

PepPlatform 使用 Alembic 管理数据库 schema 迁移。

- **Docker 部署**：后端容器启动时自动执行 `alembic upgrade head`（见 `docker/backend.Dockerfile` 的 CMD），无需手动操作。
- **本地开发**：首次启动后端前，若 schema 有变更，可手动执行：

```bash
alembic upgrade head
```

## 从旧版 SQLite 导入 PostgreSQL

在平台源码根目录运行，所用环境需安装 Web 依赖并能访问目标 PostgreSQL。先导出下列命令使用的目标连接与管理员变量；该命令不加载项目 `.env`。

```bash
python -m scripts.import_legacy_sqlite \
  --source .pepplatform_web/metadata.sqlite3 \
  --target "$PEP_DATABASE_URL" \
  --admin-email "$PEP_INITIAL_ADMIN_EMAIL" \
  --admin-password "$PEP_INITIAL_ADMIN_PASSWORD"
```

::: info 参数说明

- `--source`：源 SQLite 文件路径
- `--target`：目标 PostgreSQL 连接字符串
- `--admin-email` / `--admin-password`：导入记录归属的管理员账号
:::

已存在的 ID 会跳过，新导入的记录归属指定管理员。

## 下一步

- 数据库配置完成后，参考 [安装验证](./verify) 确认连接正常。
- 其他可调参数请查阅 [可选配置](./optional-config)。
