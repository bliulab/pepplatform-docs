# Physicochemical Distance Transformation Contract

PepPlatform's public `pdt` encoder implements the sequence-based
Physicochemical Distance Transformation (PDT) from Liu et al., *Using Amino
Acid Physicochemical Distance Transformation for Fast Protein Remote Homology
Detection*, PLoS ONE 7(9):e46633 (2012), DOI
[10.1371/journal.pone.0046633](https://doi.org/10.1371/journal.pone.0046633).

This is not the paper's profile-based variant. Profile-based PDT first replaces
each residue with the n-th most frequent residue from a PSI-BLAST frequency
profile; that workflow is intentionally not part of the public `pdt` route.

## Definition

The implementation uses the 531 complete AAIndex1 properties supplied with the
paper. For every property `j`, the 20 residue values are population-standardized:

```text
I[j,a] = (P[j,a] - mean_20(P[j])) / std_population_20(P[j])
```

For a normalized sequence `A_1 ... A_L`, lag `lambda` is represented by:

```text
PDT[j,lambda] = sum(i=1..L-lambda)
                 (I[j,A_i] - I[j,A_(i+lambda)])^2 / (L-lambda)
```

The feature vector is property-major: all lags for the first AAIndex
accession, then all lags for the second accession, and so on. Its dimension is
`531 * pdt_lag`; the default `pdt_lag` is 8, matching the paper's experiment.

## Input and artifact rules

`pdt` requires `tokenizer=kmer` with `k=1`, but it consumes the complete raw
residue sequence and is not truncated by tokenizer `max_length`. Inputs are
upper-cased after trimming outer whitespace; internal whitespace, empty input,
non-standard residues, and sequence length `<= pdt_lag` are rejected.

Every artifact records a versioned `pdt_encoder_contract` containing the source
DOI, AAIndex snapshot checksums, normalization and distance formulas, feature
ordering, lag, raw-length limit, dtypes, and output dimension. Artifacts without
an exact supported contract must be retrained.

The bundled snapshot is derived from the paper's Text S1 and is checked at
runtime. The source references are retained in `pepplatform/pdt.py` for audit
and reproducibility.
