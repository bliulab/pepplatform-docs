# CLI Only

::: info Source availability
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

If you only need to run model training scripts and do not need the Web UI, choose this path. Prepare a Python environment and the resources needed by your selected route. Node.js and Docker are not needed for these CLI entry points.

## Prerequisites

- Python 3.10 (conda or venv isolation recommended)
- BLAST+ (`ncbi-blast+`) when generating PSSM / PSFM profiles
- Environment meets the [Requirements](./requirements)

## Step 1: Obtain the Source

Clone the public source repository and change to its root. Datasets and pretrained weights must be prepared separately.

```bash
git clone https://github.com/AlbertTeslaWizard/PepPlatform.git
cd PepPlatform
```

## Step 2: Prepare the Python Environment

Create an isolated Python 3.10 environment using conda or venv:

```bash
# Using conda
conda create -n pepplatform python=3.10
conda activate pepplatform

# Or using venv
python3.10 -m venv .venv
source .venv/bin/activate
```

::: info No package install needed
This project has no `pyproject.toml` or `setup.py`, so there is no need to run `pip install .`. Training scripts automatically add the project root to `sys.path` — just run them from source.
:::

## Step 3: Install Dependencies

The CLI baseline is `requirements.txt`. It installs the shared training libraries,
including the pinned `torch==2.5.1` and `tokenizers==0.21.4` contracts. For CPU:

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.5.1"
python -m pip install -r requirements.txt
```

Pretrained routes additionally need the model extensions. Install matching CPU
torchvision before the extensions; GPU users should select matching CUDA builds
of PyTorch 2.5.1 and torchvision 0.20.1 instead.

```bash
python -m pip install --upgrade pip
python -m pip install --index-url https://download.pytorch.org/whl/cpu "torchvision==0.20.1"
python -m pip install -r requirements-pretrained.txt
```

The extensions declare `transformers==4.48.1`, SentencePiece, Protobuf and the official
`esm==3.2.0` SDK. ESM2/ProtBert/ProtT5 use Transformers; official ESM-C/ESM3 use
the ESM SDK. Prepare the selected model's weights separately. Web dependencies
are in `requirements-web.txt`; complete development/test dependencies are in
`requirements-dev.txt`. See [Verify Installation](./verify#development-and-tests)
for the test commands.

The explicit versioned CLI (`python -m pepplatform.versioning`) reuses Web metadata
and runner components. Install `requirements-web.txt` for that entry point;
starting the Web service is not required.

::: tip GPU acceleration
For GPU training acceleration, install the `torch` build matching your CUDA version from the [PyTorch website](https://pytorch.org/). Whether a workload fits on CPU or GPU depends on the selected model, available memory and batch size.
:::

::: tip Tokenizer-related dependencies
BPE / WordPiece / Unigram routes need `tokenizers`; all three platform subword contracts
pin `tokenizers==0.21.4`. The ProtT5 route also needs `sentencepiece` and
`protobuf` during initialization. A k-mer + classic-model workflow does not
require these subword dependencies.
:::

::: tip GloVe requires no compilation
Standard GloVe training is provided by the project's built-in PyTorch implementation. CLI users do not need Docker, `make`, or C/C++ compiler tooling for GloVe.
:::

## Step 4: Install BLAST+ for Profile Generation

PSSM / PSFM profile encoders depend on BLAST+:

```bash
# Ubuntu / Debian
sudo apt install ncbi-blast+

# CentOS / RHEL
sudo yum install ncbi-blast+
```

Verify the `psiblast` command is available:

```bash
psiblast -version
```

## Step 5: Offline Pretrained Models (Optional)

If the server has no public internet access, place pretrained model snapshots under the project `models/` directory:

```bash
models/esm2
models/protbert
models/prott5
models/EvolutionaryScale/esmc-600m-2024-12
models/esm3-sm-open-v1
```

Then enable offline mode to avoid Hugging Face network retries:

```bash
export PEPPLATFORM_OFFLINE_MODE=1
```

::: warning
In offline mode, training uses local model directories first and fails fast if the requested pretrained model is missing.
:::

## Run Training

```bash
# Interactive wizard (recommended for beginners)
python scripts/train_sequence_pipeline.py

# Specify arguments directly
python scripts/train_sequence_pipeline.py --task_type pep_function --data_dir /path/to/function-data --tokenizer kmer --encoder onehot --model cnn --epochs 50
```

For interaction tasks (peptide–protein / peptide–HLA-I / peptide–HLA-II):

```bash
python scripts/train_pair_pipeline.py
```

For the full argument list, see [train_pipeline.py Arguments](../cli/train-pipeline), [train_sequence_pipeline.py Arguments](../cli/train-sequence-pipeline), and [train_pair_pipeline.py Arguments](../cli/train-pair-pipeline).

## Next Steps

- Refer to [Verify Installation](./verify#cli-verification) to confirm scripts run correctly.
- Need experiment management and visualization? Switch to [Docker Compose](./docker) or [Local Web Development](./local-web).
