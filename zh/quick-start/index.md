# 快速上手

::: info 源码获取
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

可以使用已部署的 Web 平台、本地 CLI，或本地前后端开发环境。先确认数据和运行资源，再选择适合自己的入口。

## 路径 A：访问已部署平台

使用管理员提供的 PepPlatform 服务地址，按以下步骤进入工作台。

1. 打开落地页，从工作台入口进入 `/dashboard`。
2. 访客可预览界面；查询个人数据、上传、预检、训练、推理与 AI 请求前需要登录。
3. 在[数据集](../web-ui/datasets)中选择可用内置数据或上传自己的数据。只有已部署对应文件的条目才会出现。
4. 进入[实验向导](../web-ui/experiment-wizard)，选择任务和路线，检查模型选择目标与 Preflight。
5. 手动确认创建；在详情中监控训练、查看评估证据，完成后到模型库推理。

## 路径 B：CLI 训练

使用当前 Python 3.10 部署基线，在项目根目录安装共享依赖：

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements.txt
python scripts/train_sequence_pipeline.py --help
```

准备符合[数据格式](../datasets/format)的功能任务目录，然后运行：

```bash
python scripts/train_sequence_pipeline.py --task_type pep_function \
  --data_dir /path/to/function-data --tokenizer kmer --encoder onehot \
  --model cnn --epochs 10 --batch_size 64 --lr 1e-3
```

本机存在 `datasets/task_peptide_function/data_quick_384` 时可以用它替换示例数据路径。默认完整数据目录不是该快速目录，也不保证随克隆提供。训练拟合 Train，在 Validation 选择检查点和阈值；存在可用测试集且启用测试评估时才输出对应结果。产物以实际 artifact 目录为准。

无参数运行专用训练脚本会进入向导；Pair 任务使用 `scripts/train_pair_pipeline.py`。预训练路线需要可用快照或下载入口；PSSM/PSFM 等 profile 路线还需要 BLAST、参考库及相应缓存条件。详见[CLI 安装](../install/cli-only)与[常用配方](../cli/recipes)。

## 路径 C：本地 Web 开发

后端终端（先安装共享依赖，并设置稳定的 AI 密钥加密 secret）：

```bash
python -m pip install -r requirements-web.txt
export PEP_LLM_KEY_ENCRYPTION_SECRET='local-dev-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --reload --reload-dir pepplatform --reload-dir scripts --host 0.0.0.0 --port 8081
```

前端终端需要 Node.js 22 与 npm：

```bash
cd frontend
npm ci
npm run dev
```

浏览器访问 <http://127.0.0.1:5173>。无数据库连接配置时使用本地 SQLite。启动正式训练前建议关闭 reload，后端重启会取消活跃实验。仅在本地隔离开发需要时设置 `PEP_AUTH_ENABLED=0`，当前路由仍是落地页 `/` 与仪表盘 `/dashboard`。

生产部署采用[Docker Compose](../install/docker)，检查[安装验证](../install/verify)与[运维说明](../deploy/operations)。
