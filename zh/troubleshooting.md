# 故障排查

按问题领域分组，每个问题以可折叠卡片形式给出**错误现象、原因、解决方案**。如未找到对应问题，可先查阅 [环境要求](./install/requirements) 与 [本地 Web 开发](./install/local-web)。

## 安装与启动

::: details 端口已被占用（:8081 后端 / :5173 前端）
**现象**：启动后端或前端时报 `Address already in use` 或 `EADDRINUSE`。

**原因**：8081 / 5173 端口已被其他进程占用。

**解决方案**：

```bash
# 查找占用 8081 的进程
lsof -i :8081

# 终止该进程（替换 <PID>）
kill <PID>

# 或换端口启动后端
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8082
```

前端换端口时，在 `frontend/` 中运行 `npm run dev -- --port 5174`。后端端口变更后，按[本地 Web 开发](./install/local-web)中的说明更新代理目标。
:::

::: details Python 版本不匹配
**现象**：报 `SyntaxError` 或依赖安装失败，提示需要更高版本 Python。

**原因**：源码与镜像基线使用 Python 3.10；解释器过旧或依赖构建不匹配可能导致此错误。

**解决方案**：

```bash
python --version
# 应输出 Python 3.10.x

# 若版本不符，使用 conda 或 pyenv 创建 3.10 环境
conda create -n pepplatform python=3.10
conda activate pepplatform
```
:::

