# 环境要求

::: info 源码访问
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

请先选择安装路径。下列组件分别用于相应部署方式或所选功能，并非每台主机都需要全部安装。

## 按安装路径区分依赖

| 组件 | 源码中的基线 | 用途 |
| --- | --- | --- |
| Python | 3.10 | 本地后端与 CLI；Docker 部署由后端镜像提供 |
| Node.js + npm | 22（前端镜像） | 在本地构建或开发平台前端；Docker 构建阶段已提供 |
| Docker + Docker Compose | 可解析所提供的 Compose 文件的版本 | 构建和运行所提供的三服务栈 |
| PostgreSQL | 16（Compose 镜像） | 所提供 Compose 栈的元数据存储；本地开发默认使用 SQLite |

这些版本说明源码和镜像配置中的基线，不代表已经验证所有较新版本。独立构建本文档站使用 Node.js 24，见文档仓库 README。

## 按路线区分依赖

| 组件 | 需要它的场景 |
| --- | --- |
| BLAST+（`ncbi-blast+`） | 生成 PSSM / PSFM profile；还需准备所选路线的参考数据或完整且兼容的 profile 缓存 |
| `esm==3.2.0` | 官方 ESM-C 300M/600M 与 ESM3 SDK 路线；其他路线不需要此 SDK。ESM2 使用 Hugging Face Transformers |
| 预训练模型软件包与权重 | 使用对应预训练路线时，需准备 tokenizer/config 文件和权重，并满足相应下载访问条件 |

Python 依赖按功能分层：

| 清单 | 安装范围 |
| --- | --- |
| `requirements.txt` | CLI 训练、经典特征与基础分词器 |
| `requirements-web.txt` | 基础训练依赖，加上 Web、认证和数据库驱动 |
| `requirements-pretrained.txt` | 基础训练依赖，加上 Transformers、SentencePiece、Protobuf 和 ESM |
| `requirements-dev.txt` | Web、预训练扩展，加上 pytest、httpx 和 Ruff |

PyTorch 固定为 `2.5.1`，预训练扩展使用配套的 `torchvision==0.20.1`。
CPU/CUDA 构建应配套安装。Docker 后端默认安装 Web 和预训练两层依赖；
本地用户按所需功能选择清单。前端依赖通过 `frontend/package-lock.json` 和
`npm ci` 单独安装。

科学计算基线为 NumPy `2.2.6`、SciPy `1.15.3`、scikit-learn `1.7.2`、XGBoost `3.1.3`、LightGBM `4.6.0`、joblib `1.5.3` 和 gensim `4.4.0`。参考 GPU 环境使用 PyTorch `2.5.1+cu121` 与 torchvision `0.20.1+cu121`，所提供 Docker 镜像使用对应的 CPU 构建。复现保存的运行还需要其原始数据、配置、随机种子和模型资源。

官方 ESM-C 与 ESM3 精确要求 `esm==3.2.0`。修正 SDK 版本可运行 `python -m pip install --no-cache-dir 'esm==3.2.0'`；仅软件包版本变更不要求删除模型权重。ESM-C 在预检时检查该运行时；ESM3 在 tokenizer/encoder 初始化时检查，当前预检不能证明 ESM3 运行时已就绪。

## 可选依赖

| 组件 | 用途 |
| --- | --- |
| GPU 与匹配的 PyTorch/CUDA 构建 | 加速受支持的计算任务；内存需求取决于模型与批大小。所提供 Docker 镜像安装 CPU 版 PyTorch，未申请 GPU 访问 |
| conda / venv | 隔离 Python 环境 |

## 磁盘空间

源码发布包不附带数据集或预训练权重。空间需求取决于所选数据、模型快照、缓存和保留的实验。离线使用时，只需准备所选路线需要的快照及其 tokenizer/config 文件。

## 安装路径对比

| 路径 | 用途 | 主机所需条件 |
| --- | --- | --- |
| [Docker Compose](./docker) | 构建所提供的服务栈 | Docker + Docker Compose、相应配置及镜像和软件包下载条件 |
| [本地 Web 开发](./local-web) | 开发前后端 | Python 环境与 Node.js；按路线准备资源 |
| [仅 CLI 训练](./cli-only) | 不使用 Web 界面运行训练脚本 | Python 环境；按路线准备资源 |

## 下一步

按所选路径安装后，参考[安装验证](./verify)检查相应入口和资源。
