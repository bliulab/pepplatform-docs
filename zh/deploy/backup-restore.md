# 备份与恢复

可用备份需要相互匹配的元数据与文件。源码发布包未提供自动备份或经验证的恢复服务；依赖备份前，应先验证自己的恢复流程。

## 备份对象

| 对象 | 内容 |
| --- | --- |
| PostgreSQL | 用户、实验、模型记录、历史与版本引用 |
| 完整 `pep_runtime` 卷 | 数据集、实验、模型、推理输出、可视化状态和 `versions/` 内容及依赖 |
| 部署配置 | 兼容的源码或镜像版本、配置，以及读取已保存 AI 密钥所需的原始稳定 `PEP_LLM_KEY_ENCRYPTION_SECRET` |

下载的 `versions.json` 是摘要，不是可恢复的模型包。除文件内容外，还应保留所有权与权限；协调快照时暂停新提交与应用写入。

## PostgreSQL 备份

以下示例使用默认数据库与用户 `pepplatform`，需按实际配置调整。在 Compose 项目根目录运行：

```bash
docker compose exec -T db pg_dump -U pepplatform pepplatform > backup.sql
```

自定义格式示例：

```bash
docker compose exec -T db pg_dump -U pepplatform -Fc pepplatform > backup.dump
```

检查命令退出状态，并保留匹配的运行文件与配置快照。备份文件存在不等于备份成功或完整。

## PostgreSQL 恢复

先准备兼容的空目标数据库并暂停应用写入。以下恢复命令不会自动清空目标或协调现有文件：

```bash
docker compose stop backend
```

普通 SQL 转储：

```bash
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U pepplatform pepplatform < backup.sql
```

自定义格式转储则使用下列命令：

```bash
docker compose exec -T db pg_restore --exit-on-error -U pepplatform -d pepplatform < backup.dump
```

恢复匹配的运行文件后，检查 schema 兼容性与恢复错误，再启动后端：

```bash
docker compose start backend
```

## Docker 卷备份

实际卷名取决于 Compose 项目名，不能假定前缀为 `pepplatform_`。可检查现有容器挂载：

```bash
docker inspect "$(docker compose ps -a -q backend)" --format '{{range .Mounts}}{{println .Name .Destination}}{{end}}'
```

应使用适合实际存储的卷备份流程，归档前停止相关写入进程。物理复制 PostgreSQL 卷需要停止数据库，或使用另行验证的数据库快照方案；直接归档正在写入的目录不能替代 `pg_dump`。

## Docker 卷恢复

停止相关写入后，将运行文件快照恢复到实际目标卷，并保留所有权。数据库和运行文件应来自同一次协调备份，仅恢复其中之一可能缺失模型或版本内容。

## 验证与保留

将备份与运行目录分开保存，按实际运维需求制定保留周期。先在隔离环境中演练恢复，再检查数据库访问、数据集和模型记录、版本内容及所需具体流程。健康接口成功只说明服务存活，不证明完整可恢复。

## 下一步

- [数据库迁移](./migrations)
- [运维](./operations)