::: details ModuleNotFoundError: No module named 'pepplatform'
从平台源码根目录运行对应工具的文档入口。依赖配置见 [CLI 安装](./install/cli-only)，旧版 SQLite 导入命令见[数据库导入指南](./install/database#从旧版-sqlite-导入-postgresql)。
:::

::: details pip install 失败
**现象**：`pip install` 报错或卡住。

**原因**：pip 版本过旧，或 Python 版本不符合包要求。

**解决方案**：

```bash
python -m pip install --upgrade pip
python --version  # 确认 3.10
python -m pip install -r requirements-web.txt
```
:::

## BLAST+

::: details command not found: psiblast
**现象**：使用 `--encoder pssm` 或 `--encoder psfm` 时报 `command not found: psiblast`。

**原因**：未安装 BLAST+ 命令行工具。

**解决方案**：

```bash
# Ubuntu / Debian
sudo apt install ncbi-blast+

# CentOS / RHEL
sudo dnf install ncbi-blast+

# 验证
psiblast -version
```
:::

::: details Profile 推理超时
Web 推理中的 BLAST 子进程超时由 `PEP_PROFILE_BLAST_TIMEOUT_SECONDS` 控制，默认为 300 秒。在后端环境中设置：

```bash
export PEP_PROFILE_BLAST_TIMEOUT_SECONDS=600
```

构建 Profile 缓存时应使用对应工具的超时参数，见 [CLI 工具](./cli/tools)。
:::

::: details PSSM/PSFM 缓存缺失
检查训练配置中的缓存路径与对应数据划分。缓存构建工具及其输入、输出参数见 [CLI 工具](./cli/tools)。
:::

## 预训练模型

::: details 模型下载失败 / 网络超时
**现象**：拉取 ESM2/ProtBERT 等预训练模型时网络超时或失败。

**原因**：无法访问 Hugging Face Hub。

**解决方案**：启用离线模式，使用本地模型快照：

```bash
PEPPLATFORM_OFFLINE_MODE=1 python scripts/train_sequence_pipeline.py \
  --task_type pep_function \
  --tokenizer esm2 \
  --esm2_model ./models/esm2 \
  --model cnn \
  --epochs 10
```
:::

::: details OSError: model not found
检查本次运行选择的模型来源及其所需文件。本地快照位置与离线模式见 [CLI 安装](./install/cli-only#第五步-离线预训练模型-可选)。
:::

::: details Hugging Face Hub 不可达
**现象**：训练时长时间等待后报网络错误。

**原因**：服务器无法直连 huggingface.co。

**解决方案**：设置 HF 镜像端点，或手动下载后离线使用：

```bash
# 使用镜像（平台也支持 PEPPLATFORM_HF_ENDPOINT，默认回退 https://hf-mirror.com）
export HF_ENDPOINT=https://hf-mirror.com

# 或完全离线
export PEPPLATFORM_OFFLINE_MODE=1
```
:::

## GPU / CUDA

::: details CUDA 不可用
**现象**：`torch.cuda.is_available()` 返回 `False`，训练跑在 CPU 上。

**原因**：CUDA 工具包缺失，或与 PyTorch 版本不匹配。

**解决方案**：

```bash
nvidia-smi  # 确认 GPU 驱动正常
python -c "import torch; print(torch.version.cuda, torch.cuda.is_available())"
```

按 [PyTorch 官网](https://pytorch.org/) 选择与本机 CUDA 匹配的安装命令重新安装。
:::

::: details 显存不足（OOM）
**现象**：训练时报 `CUDA out of memory`。

**原因**：batch size 或序列长度过大，超出显存。

**解决方案**：

```bash
# 减小 batch size
python scripts/train_sequence_pipeline.py --batch_size 16 ...

# 减小最大序列长度
python scripts/train_sequence_pipeline.py --max_length 512 ...
```
:::

::: details CPU 训练很慢
**现象**：无 GPU 时训练非常慢。

**原因**：大模型在 CPU 上计算量大，属预期行为。

**解决方案**：使用 GPU，或换更小的模型（如 `--model cnn` 替代 `transformer`、经典路线替代预训练路线）。
:::

## Web 认证

::: details 收不到邮箱验证码
检查后端日志与实际 SMTP 配置：服务地址、端口、认证信息、发件地址以及垃圾邮件目录。后端在启动时读取配置；修改后需要在合适时机重启，正在运行的训练不会因重启而自动恢复。

请按服务商要求配置 SMTP 传输方式和发件地址。Compose 不转发所有宿主机环境变量，所需覆盖值必须进入 backend 容器环境。参见[环境变量](./config/environment#smtp-邮件)和[Docker 配置](./install/docker)。

注册响应中的 `verification_sent: false` 表示邮件未成功发送。开发调试码由 `PEP_AUTH_DEBUG_CODES` 控制，不能据此认定真实邮件已经投递。
:::

::: details 忘记密码
**现象**：无法登录。

**解决方案**：使用密码重置接口：

```bash
curl -X POST http://127.0.0.1:8081/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
```

随后按邮件指引完成重置。
:::

::: details 开发期想跳过登录
**现象**：本地开发时不想每次登录。

**解决方案**：

```bash
PEP_AUTH_ENABLED=0 python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081
```
:::

## Web 训练实验

::: details 新建实验几秒内变成已取消 / stopped
**现象**：新建的实验十几秒内就结束，`train.log` 只写到
`[web-runner] Preparing training resources and input versions.`，实验详情里的错误是
`Training was stopped because the web service restarted before this experiment finished.`。

**原因**：后端用裸 `--reload` 启动，重载监听覆盖了整个项目目录。新建实验时平台会把
源码快照写入 `.pepplatform_web/versions/staging/<tmp>/files/pepplatform/*.py`，这些
`.py` 写入被 WatchFiles 当成代码改动，于是后端重启，启动时
`cancel_active_experiments` 把这些未完成的实验标记为已取消。与账号、数据集、模型路由无关。

**诊断**：后端日志出现即可确认。

```text
WARNING:  WatchFiles detected changes in '.pepplatform_web/versions/staging/.../pepplatform/*.py'. Reloading...
```

**解决方案**：把重载范围限制到真实源码目录，或训练期间完全关闭重载后重启后端。

```bash
# 保留后端热重载，但只监听源码
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081

# 或者训练期间不要热重载
python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

优先使用 `--reload-dir` 限定监听目录；排除 glob 的行为取决于所安装的 Uvicorn/Watchfiles 版本与配置。
被取消的实验不能恢复，调整启动参数后重新提交即可。
:::

## 数据库

::: details Alembic 迁移失败
根据具体报错核对连接配置与当前迁移版本：

```bash
alembic current
alembic history
```

详见[数据库迁移](./deploy/migrations)与[数据库配置](./install/database)。
:::

::: details SQLite → PostgreSQL 数据导入
命令、依赖与记录归属行为见[数据库导入指南](./install/database#从旧版-sqlite-导入-postgresql)。
:::

## AI Provider

::: details 重启后保存的 API Key 无法读取
**现象**：重启后端后，之前保存的 AI Provider API Key 显示无法解密。

**原因**：`PEP_LLM_KEY_ENCRYPTION_SECRET` 已变更，导致旧密钥无法解密。

**解决方案**：保持 `PEP_LLM_KEY_ENCRYPTION_SECRET` 在所有重启中稳定不变。若已丢失原值，需重新配置各 Provider 的 API Key。
:::

::: details Provider 测试失败
**现象**：Web 端测试 AI Provider 连接失败。

**原因**：API Key 无效、网络不通，或 Provider 端点不可达。

**解决方案**：

1. 核对 API Key 是否正确、是否过期。
2. 确认服务器能访问 Provider 端点（`curl` 测试）。
3. 若需走代理，配置相应环境变量后重启后端。
:::
