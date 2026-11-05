# DT Implementation Appendix

The platform's `dt` means **Distance-based Top-n-gram**. The public
implementation is fixed to the paper's Top-1 variant. It is not distance
hashing over a raw sequence, and the former PSSM-score hash implementation is
no longer accepted:

> Liu, B., Xu, J., Zou, Q., Xu, R., Wang, X., & Chen, Q. (2014).
> Using distances between Top-n-gram and residue pairs for protein remote
> homology detection. *BMC Bioinformatics, 15*(Suppl 2), S3.
> https://pmc.ncbi.nlm.nih.gov/articles/PMC4015815/

## Paper representation

The highest-frequency amino acid in each row of a PSI-BLAST **target-frequency
matrix** forms a Top-1 sequence (T=t_1\ldots t_L). Frequency ties use the
fixed order `ARNDCQEGHILKMFPSTWYV`, making selection stable across training and
inference.

Every position contributes the d0 word (t_i). For each
(d=1,\ldots,D), the representation also adds the left-to-right directed word
(t_i\_d\_t_{i+d}). The DT feature alphabet follows the paper's fixed order
`ARDCQEHIGNLKMFPSTWYV`. Column indexes are:

\[
\operatorname{index}(a)=0,\ldots,19,
\]

\[
\operatorname{index}(a\_d\_b)
=20+(d-1)\times400+\operatorname{index}(a)\times20
+\operatorname{index}(b).
\]

The exact width is therefore (20+400D), with no hash collisions. `D=0` is
valid and retains only the 20 d0 Top-1 counts. BoW emits unnormalized raw
occurrence counts from the complete word stream and is the paper-aligned core
representation.

For the paper's Top-1 example `KFFK` with `D=2`, the source-position-major
stream is:

```text
K, K_1_F, K_2_F, F, F_1_F, F_2_K, F, F_1_K, K
```

This deterministic order defines the platform extension stream; it does not
change the BoW counts.

## Platform extensions

`tfidf` and `textrank` are platform extensions over the core DT-BOW map.
TF-IDF fits document frequencies only from train-split profile streams, uses
`log((N+1)/(df+1))+1`, and persists the fitted IDF with the model artifact.
Weighted TextRank operates on the complete source-position-major stream,
iterates raw scores to convergence, and applies L1 exactly once to the final
output. Neither output is presented as the 2014 paper's raw DT
count vector.

## Profile, length, and resource contract

- DT consumes the same PSI-BLAST target-frequency manifest as Top-n-gram.
  A legacy PSSM score index is not an equivalent input.
- Each profile binds its sample ID, normalized sequence length, and SHA-256.
  Missing, mismatched, or corrupt profiles fail explicitly. The tie policy is
  fixed rather than delegated to an unstable sort.
- `max_length` is measured in raw residues and is raised to the dataset maximum
  before training. DT does not silently truncate and then claim the complete
  paper representation.
- `dt_max_distance` accepts only integers from `0` through `200` and defaults
  to `5`. The default is a platform compute-budget choice, not an established optimum.
- Dense allocation is estimated from the sample count and exact feature width.
  `dt_dense_memory_limit_gib` controls the budget and defaults to 4 GiB.
- `profile_on_missing=error` is strict. Explicitly selecting
  `blosum62_target_frequency` uses the versioned BLOSUM62 target-frequency
  prior and records that choice in profile provenance and the model contract.

## Artifact compatibility

DT model artifacts and feature caches record Top-1,
the alphabet, d0 behavior, distance, stream order, exact width, target-frequency
manifest digest, and fallback policy. Inference validates every field and
requires a train-fitted IDF for DT TF-IDF. Artifacts without `dt_contract`, with
hash-width semantics, or from the legacy PSSM hash implementation cannot be
converted losslessly and must be retrained and exported.
