# Tokenizers

A tokenizer splits an amino-acid sequence into a sequence of tokens, the first step of the classic-feature route. The platform provides **7 classic tokenizers** and **5 pretrained tokenizers**.

::: info How these counts are derived
The numbers are the accepted `--tokenizer` values: 7 classic and 5 pretrained. How many encoders each tokenizer accepts differs, so the two lists do not combine into a Cartesian product; see [Encoders](./encoders).
:::

In the platform contract, a tokenizer also defines the vocabulary or native token-ID
space associated with its segmentation. K-mer tokenizers may first emit string tokens
and then map them through their own vocabulary, while BPE, WordPiece, Unigram, and
pretrained tokenizers may emit native IDs or model inputs directly. The encoder then
chooses the final index, one-hot, count-based, or continuous feature representation.

## Classic Tokenizers

Classic tokenizers are selected via the `--tokenizer` argument; there are 7 in total:

| Tokenizer | Description | Key parameters |
| --- | --- | --- |
| `kmer` | k-mer sliding window; splits the sequence into overlapping substrings of length k | `--k` (default `2`, range `1–3`) |
| `dr` | Distance-based Residue (DR): d0 residue words plus directed d-gap residue pairs ([Liu et al., 2014](https://doi.org/10.1186/1471-2105-15-S2-S3); [implementation boundary](./dr-appendix)) | `--dr_max_distance` (default `5`, range `0–200`), `--dr_max_raw_length` |
| `top-n-gram` | Selects the n highest-frequency amino acids at every position in a PSI-BLAST target-frequency profile | `--top_ngram_n` (default `2`, range `1–3`) |
| `dt` | Distance-based Top-n-gram: fixed Top-1, with d0 words and directed d-gap Top-1 pairs ([Liu et al., 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4015815/); [implementation appendix](./dt-appendix)) | `--dt_max_distance` (default `5`, range `0–200`) |
| `bpe` | Byte-Pair Encoding; merges subwords by frequency | `--bpe_path`, `--bpe_vocab_size` (default `1000`) |
| `wordpiece` | WordPiece subword tokenization with greedy longest-match | `--wordpiece_path`, `--wordpiece_vocab_size`, `--wordpiece_max_raw_length` |
| `unigram` | Unigram LM tokenization; Viterbi inference with optional reproducible online sampling during training | `--unigram_path`, `--unigram_vocab_size`, `--unigram_sampling` |

::: warning Profile-Dependent Tokenizers
`top-n-gram` and `dt` are profile-dependent tokenizers. Both require a
PSI-BLAST target-frequency manifest; a legacy PSSM score cache is not a
substitute. Legacy hashed DT artifacts must be retrained.
:::

### BPE algorithm and platform contract

The route can correctly retain the public name `bpe`. Its internal variant is
`protein_byte_level_bpe`: training starts from a character-level protein
alphabet and repeatedly learns the most frequent adjacent-token merge, while
inference applies the learned merges deterministically. This preserves the core
BPE algorithm. `ByteLevel(add_prefix_space=False)`, the protein alphabet, and
fixed special tokens are platform-specific engineering constraints.

Inputs have all whitespace removed and are uppercased, then must match
`ACDEFGHIKLMNPQRSTVWYXBZJUO`. Empty inputs and unsupported characters fail
explicitly rather than being silently mapped. Special-token IDs are fixed at
`<PAD>=0`, `<UNK>=1`, `<CLS>=2`, `<SEP>=3`, and `<MASK>=4` to preserve the
padding contract used by encoders and predictors. Loading strictly validates
`model.type=BPE`, the ByteLevel configuration, special IDs, alphabet, dropout,
and CLS/SEP processing. WordPiece, corrupt, or incompatible JSON artifacts are
not accepted as BPE.

WordPiece's `max_input_chars_per_word=100` limit **does not apply to BPE**. The
BPE model has no such parameter, so a protein longer than 100 residues does not
become one `<UNK>` merely because of its length. `max_length` is a separate
model-input limit: it caps final tokens, including `<CLS>` and `<SEP>`, and
truncates interior tokens while retaining those boundaries. Increase the same
`max_length` for training and inference when a task must cover longer proteins;
do not add a WordPiece-only option to BPE.

`--bpe_path` is a managed, training-split-only cache location. Its provenance
records an ordered normalized-corpus digest (including duplicates), vocabulary
configuration, contract version, `tokenizers` version, and artifact SHA-256.
Any change, corruption, or legacy cache without provenance triggers a rebuild
from the training split. New model bundles copy the tokenizer and provenance
under `tokenizers/`; inference verifies bundle-relative paths and digests, so
the bundle does not depend on an absolute path from the training host. The BPE
runtime is pinned to `tokenizers==0.21.4`.

### Standard K-mer Boundaries

`kmer` uses contiguous, overlapping, stride-1 windows. For example, `ACDE` with
`k=2` produces `AC`, `CD`, and `DE`. Standard K-mer accepts only integer
`k` values from `1` to `3`. The platform eagerly builds `26^k + 2` vocabulary
entries (including PAD and UNK), so the `k=3` vocabulary has 17,578 entries.

`max_length` is the **maximum number of retained K-mer tokens**, not `k` and
not the raw residue length. K-mers are generated first and then truncated.
With stride 1, `M` retained K-mers cover at most `M + k - 1` residues.

That truncation applies to the existing ordered and graph-ranking routes such
as `index`, `onehot`, and `textrank`. BoW and TF-IDF consume the complete
K-mer stream. Frequency routes use the separate `--frequency_max_raw_length`
safety limit, default 50,000 with a hard maximum of 100,000.

This component is a K-mer tokenizer; it does not implement the count-vector,
inner-product, or SVM parts of the spectrum kernel. A canonical reference for
overlapping K-mer representations of protein sequences is:

> Leslie, C., Eskin, E., & Noble, W. S. (2002). The spectrum kernel: A string
> kernel for SVM protein classification. *Pacific Symposium on Biocomputing*,
> 564–575. https://doi.org/10.1142/9789812799623_0053

### Top-n-gram algorithm and contract

This route can correctly retain the name `top-n-gram`. It implements the core
representation defined by Liu et al. (2008): a PSI-BLAST multiple alignment
provides target frequencies for the 20 standard amino acids at every residue
position; the n amino acids with the highest frequencies are then concatenated
in rank order to form that position's Top-n-gram. If D, P, and R are the top
three residues, for example, the token is `DPR` when `n=3`. A sequence of
length L produces L tokens, and the exact complete feature space is `20^n`.
The `bow` encoder emits raw occurrence counts, giving dimensions 20, 400, and
8000 for `n=1`, `2`, and `3`.

Target frequencies are recovered from the `freqRatios` member of the
PSI-BLAST ASN.1 checkpoint, rather than by ranking integer log-odds scores
from the ASCII PSSM. Despite that historical field name, NCBI stores the
target-frequency numerator Q used before computing the true Q/P ratio.
Top-n-gram reads and row-normalizes these values directly; it does not apply
the background frequencies a second time. Exact ties follow the fixed order
`ARNDCQEGHILKMFPSTWYV` for deterministic results. This tie rule fills in a
detail left unspecified by the paper without changing the representation.

`bow` is the count representation directly corresponding to the paper.
`tfidf` fits IDF on the training split and persists it with the model, while
`textrank` computes graph weights over the complete token stream. Those two
are documented platform extensions, not claims to reproduce the paper's SVM
plus LSA experiments. The platform likewise does not claim identical sequence
databases, PSI-BLAST versions, Gist SVM settings, or LSA hyperparameters. The platform uses its own recorded reference data and PSI-BLAST configuration; this page does not establish reproduction of the paper’s experiments.

Generated profiles are never truncated or padded. During training, the platform
measures the current dataset and resolves the effective Top-n-gram
`max_length` to the larger of the requested value and the observed dataset
maximum; Preflight and the training log record any automatic increase. The
deployment safety limit is controlled by `PEP_TOP_NGRAM_MAX_RESIDUES` and
defaults to 10000. Exceeding it blocks Top-n-gram profile generation, not other
routes for the same dataset. Ordered routes, TextRank, and legacy artifacts
still treat the stored effective `max_length` as a hard inference limit.
BoW/TF-IDF loads the complete profile and instead validates
`frequency_max_raw_length` (online Web profile generation may still encounter
the stricter profile-generation limit first). A managed training database contains only the train
split and excludes every train subject exactly identical to the query. A valid
PSI-BLAST target-frequency checkpoint is retained; profiles with no non-self
hit produce a quality warning. The manifest binds sequence length and SHA-256,
matrix SHA-256, amino-acid order, tie policy, profile source, fallback reason,
and generation provenance; matrices are loaded from NPZ with pickle disabled.
Legacy caches and models lack this profile contract and must be regenerated and
retrained.

#### Appendix: BLOSUM62 prior when target frequencies are unavailable

When PSI-BLAST exits successfully but creates no checkpoint, or when a
checkpoint contains zero-sum target-frequency rows, the platform defaults to
the explicitly marked `blosum62_target_frequency_v1` extension. For query
residue `r`, the prior over the 20 standard amino acids `a` is:

`Q(a | r) ∝ P_bg(a) × 2^(BLOSUM62(r,a) / 2)`

Here `P_bg` is the fixed BLOSUM62 background distribution and each row is
normalized to sum to one. Noncanonical query residues use the background
distribution itself. This matrix is not a PSI-BLAST result and is not part of
the original paper; it is an explicit platform extension for train-only small
datasets and user-uploaded data. Every affected sample records
`profile_source=blosum62_substitution_prior`, `fallback=true`, and a
`fallback_reason`; manifest provenance records
`fallback_policy=blosum62_target_frequency_v1`, so training, cache reuse, and
inference can identify its origin.

Fallback is allowed only when PSI-BLAST completes normally but cannot provide
target frequencies. Timeouts, nonzero exits, corrupt checkpoints, and
malformed ASN.1 remain hard failures. Set `profile_on_missing=error` for strict
behavior. One-hot, the ordinary `blosum62` score matrix, and zero matrices
remain invalid for Top-n-gram.

Original algorithm:

> Liu, B., Wang, X., Lin, L., Dong, Q., & Wang, X. (2008). A discriminative
> method for protein remote homology detection and fold recognition combining
> Top-n-grams and latent semantic analysis. *BMC Bioinformatics*, 9, 510.
> https://doi.org/10.1186/1471-2105-9-510

### DT algorithm boundary

The public `dt` route means Distance-based Top-n-gram. It is fixed to the Top-1
target-frequency sequence, includes d0, and counts directed distance pairs in
an exact (20+400D)-dimensional map with no hash space or collisions. BoW is
the paper's raw count representation; TF-IDF and TextRank are explicitly
identified platform extensions. See the [DT implementation appendix](./dt-appendix)
for the complete formula, the `KFFK`
golden example, and artifact compatibility rules.

### Protein Unigram and subword regularization

`unigram` delegates Kudo Unigram LM seed-piece generation, EM probability
estimation, and loss-based iterative pruning to Hugging Face's
`UnigramTrainer`; inference always uses Viterbi one-best. The trainer explicitly
binds `<UNK>`, and IDs are fixed at `<PAD>=0`, `<UNK>=1`, `<CLS>=2`,
`<SEP>=3`, and `<MASK>=4`.

Input whitespace is removed and letters are uppercased; the accepted alphabet
is `ACDEFGHIKLMNPQRSTVWYXBZJUO`. Training reads parsed FASTA sequences from the
train split only, never FASTA headers or validation data. Stable vocabulary
ordering and scores, strict provenance, and an atomic two-file commit make
managed artifacts reproducible. Models with `unk_id=null`, missing provenance,
or mismatched digests are rebuilt.

`--unigram_sampling` is off by default. When explicitly enabled for neural
training, the platform samples online from a finite n-best lattice using
`--unigram_nbest_size=64` and `--unigram_alpha=0.1`. The local seed is derived
from the global seed, epoch, sample ID, sequence role, and sequence digest, so
results do not depend on DataLoader worker count or access order. Validation,
test, exported embeddings, and inference always use Viterbi. Direct classical
classifiers do not support this online regularizer.

Original algorithm:

> Kudo, T. (2018). Subword Regularization: Improving Neural Network
> Translation Models with Multiple Subword Candidates. *ACL 2018*.
> https://aclanthology.org/P18-1007/

### Protein WordPiece implementation boundary

`wordpiece` uses Hugging Face `tokenizers==0.21.4` to train a WordPiece
vocabulary and applies greedy longest matching with the `##` continuation
vocabulary at runtime. Hugging Face's `WordPieceTrainer` builds the vocabulary
through its BPE trainer, so the precise description is **BPE-based vocabulary
training + WordPiece longest-match tokenization**. The platform does not claim
an exact reproduction of the unpublished original training implementation.
Artifacts record the training-set digest, runtime version, and SHA-256 and are
reused or bundled with the model. This is intentional because the underlying
trainer uses its internal order for tied candidates and does not promise a
byte-identical vocabulary after retraining.

Input whitespace is removed, letters are uppercased, and `B/Z/J/U/O` are
mapped to `X`; the normalized alphabet contains the 20 canonical amino acids
plus `X`. `max_length` is the final token count including `<CLS>` and `<SEP>`,
leaving `max_length - 2` content positions. Raw residue length is controlled
separately by `wordpiece_max_raw_length`, which defaults to 50,000. The
platform absolute limit is 100,000; over-limit inputs fail explicitly instead
of collapsing to a whole-sequence `<UNK>`.

The original WordPiece reference is:

> Schuster, M., & Nakajima, K. (2012). Japanese and Korean Voice Search.
> *ICASSP 2012*, 5149–5152.
> https://doi.org/10.1109/ICASSP.2012.6289079

## Pretrained Tokenizers

Pretrained tokenizers are bundled with their corresponding pretrained encoders and cannot be paired with a separate encoder. There are 5 in total:

| Tokenizer ID | Default model | Description |
| --- | --- | --- |
| `esm2` | `facebook/esm2_t30_150M_UR50D` | Evolutionary Scale Modeling 2 |
| `protbert` | `Rostlab/prot_bert` | ProtBERT, a protein-domain BERT |
| `prott5` | `Rostlab/prot_t5_xl_uniref50` | ProtT5, a protein-domain T5 |
| `esmc` | `EvolutionaryScale/esmc-600m-2024-12` | Official ESM-C 300M/600M (960/1152 dimensions) |
| `esm3` | `EvolutionaryScale/esm3-sm-open-v1` | ESM3 |

Selecting a pretrained tokenizer enters the [pretrained-model route](./routes), whose guided flow is:

1. `Choose feature extraction`
2. `Choose pretrained model`
3. `Choose classifier`

### ESM-C checkpoint contract

The `esmc` route lets users choose the official EvolutionaryScale
`esmc-300m-2024-12` or `esmc-600m-2024-12` checkpoint; the default is 600M. The runtime is pinned to `esm==3.2.0`, Flash
Attention is disabled, and pooling averages residue states after removing BOS,
EOS, and PAD. The official weight file is
`data/weights/esmc_600m_2024_12_v0.pth`; its SHA256 must be
`8ef856e1a237ee3f995442df997a962e70057faadecf38fc0c8561bd3c2f4324`.
The `esm` Python package and the model-weight cache are independent. A runtime
version mismatch does not require deleting the weights; run
`python -m pip install --no-cache-dir 'esm==3.2.0'`. The
`[esmc-provenance]` training-log record and the model artifact's `metadata.json`
capture the exact runtime, device, snapshot revision, and weight digest for
reproduction and inference validation.

Online mode attempts to download a missing selected official checkpoint on first use; access and authentication requirements still apply. Place an
offline mirror at `models/EvolutionaryScale/esmc-300m-2024-12` or
`models/EvolutionaryScale/esmc-600m-2024-12`; missing weights fail closed. Follow
the license terms on the official Hugging Face model card. The legacy
ESM++ compatibility route remains available only when explicitly selected with
`--esmc_model Synthyra/ESMplusplus_small`; its artifacts are identified as
`ESM++ 300M`, not official ESM-C.

## Key Parameters

| Parameter | Default | Applies to | Description |
| --- | --- | --- | --- |
| `--k` | `2` | `kmer` | Window length; accepts only `1–3` |
| `--dr_max_distance` | `5` | `dr` | Maximum residue-pair distance; integer range `0–200` |
| `--dr_max_raw_length` | `50000` | `dr` | Raw residue limit; the platform absolute limit is `100000` |
| `--dr_dense_memory_limit_gib` | `4.0` | `dr` | Preallocation budget for dense DR features, in GiB |
| `--top_ngram_n` | `2` | `top-n-gram` | Amino acids retained at each position; accepts only `1–3` |
| `--frequency_profile_index_path` | `''` | `top-n-gram`, `dt` | Target-frequency profile manifest; legacy PSSM indexes are incompatible |
| `--profile_on_missing` | `blosum62_target_frequency` | `top-n-gram`, `dt` | Use the explicit BLOSUM62 prior when target frequencies are unavailable; set `error` for strict behavior |
| `--topngram_dense_memory_limit_gib` | `4.0` | `top-n-gram` | Preallocation budget for dense Top-n-gram features (GiB) |
| `--dt_max_distance` | `5` | `dt` | Maximum Top-1 pair distance; integer range `0–200` |
| `--dt_dense_memory_limit_gib` | `4.0` | `dt` | Preallocation budget for exact `20 + 400*dMAX` dense features (GiB) |
| `--bpe_path` | `''` | `bpe` | Managed train-split BPE cache path |
| `--bpe_vocab_size` | `1000` | `bpe` | BPE vocabulary size |
| `--unigram_path` | `''` | `unigram` | Unigram model path |
| `--unigram_vocab_size` | `1000` | `unigram` | Unigram training target vocabulary size |
| `--unigram_sampling` | `false` | `unigram` | Enable online sampling on the neural train split only |
| `--unigram_nbest_size` | `64` | `unigram` | Number of candidate segmentations, range `2–256` |
| `--unigram_alpha` | `0.1` | `unigram` | Segmentation smoothing/inverse-temperature parameter |
| `--unigram_max_raw_length` | `50000` | `unigram` | Raw residue limit; the platform absolute limit is `100000` |
| `--wordpiece_path` | `''` | `wordpiece` | WordPiece vocabulary path |
| `--wordpiece_vocab_size` | `1000` | `wordpiece` | WordPiece training target vocabulary size |
| `--wordpiece_max_raw_length` | `50000` | `wordpiece` | Raw residue limit; the platform absolute limit is `100000` |

## Tokenizer-Encoder Pairing

The tokenizer determines the set of available encoders. See [Encoders](./encoders#encoder-tokenizer-compatibility).

::: tip Selection Advice
- **General baseline**: `kmer` supports several encoder families, subject to compatibility: profile, AC/CC/ACC and PDT routes require `k=1`. Use encoder contracts and Preflight to check a concrete combination.
- **Subword semantics**: `bpe` / `wordpiece` / `unigram` capture subword patterns but only support the `index` encoder.
- **Frequency features**: `bow` / `TF-IDF` encoders can pair with `kmer`, `dr`, `top-n-gram`, or `dt`.
- **Pretrained representations**: Choose a matching pretrained tokenizer/encoder (e.g., `esm2`) when its resources are available; this does not guarantee better task performance.
:::
