# Requirements

::: info Source access
The commands below require access to a PepPlatform source checkout. This documentation site does not host a running platform service, datasets or model weights.
:::

Choose an installation path first. Components below apply to that path or to a selected feature; they are not all required on every host.

## Dependencies by Installation Path

| Component | Source baseline | Used for |
| --- | --- | --- |
| Python | 3.10 | Local backend and CLI; provided inside the backend image for Docker deployments |
| Node.js + npm | 22 (frontend image) | Building or developing the platform frontend locally; provided inside the Docker build stage |
| Docker + Docker Compose | Compatible with the supplied Compose file | Building and running the supplied three-service stack |
| PostgreSQL | 16 (Compose image) | Metadata storage in the supplied Compose stack; local development defaults to SQLite |

These versions describe the supplied source/image configuration, not a compatibility claim for every newer version. Building this documentation site separately uses Node.js 24; see its repository README.

## Route-Specific Dependencies

| Component | Required when |
| --- | --- |
| BLAST+ (`ncbi-blast+`) | Generating PSSM / PSFM profiles; also prepare the selected route's reference data or complete compatible profile caches |
| `esm==3.2.0` | Using the official ESM-C 300M/600M or ESM3 SDK routes; other routes do not require this SDK. ESM2 uses Hugging Face Transformers |
| Pretrained-model packages and weights | Using the selected pretrained route; prepare its tokenizer/config files and weights, with access to any required model download |

Python dependencies are layered by function:

| File | Includes |
| --- | --- |
| `requirements.txt` | CLI training, classical features and basic tokenizers |
| `requirements-web.txt` | Shared training plus Web, authentication and database drivers |
| `requirements-pretrained.txt` | Shared training plus Transformers, SentencePiece, Protobuf and ESM |
| `requirements-dev.txt` | Web and pretrained extensions plus pytest, httpx and Ruff |

PyTorch is pinned to `2.5.1`; pretrained extensions use the matching
`torchvision==0.20.1`. Install matching CPU/CUDA builds. The Docker backend installs
both Web and pretrained layers; local users select the needed files. Frontend
dependencies are installed separately through `frontend/package-lock.json`
with `npm ci`.

The scientific baseline is NumPy `2.2.6`, SciPy `1.15.3`, scikit-learn `1.7.2`, XGBoost `3.1.3`, LightGBM `4.6.0`, joblib `1.5.3` and gensim `4.4.0`. The reference GPU environment uses PyTorch `2.5.1+cu121` and torchvision `0.20.1+cu121`; the supplied Docker image uses the corresponding CPU builds. Reproducing a saved run also requires its original data, configuration, seeds and model resources.

Official ESM-C and ESM3 require exactly `esm==3.2.0`. To correct the SDK version, run `python -m pip install --no-cache-dir 'esm==3.2.0'`; a package-version change alone does not require deleting model weights. ESM-C checks this in preflight. ESM3 checks it during tokenizer/encoder initialization; preflight does not currently establish ESM3 runtime readiness.

## Optional Dependencies

| Component | Purpose |
| --- | --- |
| GPU + compatible PyTorch/CUDA build | Accelerating supported workloads; memory needs depend on the model and batch size. The supplied Docker image installs CPU PyTorch and does not request GPU access |
| conda / venv | Isolating the Python environment |

## Disk Space

The source distribution contains no bundled datasets or pretrained weights. Space requirements depend on the selected data, snapshots, caches and retained runs. For offline use, prepare only the snapshots needed by the selected routes, including their tokenizer/config files.

## Installation Path Comparison

| Path | Use case | Host prerequisites |
| --- | --- | --- |
| [Docker Compose](./docker) | Building the supplied service stack | Docker + Docker Compose, configuration and access to image/package sources |
| [Local Web Development](./local-web) | Developing frontend/backend | Python environment + Node.js; route-specific resources as needed |
| [CLI Only](./cli-only) | Running training scripts without the Web UI | Python environment; route-specific resources as needed |

## Next Steps

Continue with your chosen installation path, then use [Verify Installation](./verify) to check the relevant entry points and resources.
