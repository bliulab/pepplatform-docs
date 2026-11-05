# 仅 CLI 训练

::: info 源码获取
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

如果你只需要运行模型训练脚本、不需要 Web 界面，可选择此路径。需准备 Python 环境和所选路线的资源；这些 CLI 入口不需要 Node.js 或 Docker。

## 前置条件

- Python 3.10（推荐 conda 或 venv 隔离环境）
- 生成 PSSM / PSFM profile 时需要 BLAST+（`ncbi-blast+`）
- 确认环境满足 [环境要求](./requirements)

## 第一步：获取源码

克隆公开源码仓库并进入根目录。数据集与预训练权重需要另行准备。

```bash
git clone https://github.com/AlbertTeslaWizard/PepPlatform.git
cd PepPlatform
```

## 第二步：准备 Python 环境

推荐使用 conda 或 venv 创建独立的 Python 3.10 环境：

```bash
# 使用 conda
conda create -n pepplatform python=3.10
conda activate pepplatform

# 或使用 venv
python3.10 -m venv .venv
source .venv/bin/activate
```

::: info 无需安装包
本项目没有 `pyproject.toml` 或 `setup.py`，无需执行 `pip install .`。训练脚本会自动将项目根目录加入 `sys.path`，直接从源码运行即可。
:::

## 第三步：安装依赖

CLI 基础清单为 `requirements.txt`，包含训练依赖，以及固定的
`torch==2.5.1`、`tokenizers==0.21.4`。CPU 环境执行：

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements.txt
```

使用预训练路线时，再安装模型扩展。CPU 环境先安装配套的 torchvision；
GPU 用户应选择配套的 PyTorch 2.5.1、torchvision 0.20.1 CUDA 构建。

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torchvision==0.20.1"
python -m pip install -r requirements-pretrained.txt
```

扩展清单明确声明 `transformers==4.48.1`、SentencePiece、Protobuf 和官方
`esm==3.2.0` SDK。ESM2、ProtBert、ProtT5 使用 Transformers；
官方 ESM-C、ESM3 使用 ESM SDK。对应模型权重仍需单独准备。
Web 依赖使用 `requirements-web.txt`，完整开发测试依赖使用
`requirements-dev.txt`；测试命令见[安装验证](./verify#开发与测试)。

显式版本化 CLI（`python -m pepplatform.versioning`）复用 Web 的元数据和运行器，
使用该入口时还需安装 `requirements-web.txt`；无需启动 Web 服务。

::: tip GPU 加速
如需 GPU 训练加速，请按你的 CUDA 版本从 [PyTorch 官网](https://pytorch.org/) 安装对应的 `torch` 构建。所选任务能否在 CPU 或 GPU 上运行，取决于模型、可用内存和批大小。
:::

::: tip 分词器相关依赖
BPE / WordPiece / Unigram 路线需要 `tokenizers`；三种平台子词契约固定为
`tokenizers==0.21.4`。ProtT5 路线在初始化时还需要 `sentencepiece` 与
`protobuf`。如果只跑 k-mer + 经典模型，可以不使用这些高级路线。
:::

::: tip GloVe 无需编译
标准 GloVe 训练由项目内置的 PyTorch 实现提供。CLI 用户无需 Docker，也无需为 GloVe 安装 `make` 或 C/C++ 编译器。
:::

## 第四步：按需安装 BLAST+ 以生成 Profile

PSSM / PSFM 等 profile 编码器依赖 BLAST+：

```bash
# Ubuntu / Debian
sudo apt install ncbi-blast+

# CentOS / RHEL
sudo yum install ncbi-blast+
```

安装后确认 `psiblast` 命令可用：

```bash
psiblast -version
```

## 第五步：离线预训练模型（可选）

服务器若无法访问公网，可将预训练模型快照放在项目 `models/` 目录下：

```bash
models/esm2
models/protbert
models/prott5
models/EvolutionaryScale/esmc-600m-2024-12
models/esm3-sm-open-v1
```

然后设置离线模式环境变量，避免 Hugging Face 网络重试：

```bash
export PEPPLATFORM_OFFLINE_MODE=1
```

::: warning
离线模式下，训练会优先使用本地模型目录；若请求的预训练模型缺失，将立即报错（fail fast）。
:::

## 运行训练

```bash
# 交互式向导（推荐新手）
python scripts/train_sequence_pipeline.py

# 直接指定参数
python scripts/train_sequence_pipeline.py --task_type pep_function --data_dir /path/to/function-data --tokenizer kmer --encoder onehot --model cnn --epochs 50
```

互作类任务（肽–蛋白 / 肽–HLA-I / 肽–HLA-II）使用：

```bash
python scripts/train_pair_pipeline.py
```

完整参数列表参考 [train_pipeline.py 参数](../cli/train-pipeline)、[train_sequence_pipeline.py 参数](../cli/train-sequence-pipeline) 与 [train_pair_pipeline.py 参数](../cli/train-pair-pipeline)。

## 下一步

- 参考 [安装验证](./verify#cli-验证) 确认脚本可正常运行。
- 需要管理实验记录与可视化？请改用 [Docker Compose 部署](./docker) 或 [本地 Web 开发](./local-web)。
