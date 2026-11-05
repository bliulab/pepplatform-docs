# Encoders

An encoder is the platform's umbrella term for converting tokenized sequences into numeric inputs. The K-mer classic-feature route currently provides 23 encoder options (the `--encoder` argument), categorized by whether they preserve sequence order into **sequence-preserving encoders** and **global encoders**.

::: info How this count is derived
It counts every `--encoder` value the K-mer route accepts. Each BLOSUM62-fallback hybrid (`pssm_blosum62_hybrid`, `psfm_blosum62_hybrid`, `ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, `acc_pssm_blosum62_hybrid`) is selectable on its own, so it is counted separately; a feature-family grouping that files each fallback under its PSI-BLAST parent reports a smaller total. Other tokenizers accept only a subset of these encoders, so tokenizer and encoder counts are not a Cartesian product. See [Tokenizers](./tokenizers).
:::

An encoder does not duplicate the tokenizer vocabulary. For `index`, the tokenizer
provides ID lookup for string tokens and `IndexEncoder` uses that mapping to build the
final tensor; when a tokenizer already emits native IDs, the encoder normalizes their
length and constructs the tensor directly. The tokenizer therefore defines the token
space, while the encoder defines its representation.

::: warning Property removed
`property`, `physchem`, and `physicochemical(property)` have been removed from
training and inference. Existing Property models must be retrained with another
encoder. Contracted physicochemical tables remain separate internal dependencies
of AC/CC/ACC and PDT; they are no longer public encoders.
:::

## Encoder Categories

| Category | Meaning | Downstream connection |
| --- | --- | --- |
| Sequence-preserving | Keeps ordered per-position structure | Sequence models (CNN/RNN/GRU/LSTM/Transformer) |
| Global | Collapses a sequence into one vector | Classical classifiers, optionally after a [feature transform](./feature-transforms) |

### Sequence-Preserving Encoders

| Encoder | Description |
| --- | --- |
| `index` | Maps each token to its integer vocabulary index; the most basic discrete encoding |
| `onehot` | Encodes each token as a one-hot vector, preserving per-position structure |
| `blosum62` | Standard BLOSUM62 half-bit log-odds score rows for `k=1`; an explicitly labeled BLOSUM62-derived row-mean extension for `k>1` |
| `pssm` | Position-Specific Scoring Matrix; per-position scores derived from PSI-BLAST profiles |
| `pssm_blosum62_hybrid` | Explicit hybrid: PSI-BLAST PSSM when available, with BLOSUM62 score rows only after a successful zero-nonself-hit search that emitted no PSSM |
| `psfm` | Position-Specific Frequency Matrix; per-position frequency matrix derived from profiles |
| `psfm_blosum62_hybrid` | Explicit hybrid: PSI-BLAST weighted-observed PSFM when available, with a BLOSUM62-derived target-frequency profile only after a successful zero-nonself-hit search does not emit the complete required checkpoint/ASCII output pair |
| `word2vec` | Static token embeddings trained via word2vec; preserves per-position sequence order |
| `glove` | Static token embeddings trained with the standard GloVe weighted least-squares objective |
| `fasttext` | Static token embeddings via fastText, supporting subword information |

#### Index and One-hot Contract

`index` is a token-ID interface, not a continuous numeric feature. It returns a
fixed-length `torch.long` tensor with shape `[L]`: ID `0` is right padding and
unknown tokens use the tokenizer's nonzero `<UNK>` ID. Raw IDs may only enter a
sequence predictor that first learns an embedding (CNN/RNN/GRU/LSTM/Transformer),
or be exported after such a predictor has learned an embedding. Flattening raw
IDs into a classical classifier, pair-vector fusion, or sample graph is rejected
because the magnitude and distance between vocabulary IDs have no meaning.

`onehot` returns a `torch.float32` tensor with shape `[L,V]`. Each real token,
including `<UNK>`, activates exactly one vocabulary dimension; padding rows are
all zero. Both encoders truncate to `L`, right-pad shorter streams, and reject
invalid or out-of-range IDs.

These are standard categorical encoding primitives rather than paper-specific
algorithms, so the platform documents their mathematical and tensor contracts
without assigning an artificial "original paper" citation. Citations belong to
the tokenizer that defines the vocabulary and the model or feature method that
consumes the encoding.

### Global Encoders

| Encoder | Description |
| --- | --- |
| `bow` | Bag-of-Words; a global vector of token frequencies |
| `TF-IDF` | TF-IDF weighted global vector; `tfidf` is an alias |
| `textrank` | Global vector weighted by TextRank keyness scores |
| `ac` | Auto Covariance encoding; lag controlled by `--ac_lag` |
| `cc` | Cross Covariance encoding; lag controlled by `--cc_lag` |
| `acc` | Auto-Cross Covariance encoding; lag controlled by `--acc_lag` |
| `pdt` | Physicochemical Distance Transformation using 531 AAIndex1 properties over the complete raw sequence; lag controlled by `--pdt_lag` |
| `ac_pssm` | Strict PSSM auto-covariance encoding; lag controlled by `--ac_pssm_lag` |
| `cc_pssm` | Strict directed PSSM cross-covariance encoding; lag controlled by `--cc_pssm_lag` |
| `acc_pssm` | Strict PSSM auto-cross-covariance encoding; lag controlled by `--acc_pssm_lag` |
| `ac_pssm_blosum62_hybrid` | AC-PSSM–BLOSUM62 Hybrid with an independent profile cache and lag parameter |
| `cc_pssm_blosum62_hybrid` | CC-PSSM–BLOSUM62 Hybrid with an independent profile cache and lag parameter |
| `acc_pssm_blosum62_hybrid` | ACC-PSSM–BLOSUM62 Hybrid with an independent profile cache and lag parameter |

### PDT Contract

The public `pdt` route is the **Physicochemical Distance Transformation** from
Liu et al. (2012), DOI `10.1371/journal.pone.0046633`. It uses all 531 AAIndex1
properties supplied with the paper. Each property is population-standardized
over the 20 standard amino acids, and each lag feature is the mean squared
difference between normalized property values. Features are ordered by AAIndex
property and then ascending lag, with dimension `531 * pdt_lag`.

PDT requires `tokenizer=kmer, k=1` and consumes the complete raw sequence
without `max_length` truncation. Empty input, non-standard residues,
`sequence_length <= pdt_lag`, and inputs beyond `pdt_max_raw_length` are
rejected. The paper's profile-based PDT is a separate PSI-BLAST frequency
profile variant and is not represented by this route. Legacy PDT artifacts do
not carry this scientific contract and must be retrained.
See the [PDT scientific contract](./pdt-contract) for the complete formula,
data provenance, and artifact fields.

### AC-PSSM / CC-PSSM / ACC-PSSM Contract

All six PSSM covariance encoders consume a complete `[L,20]` score profile,
center each column by its complete-sequence mean, and use `L-d` as the
denominator at distance `d`. AC emits 20 values per lag. CC emits 380 directed,
off-diagonal features in `source -> target` order. ACC concatenates the 20 AC
values and 380 CC values within each lag. They require `L > lag` and are not
truncated by `max_length`.

The three strict encoders accept only PSI-BLAST PSSMs. After PSI-BLAST completes
successfully, an encoder ending in `_blosum62_hybrid` uses raw BLOSUM62 score
rows whenever an individual sample has no valid strict PSSM, then applies the
same formula. Every hybrid encoder has its own feature type, cache, manifest, index
path, lag key, and explicitly hybrid feature names. It does not read the generic
`pssm_index_path` or reuse the `pssm_blosum62_hybrid` cache. The repository's
See the profile-dependent encoder section below for profile inputs and Hybrid boundaries.

### AC / CC / ACC Guo-7 Contract and Citation Boundary

The public names `ac`, `cc`, and `acc` mean **Auto Covariance**, **Cross
Covariance**, and **Auto-Cross Covariance**, not Correlation. All three require
`tokenizer=kmer, k=1` and consume the complete raw residue sequence independently
of the `max_length` truncation used by ordered routes. The default and hard
maximum for `--covariance_max_raw_length` are both `100000`. Input is stripped
at its ends and uppercased; empty input, internal whitespace, residues outside
the standard 20 amino acids, over-limit input, and `sequence_length <= lag` fail
explicitly instead of producing zero padding.

The seven properties are fixed to Guo et al. (2008), Supplementary Table S1, in
the order `H1, H2, V, P1, P2, SASA, NCI`. Each column is standardized over the
20 standard amino acids in float64 with population standard deviation
(`ddof=0`) and no intermediate rounding:

`Z[a,j] = (P[a,j] - mean_20AA[j]) / population_sd_20AA[j]`

For a complete sequence of length `n`, each property is then centered by its
mean over that sequence. At distance `d`:

`AC(d,j) = 1/(n-d) × Σ_i (Z[i,j]-mean_seq[j]) × (Z[i+d,j]-mean_seq[j])`

`CC(d,j,k) = 1/(n-d) × Σ_i (Z[i,j]-mean_seq[j]) × (Z[i+d,k]-mean_seq[k]), j != k`

CC is directed: `j at i -> k at i+d` and the reverse direction are distinct
features. Output is lag-major. AC follows the seven-property order within each
lag; CC orders source property before target property and omits the diagonal.
For maximum lag `L`, AC, CC, and ACC therefore have dimensions `7L`, `42L`, and
`49L`. ACC is exactly the complete AC block followed by the complete CC block.
Calculation is float64, final tensors are float32, and feature names are stable.

The method lineage should cite the ACC formulation by
[Wold et al. (1993)](https://doi.org/10.1016/0003-2670(93)80437-P) and its early
protein-sequence application by
[Sjöström et al. (1995)](https://doi.org/10.1016/0169-7439(95)80104-H). The
platform's seven properties and sequence AC formula come directly from
[Guo et al. (2008)](https://doi.org/10.1093/nar/gkn159). Guo's experiments used
AC only; this platform's CC/ACC are a consistent application of Wold's directed
ACC decomposition to the Guo-7 channels and must not be described as CC/ACC
experiments performed by Guo. Guo used lag 30, while the platform default is
lag 10; reproducing that parameter requires explicitly setting 30.

[BioSeq-BLM (2021)](https://doi.org/10.1093/nar/gkab829) is a later platform
implementation comparison, not the original source of AC, CC, or ACC. Exported
artifacts persist the formulas, property order and raw/normalized table
digests, lag, direction, complete-sequence policy, length limit, and output
dimension. Inference rejects missing legacy or tampered AC/CC/ACC contracts with
`covariance_contract_unsupported` and requires retraining.

### BoW / TF-IDF Contract and Citation Boundary

The public names `bow` and `tfidf` remain accurate. They name broad
representation families, not a single immutable algorithm owned by one paper.
[Harris (1954)](https://doi.org/10.1080/00437956.1954.11659520) is a
historical source for distributional language ideas, but
the platform does not call it the “original BoW algorithm paper.” The IDF
lineage is cited to
[Spärck Jones (1972)](https://doi.org/10.1108/eb026526), and multiplicative
TF-by-IDF weighting to
[Salton & Yang (1973)](https://doi.org/10.1108/eb026562). Biological-sequence
adaptation may additionally cite
[BioSeq-BLM](https://doi.org/10.1093/nar/gkab829). Those references establish
the lineage; the exact smoothing, vocabulary, and artifact rules below are the
platform contract.

For `kmer`, `dr`, `top-n-gram`, and `dt`, global
frequency encoders consume the **complete token stream**, independently of the
`max_length` truncation used by ordered models. PAD is excluded and UNK is
counted as a real vocabulary item. If `c_j` is the occurrence count of token j:

- BoW: `x_j = c_j`, with no L1/L2 post-normalization.
- TF: `tf_j = c_j / Σ_k c_k`; a valid zero-token sequence maps to all zeros.
- IDF: fitted on training documents only as
  `idf_j = ln((N+1)/(df_j+1)) + 1`.
- TF-IDF: `x_j = tf_j × idf_j`, with no L1/L2 normalization after multiplication.

`N` includes zero-token training documents, so they affect the IDF denominator
while still encoding to a zero vector. TF-IDF construction requires exactly
one of a nonempty training corpus or persisted IDF state; an all-ones fallback
is not permitted. Single-sequence tasks fit on the train split only.
Homogeneous pair routes combine both train roles into one corpus, while
heterogeneous towers fit role-specific corpora. Validation and test data never
participate.

`--frequency_max_raw_length` defaults to `50000`, with a hard platform maximum
of `100000`; over-limit inputs fail explicitly. Exported metadata records the
encoder formulas, full-stream policy, feature dimension, vocabulary digest, training
document count, corpus digest, and fit scope. The bundled IDF tensor uses a
bundle-relative path with SHA-256, dtype, and shape; inference rejects missing,
tampered, path-escaping, or dimensionally incompatible state. Artifacts without
the current frequency metadata retain historical behavior: generic K-mer-family BoW remains truncated and
L1-normalized, old TF-IDF uses relative TF over the truncated stream, and
DR/Top-n-gram/DT retain their former full-stream behavior. A legacy TF-IDF
artifact is usable only when it contains complete IDF state; otherwise it must
be retrained.

### Weighted TextRank Contract and Citation Boundary

The `textrank` iteration kernel strictly follows weighted TextRank in
[Mihalcea and Tarau (2004), Section 2.2](https://aclanthology.org/W04-3252/).
The platform builds an undirected weighted token graph. A sliding window of
width 2 contains two tokens and therefore connects adjacent positions only.
The edge weight `w_ij` is the positional co-occurrence count of two distinct
tokens. Self-loops are omitted, PAD is excluded, and UNK is a valid node. Every
raw node score starts at 1.0 and is synchronously updated in float64 as:

`S(V_i) = (1-d) + d × Σ_{V_j∈In(V_i)} [w_ji / Σ_{V_k∈Out(V_j)} w_jk] × S(V_j)`

Here `d=0.85`. Each round reads only the previous round's **unnormalized raw
scores**. Convergence requires the maximum absolute node change to be below
`1e-4`. Failure to converge within 10,000 rounds raises an error instead of
returning partial scores. L1 normalization happens exactly once, after the
converged raw scores have been written into the dense vocabulary vector; the
result is then converted to float32. No iteration-time normalization occurs.

The four routes define their graph streams explicitly: `kmer` uses the
tokenizer-emitted truncated stream; `dr` uses the complete normalized
sequence's source-position-major DR stream; `top-n-gram` uses the complete
profile-residue stream; and `dt` uses the complete source-position-major DT
stream. Model artifacts persist both the algorithm and stream contract. Legacy
TextRank artifacts without an exact matching contract must be retrained.

A paper's main table may call the method **TextRank**; the methods section
should say **weighted TextRank** and document the protein-token graph and
post-convergence L1 rule. This naming follows the paper's general weighted
TextRank model. It does not claim to reproduce the unweighted, POS-filtered
English keyword extraction experiment in Section 3.1.

## Profile-Dependent Encoders

The following encoders depend on sequence profiles generated via PSI-BLAST:

`pssm`, `pssm_blosum62_hybrid`, `psfm`, `psfm_blosum62_hybrid`, `ac_pssm`, `cc_pssm`, `acc_pssm`,
`ac_pssm_blosum62_hybrid`, `cc_pssm_blosum62_hybrid`, and
`acc_pssm_blosum62_hybrid`

::: warning Profile-Dependent Routes
These routes require sample-specific profiles. Training and on-demand Web inference
need local NCBI BLAST+ plus the Train-frozen subject FASTA, or a profile index that
passes the profile manifest checks. Legacy flat JSON/`.pt` caches are not accepted.
:::

### Scientific names and citation boundary

The 20×20 core of `blosum62` is the standard BLOSUM62 matrix, with columns fixed
to `ARNDCQEGHILKMFPSTWYV` and values interpreted as half-bit log-odds scores.
B/Z/X use the standard extended rows, J/U/O map to X, and non-letter input
fails. For `k=1`, “BLOSUM62 score encoding” with
[Henikoff & Henikoff (1992)](https://doi.org/10.1073/pnas.89.22.10915) is
accurate. For `k>1`, PepPlatform takes the arithmetic mean of residue score
rows; papers must identify this as a PepPlatform BLOSUM62-derived extension,
not as an operation defined by the original paper.

`pssm` contains the integer position-specific scores from the last-round NCBI
PSI-BLAST ASCII PSSM, so “PSI-BLAST PSSM” is accurate. Cite the method lineage
to [Altschul et al. (1997)](https://doi.org/10.1093/nar/25.17.3389). Because the
platform executes modern BLAST+ with later composition-aware refinements and
fully pinned options, also cite
[Schäffer et al. (2001)](https://doi.org/10.1093/nar/29.14.2994) and
[Camacho et al. (2009)](https://doi.org/10.1186/1471-2105-10-421). Describe it
as the modern NCBI BLAST+ implementation of the PSI-BLAST method, not an exact
reproduction of the 1997 executable.

`psfm` is read directly from the ASN.1 checkpoint field
`weightedResFreqsPerPos` (weighted observed residue frequencies before
pseudocounts), preserving zero-observation rows. It is neither `softmax(PSSM)`
nor a target-frequency PSFM. Tables may use the short label PSFM, but methods
must first qualify it as a “PSI-BLAST weighted-observed position-specific
frequency matrix.” An explicit residue mask distinguishes zero-observation
rows from padding.
`psfm_blosum62_hybrid`, `pssm_blosum62_hybrid`, and the three PSSM covariance hybrids are not pure PSSM/PSFM
methods. Manuscripts, plots, and ablations must use each full name and report
fallback counts separately.

Strict `pssm`, `psfm`, `ac_pssm`, `cc_pssm`, and `acc_pssm` accept only
`profile_on_missing=error`. The five explicit hybrids accept only
`blosum62_hybrid`.
Operational errors, timeouts, parse failures, or missing output despite usable
hits always fail. All PSSM/PSFM encoders are defined at raw-residue positions
and therefore require `k=1`.

Related parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `--pssm_index_path` | `''` | PSSM index path |
| `--ac_pssm_blosum62_hybrid_index_path` | `''` | Dedicated AC hybrid index; never falls back to `--pssm_index_path` |
| `--cc_pssm_blosum62_hybrid_index_path` | `''` | Dedicated CC hybrid index; never falls back to `--pssm_index_path` |
| `--acc_pssm_blosum62_hybrid_index_path` | `''` | Dedicated ACC hybrid index; never falls back to `--pssm_index_path` |
| `--ac_pssm_blosum62_hybrid_lag` | `10` | Maximum AC hybrid lag |
| `--cc_pssm_blosum62_hybrid_lag` | `10` | Maximum CC hybrid lag |
| `--acc_pssm_blosum62_hybrid_lag` | `10` | Maximum ACC hybrid lag |
| `--psfm_index_path` | `''` | PSFM index path |
| `--profile_iterations` | — | PSI-BLAST iterations |
| `--profile_evalue` | — | PSI-BLAST E-value |
| `--profile_inclusion_evalue` | — | E-value threshold for inclusion in the next profile round |
| `--profile_threads` | — | PSI-BLAST thread count |
| `--profile_on_missing` | `error` | `error` for strict profiles; `blosum62_hybrid` for named PSSM/PSFM hybrids; Top-n-gram/DT separately support `blosum62_target_frequency` |

## Encoder-Tokenizer Compatibility

Not all encoders work with all tokenizers. The available encoder set depends on the selected tokenizer:

| Tokenizer | Available encoders |
| --- | --- |
| `kmer` | All published classic encoders; PSSM/PSFM-family encoders require `k=1` |
| `dr` | `index`, `onehot`, `bow`, `tfidf`, `textrank`, `word2vec`, `glove`, `fasttext` |
| `top-n-gram` | `bow`, `tfidf`, `textrank` |
| `dt` | `bow`, `tfidf`, `textrank` |
| `bpe` | `index` |
| `wordpiece` | `index` |
| `unigram` | `index` |

::: info
The wizard automatically filters available encoders based on the selected tokenizer, so you do not need to memorize compatibility relationships. See [Tokenizers](./tokenizers).
:::

## Static Embedding Parameters

The word2vec / glove / fasttext encoders can be configured with embedding training parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `--embedding_vector_size` | `128` | Embedding dimension |
| `--embedding_window` | `5` | Context window size |
| `--embedding_min_count` | `1` | Minimum token frequency |
| `--embedding_epochs` | `20` | Embedding training epochs |
| `--embedding_workers` | `1` | word2vec / fastText worker threads; built-in GloVe uses CPU batches |
| `--word2vec_path` | `''` | Pretrained word2vec path |
| `--glove_path` | `''` | Pretrained GloVe path |
| `--fasttext_path` | `''` | Pretrained fastText path |

### GloVe Implementation and Parameters

The built-in `glove` route implements the weighted least-squares objective from the [original GloVe paper](https://nlp.stanford.edu/pubs/glove.pdf) in PyTorch. It trains separate word/context vectors and biases over non-zero co-occurrences, applies inverse-distance context weighting, and exports the sum of the word and context vectors. It does not require Docker, Stanford C binaries, or a local C compiler.

| Parameter | Default | Description |
| --- | --- | --- |
| `--glove_x_max` | `100.0` | Co-occurrence threshold where the weighting function saturates |
| `--glove_alpha` | `0.75` | Weighting-function exponent in `(0, 1]` |
| `--glove_learning_rate` | `0.05` | AdaGrad learning rate |
| `--glove_batch_size` | `4096` | Batch size for sparse non-zero co-occurrence entries |

When `--glove_path` is empty, the platform trains and caches vectors from the training split only. An explicit path is loaded as-is and is never overwritten or retrained. The external text format is compatible, but users remain responsible for verifying how an external file was trained.
