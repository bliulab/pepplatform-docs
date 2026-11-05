# 本地 Web 开发

::: info 源码获取
以下命令需要可访问的 PepPlatform 源码工作副本。本文档站不提供运行中的平台服务、数据集或模型权重。
:::

适用于本地训练和前后端开发。下方后端命令不启用自动重载，前端使用 Vite 开发服务器，两端可独立调试。

## 前置条件

- Python 3.10（推荐 conda 或 venv 隔离环境）
- Node.js 22 + npm
- 生成 profile 时需要 BLAST+（`sudo apt install ncbi-blast+`），其他路线不需要它
- 确认环境满足 [环境要求](./requirements)

## 启动后端

在一个终端中运行：

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements-web.txt
export PEP_LLM_KEY_ENCRYPTION_SECRET='replace-with-a-stable-local-secret-at-least-16-chars'
python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

训练期间不要启用 `--reload`：源码改动会重启后端并取消未完成任务。仅调试后端时，可追加
`--reload --reload-dir pepplatform --reload-dir scripts`，将监听范围限制到运行源码。

新 Web 任务只固定实际数据划分和必要资源，生成缓存写入各自的实验目录。任务根目录中的
历史特征缓存不会被整体快照或覆盖；历史版本对象及候选实验仍按原记录校验。

使用预训练路线时，还需安装对应模型快照及扩展；CPU 环境执行：

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torchvision==0.20.1"
python -m pip install -r requirements-pretrained.txt
```

运行测试请安装 `requirements-dev.txt`，见[开发与测试](./verify#开发与测试)。

### 认证与数据库

- 本地开发**默认启用认证**（`PEP_AUTH_ENABLED=1`）。
- 未设置 `PEP_DATABASE_URL` 时，元数据自动存入 SQLite 文件 `.pepplatform_web/metadata.sqlite3`，无需额外配置数据库。
- 通过本地 HTTP 测试时，**不要**设置 `PEP_COOKIE_SECURE=true`；后端会根据 `PEP_PUBLIC_BASE_URL` 的 scheme 自动判断。详见 [数据库配置](./database)。

### .env 自动加载

后端会从项目根目录自动加载 `.env` 文件。若 `.env` 中已包含 `PEP_LLM_KEY_ENCRYPTION_SECRET`，则上面的 `export` 可省略。可用以下命令一次性生成：

```bash
openssl rand -hex 32
```

::: tip 保持密钥稳定
本地测试 AI Provider 时，重启后端请保持 `PEP_LLM_KEY_ENCRYPTION_SECRET` 不变，否则之前保存的 API Key 将无法解密。
:::

### 临时关闭认证

开发期间若想跳过登录：

```bash
PEP_AUTH_ENABLED=0 python -m uvicorn pepplatform.web.app:app --host 0.0.0.0 --port 8081
```

## 启动前端

在另一个终端中运行：

```bash
cd frontend
npm ci
npm run dev
```

启动后访问 <http://127.0.0.1:5173>。

### 配置前端代理

如果后端端口不是默认的 8081，需在启动 Vite 前配置代理：

```bash
cd frontend
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
VITE_API_TARGET=http://127.0.0.1:8000
```

然后重新执行 `npm run dev`。

## 下一步

- 参考 [安装验证](./verify) 确认前后端运行正常。
- 如需使用离线预训练模型，参考 [可选配置](./cli-only)。
