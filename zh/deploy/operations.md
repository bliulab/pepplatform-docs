# 运维操作

本页覆盖 PepPlatform 的日常运维操作：健康检查、日志查看、性能调优与版本升级。

## 健康检查

### `/api/health` 端点

```bash
curl http://127.0.0.1:8080/api/health
```

响应示例（节选；检查项省略）：

```json
{
  "ok": true,
  "dependencies": {
    "profile_inference": {
      "ready": true,
      "status": "ready",
      "checked_at": "2026-06-24T10:00:00Z",
      "checks": [],
      "errors": []
    }
  }
}
```

::: warning Liveness only
`ok` 字段始终为 `true`——这是存活检查（liveness），只要 FastAPI 进程在运行就返回 `true`。`profile_inference` 中的 `ready` 字段才是就绪检查（readiness），反映 BLAST+ 是否可用。

该端点**不会**在 `profile_inference` 不可用时返回非 200 状态码。
:::

### `profile_environment_readiness()` 检测内容

`pepplatform/web/profile_runtime.py` 检测：

1. `makeblastdb` 和 `psiblast` 二进制文件是否存在
2. 两者均存在时执行 BLAST 冒烟测试（构建临时数据库并生成 PSSM）
3. 结果缓存在模块全局变量中，`force=True` 可刷新

### 单模型推理就绪检查

```bash
curl http://127.0.0.1:8080/api/models/{model_id}/inference-readiness
```

返回特定模型是否可以从原始序列执行推理（预构建 DB vs 按需构建 vs 阻塞）。

### Docker 服务状态

```bash
# 查看所有服务状态
docker compose ps

# 预期输出：3 个服务（db/backend/frontend）均为 running
# db 应显示 "healthy"
```

## 日志

### 查看服务日志

```bash
# 查看所有服务日志
docker compose logs

# 查看指定服务日志
docker compose logs backend
docker compose logs frontend
docker compose logs db

# 实时跟踪日志
docker compose logs -f backend

# 查看最近 100 行
docker compose logs --tail 100 backend

# 查看指定时间后的日志
docker compose logs --since 2026-06-24T00:00:00 backend
```

::: tip 日志输出
后端容器设置 `PYTHONUNBUFFERED=1`（`docker/backend.Dockerfile`），确保日志实时输出到 stdout/stderr。使用 `docker compose logs` 即可查看完整日志。
:::

### 训练实验日志

每个实验行存储一个 `log_path`，指向实验 artifact 目录下的日志文件。训练子进程的输出写入该文件，而非集中式日志系统。

查看特定实验的日志需要访问 `pep_runtime` volume 中的 artifact 目录。

## 性能调优

### 单 worker 与训练生命周期

保持当前单 Uvicorn worker。每个应用进程各自拥有内存训练队列、Runner 线程和可视化任务；应用初始化还会把未完成实验标为已取消。增加 `--workers` 或直接启动多个后端副本不能实现协调调度，并可能影响活跃实验。共享数据库不等于共享进程队列或连接池。

开发时把 reload 限定在源码目录：

```bash
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --port 8081
```

需要训练持续运行时关闭 `--reload`。后端重启不会自动续训；应重新创建实验，或使用受支持的下游 SVM 恢复流程。参见[版本与续训](../web-ui/versions-and-resume)。

### 数据库连接池

连接池由 `MetadataStore` 的 SQLAlchemy engine 配置、数据库方言与驱动共同决定。当前未提供连接池大小的应用级环境变量；不能通过增加 Uvicorn worker 来共享或协调训练队列。

### BLAST 超时

Profile 编码器推理时 PSI-BLAST / makeblastdb 的超时由 `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` 控制（默认 300 秒）。大型 subject FASTA 数据库需要增大此值：

```bash
export PEP_PROFILE_BLAST_TIMEOUT_SECONDS=600
```

### 上传大小限制

`docker/nginx.conf` 设置 `client_max_body_size 512m`，支持大数据集上传。如需调整，修改该配置并重建 frontend 容器。


## 版本升级

### 升级流程

```bash
# 1. 备份（参见备份与恢复）
docker compose exec -T db pg_dump -U pepplatform pepplatform > backup_before_upgrade.sql

# 2. 拉取最新代码
git pull origin main

# 3. 重建并启动（自动执行 alembic upgrade head）
docker compose up --build -d

# 4. 验证
docker compose ps
curl http://127.0.0.1:8080/api/health
```

### 回滚

先核对目标代码与当前数据库的兼容性，保留一致备份。暂停应用写入，并保持数据库可访问：

```bash
docker compose stop frontend backend
# 切换到已经验证的目标源码版本
git checkout <previous-commit>
docker compose up -d db
# 如需恢复 schema，按“备份与恢复”先完成数据库恢复，再启动后端
docker compose up --build -d
```

不能先用 `docker compose down` 移除数据库容器，再直接向该容器管道导入备份。是否需要 schema downgrade 或恢复备份取决于具体迁移，不应把两者无条件串联执行。

::: warning 迁移回滚
并非所有迁移都支持安全回滚。回滚前检查 `alembic history`，确认目标版本的 `downgrade()` 逻辑可逆。
:::

## 下一步

- [备份与恢复](./backup-restore) — 数据备份操作
- [数据库迁移](./migrations) — Alembic 迁移命令
- [配置参考](../config/overview) — 环境变量清单
