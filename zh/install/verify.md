# 安装验证

完成安装后，请根据你选择的部署路径执行以下验证步骤，确认各组件正常运行。

## Docker Compose 验证

启动 `docker compose up --build` 后，检查服务是否就绪：

```bash
# 验证前端可达
curl http://127.0.0.1:8080

# 验证后端健康检查接口
curl http://127.0.0.1:8080/api/health
```

::: tip
如返回 HTML 页面或 JSON 健康状态，说明服务已正常运行。也可直接浏览器访问 <http://127.0.0.1:8080>。
:::

查看各容器状态：

```bash
docker compose ps
```

确认 `db`、`backend`、`frontend` 三个服务均为 `running` / `healthy` 状态。

## 本地 Web 验证

后端终端启动 `uvicorn` 后：

```bash
# 验证后端健康检查
curl http://127.0.0.1:8081/api/health
```

前端终端启动 `npm run dev` 后，浏览器访问 <http://127.0.0.1:5173>，应能看到 PepPlatform 界面。

## CLI 验证

确认训练脚本可正常加载：

```bash
# 调度入口帮助
python scripts/train_pipeline.py --help

# 单序列任务脚本
python scripts/train_sequence_pipeline.py --help

# 互作任务脚本
python scripts/train_pair_pipeline.py --help
```

::: tip
`--help` 能正常输出仅说明入口和参数解析可以加载；它不能替代数据、模型资源、BLAST 或实际路线的预检。可直接运行 `python scripts/train_sequence_pipeline.py` 启动单序列向导，或运行 `python scripts/train_pair_pipeline.py` 启动 pair 任务向导。
:::

## 开发与测试

在平台源码根目录执行。开发清单包含 Web 和预训练扩展，以及测试、lint 工具。
CPU 环境先安装配套的 PyTorch 和 torchvision：

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1" "torchvision==0.20.1"
python -m pip install -r requirements-dev.txt
python -m pip check
python -m pytest
python -m ruff check --select E9,F63,F7,F82 .
```

`pytest.ini` 统一测试目录和严格标记检查。完整 lint 报告使用
`python -m ruff check .`，其中还包含现有风格告警。

前端检查在 `frontend/` 中执行 `npm ci`、`npm run test:unit` 和
`npm run build`。文档站在独立文档仓库中检查和构建。

## 常见问题

### 端口被占用

```
Error: [Errno 98] Address already in use
```

解决方法：释放被占用的端口，或更换端口启动：

```bash
# 查看占用端口的进程
lsof -i :8081

# 后端换端口
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --port 8082
```

Docker 部署可通过 `PEP_HTTP_PORT` 修改对外端口：

```bash
PEP_HTTP_PORT=9090 docker compose up --build
```

### BLAST+ 未找到

```
FileNotFoundError: psiblast not found
```

PSSM / PSFM 编码器依赖 BLAST+，请安装：

```bash
sudo apt install ncbi-blast+
```

安装后确认 `psiblast -version` 可正常输出。

### 预训练模型下载失败

服务器无法访问 Hugging Face 时会反复重试。解决方法：

1. 将预训练模型快照放在项目 `models/` 目录下
2. 启用离线模式：

```bash
export PEPPLATFORM_OFFLINE_MODE=1
```

详见 [仅 CLI 训练](./cli-only)。

### Python 版本不匹配

所提供后端镜像与本地安装说明使用 Python 3.10。排查依赖安装或运行问题时，可先核对该基线：

```bash
python --version
```

确认输出为 `Python 3.10.x`。推荐使用 conda 或 venv 创建独立环境，详见 [仅 CLI 训练](./cli-only#第二步-准备-python-环境)。

## 下一步

验证通过后，你可以：

- 阅读 [概念原理](../concepts/overview) 了解平台设计
- 查看 [CLI 工具](../cli/tools) 开始训练
- 浏览 [可选配置](./optional-config) 调优平台参数
