# DR Implementation Appendix

The platform's `dr` means **Distance-based Residue**, not Distributed
Representation. Its core follows the distance-residue representation proposed
for protein sequences by Liu et al.:

> Liu, B., Xu, J., Zou, Q., Xu, R., Wang, X., & Chen, Q. (2014).
> Using distances between Top-n-gram and residue pairs for protein remote
> homology detection. *BMC Bioinformatics, 15*(Suppl 2), S3.
> https://doi.org/10.1186/1471-2105-15-S2-S3

## Core representation

For \(S=s_1\ldots s_L\), d0 words are the individual residues \(s_i\). For
each \(d=1,\ldots,D\), the representation adds every left-to-right directed
pair \((s_i,s_{i+d})\). The canonical 20-amino-acid order is fixed as
`ARDCQEHIGNLKMFPSTWYV`, giving:

\[
20 + 20 \times 20 \times D
\]

feature columns. Columns contain the 20 d0 residues first, followed by the 400
directed pairs for d1 through dD. BoW returns raw occurrence counts from the
complete normalized sequence and is therefore the paper's core DR count
vector. `D=0` is valid and yields only the 20 residue counts.

Ordered encoders require a deterministic linear stream. The platform uses
source-position-major order: emit \(s_i\), then its valid d1 through dD pairs.
This does not change the count vector; it only defines the sequence semantics
of `index`, `onehot`, and static-embedding routes.

## BioSeq-BLM extensions

`tfidf`, `textrank`, `word2vec`, `glove`, and `fasttext` are encoding
extensions over the core DR vocabulary. Their organization follows the
DR-BOW, DR-TFIDF, DR-TextRank, DR2vec, DR-GloVe, and DR-FastText routes in
BioSeq-BLM:

> Li, H.-L., Pang, Y.-H., & Liu, B. (2021). BioSeq-BLM: a platform for analyzing DNA, RNA and
> protein sequences based on biological language models.
> *Nucleic Acids Research, 49*(22), e129.
> https://pmc.ncbi.nlm.nih.gov/articles/PMC8682797/

The platform TF-IDF variant uses train-split document frequencies, smoothed
`log((N+1)/(df+1))+1` IDF, and TF normalized by total document words.
Weighted TextRank uses a width-2 window and damping 0.85, iterates raw scores
to convergence, and applies L1 exactly once to the final scores. These are
recorded platform variants, not claims about the 2014 paper's original count
vector. Static embeddings train on the same complete position-major stream.

## Length, input, and resource contract

- Input whitespace is removed and letters are uppercased. Only the canonical
  20 residues above are accepted; empty or ambiguous input fails explicitly.
- `dr_max_raw_length` defaults to 50,000, with an absolute platform maximum of
  100,000.
- BoW, TF-IDF, and TextRank consume the complete normalized sequence, so
  `max_length` does not apply. `index`, `onehot`, and static embeddings
  truncate or pad by DR-token count.
- `dr_max_distance` accepts integers from `0` through `200` and defaults to `5`. Choose a distance for the available compute budget and validation protocol; the default does not establish an optimum.
- Dense outputs are estimated from their actual dtype and shape before
  allocation. `dr_dense_memory_limit_gib` controls the budget and defaults to
  4 GiB.

## Artifact compatibility

DR model artifacts and feature/static-embedding
caches record the alphabet, distance, feature width, stream order, and raw
length limit. Static vectors are copied into the model bundle. Artifacts
without the recorded DR contract—including the former 26-character, d0-omitting
implementation—are rejected and must be retrained and exported.
