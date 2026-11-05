# Unified Semantic Auxiliary Layer

The unified semantic layer adds a representation constraint beside the main classification loss. It uses an InfoNCE-style contrastive loss with a dedicated semantic projection head. Preflight rejects classic classifiers, fixed-representation-to-classic-classifier routes, and pair sample-graph models.

## Two relation types

| Task | Automatically selected relation | Construction scope |
| --- | --- | --- |
| `pep_function` | Jaccard over function-label sets | Training split only |
| `pep_protein_interaction`, `pep_hlaii`, `pep_hlai` | Neighborhood Jaccard on the positive-interaction bipartite graph | Positive training edges only |

Pair tasks no longer select task-specific modes. The former `hla_context` and `hlai_anchor` modes have been removed; the task type determines the relation automatically.

## Training behavior

The main DataLoader, random sampling order, and classification loss retain the ordinary baseline behavior. After the split is frozen, the system deterministically assigns each eligible training anchor:

- one partner with non-zero Jaccard by default;
- up to eight valid weak zero-overlap partners by default (in-batch negatives fill any shortfall).

No complete sample-similarity matrix is built. Each main batch only looks up its fixed partner table. Anchors and deduplicated partners are then encoded by an auxiliary forward pass. Classification loss applies only to the original main batch; partners never enter classification loss. An anchor without a non-zero partner remains classification-only.

During the auxiliary forward, BatchNorm and Dropout both use eval behavior while autograd remains enabled. Both sides therefore use the same deterministic normalization mode and still contribute gradients to the single joint update. Module modes and RNG state are restored afterwards.

The semantic loss is a temperature-scaled cosine contrastive loss. For each anchor,
`-log( sum(exp(pos_logits)) / (sum(exp(pos_logits)) + sum(exp(neg_logits))) )`,
with `logits = cosine / temperature`. Pair tasks default to `role_fused`: peptide-side, partner-side, and fused pair embeddings are constrained separately when the model exposes separable towers; Single-stream models automatically fall back to fused-only.

Semantic embeddings pass through a dedicated `SemanticProjection` before the contrastive loss. In the default auxiliary-only configuration, the projection is not consumed by classification inference. An optional inference-visible residual adapter instead classifies `h + g R(P(h))`, where `P` is the supervised semantic projection, `R` maps it back to predictor width, and `g` is either a fixed weight or a learned scalar initialized at zero. A semantic-enabled neural artifact can explicitly export its L2-normalized projection through the Python semantic-representation API for retrieval, clustering, or label-transfer workflows.

Validation and test never construct partners or compute semantic loss.

## Optional Jaccard-weighted objective

`--semantic_loss_type` selects between two auxiliary objectives:

- `legacy` (also used when omitted) preserves every historical branch, including
  equal weights for fixed partners, exponent weighting for sequence dense_hard/placebo,
  and exponent weighting for pair fused dense_hard.
- `jaccard_supcon` weights each positive's log probability by its stored Jaccard,
  divides by the number of positives, then averages over usable anchors.

```text
q_ip = exp(cos(z_i, z_p) / temperature) / sum_a exp(cos(z_i, z_a) / temperature)
L_i = -sum_p(J_ip * log(q_ip)) / number_of_positive_partners
L_semantic = mean(L_i over usable anchors)
L_total = L_classification + semantic_similarity_weight * L_semantic
```

Candidates remain each anchor's deduplicated positive and negative partners, with
the existing auxiliary-batch negative fallback. Fallback rows are not necessarily
verified zero-Jaccard pairs. This option does not recompute similarities, introduce
a threshold, change sampling, or weight the softmax denominator. Dividing by the
positive **count**, rather than weight sum, retains the effect of Jaccard even with
one positive. Anchors without positives or available negatives are skipped; an
entirely unusable batch returns differentiable zero. The new branch uses logsumexp.

Neural routes accepted by semantic-loss validation can select this objective;
pair sample-graph models and fixed-representation/classical routes are excluded. Pair fused, peptide and context branches use the
same selection with the existing branch averaging. This is a partner-sampled
MultiSupCon-style extension based on a sampled partner table. The separate
contrastive pretraining loss and `semantic_contrastive_mode` remain independent.
The Web training wizard exposes both choices after semantic training is enabled.

```bash
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data \
  --task_type pep_function --model transformer \
  --enable_semantic_similarity --semantic_loss_type jaccard_supcon \
  --semantic_similarity_weight 0.1 --artifact_dir artifacts/function_jaccard_supcon_run1
```

Historical configurations need no migration and retain their provenance format.
The `jaccard_supcon` objective additionally records a `loss_contract` with the
formula version, weight placement, normalization and candidate/fallback rules.
It refuses to overwrite a directory containing historical semantic provenance.
Use independent run directories and keep new results separate from frozen campaigns.

Whether weighting improves classification requires controlled experiments. With
one positive it mainly rescales each anchor; multiple positives also receive
different relative contributions. Hold splits, models, seeds and partner tables
fixed, and compare semantic-loss coefficients on validation data to distinguish
objective effects from changes in overall constraint strength.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `--enable_semantic_similarity` | `False` | Enable the unified semantic auxiliary layer |
| `--semantic_loss_type` | `legacy` | Historical objective or per-positive `jaccard_supcon` weighting |
| `--semantic_similarity_weight` | `0.1` | Semantic-loss weight in the joint objective |
| `--semantic_pair_mode` | `role_fused` | Pair semantic mode: `fused`, `role`, or `role_fused` |
| `--semantic_projection_dim` | `64` | Semantic projection output dimension |
| `--semantic_contrastive_temperature` | `0.1` | Contrastive temperature |
| `--semantic_positive_partners` | `1` | Positive partners per anchor |
| `--semantic_zero_partners` | `8` | Zero-overlap negative partners per anchor |
| `--semantic_zero_weight` | `0.25` | Deprecated compatibility option; no longer affects the loss |
| `--semantic_loss_space` | `projection` | Apply the relation loss in the dedicated semantic projection or shared predictor space |
| `--semantic_residual_weight` | `0.0` | Enable the inference-visible residual at this fixed scale; pair models may use it as the configured scale for a learned gate |
| `--semantic_learned_gate` | `False` | Pair models only: initialize a trainable residual gate at zero |
| `--semantic_partner_scheme` | `fixed` | `fixed`, exact structure-matched `fixed_placebo`, `dense_hard`, or historical `placebo` |

The old pair options `--enable_interaction_semantic_similarity`, `--interaction_semantic_similarity_weight`, and `--interaction_semantic_mode profile_jaccard` are accepted only when loading historical configurations. New configurations always write the canonical options above. Removed task-specific modes and their margin/smoothing parameters are never silently mapped.

## Web partner count settings

Enable semantic auxiliary loss under **Custom → Semantic similarity** in the training wizard:

- Positive partners per anchor: `semantic_positive_partners`, default 1, integer at least 1.
- Zero-overlap negative partners per anchor: `semantic_zero_partners`, default 8, integer at least 0.

These values control sampling requests for the existing fixed partner table. Availability and
deduplication may reduce actual counts. With zero negative partners requested, the loss may
still fill negatives from the auxiliary batch using its existing rules.
Preflight, saved experiments, cloning, and training commands preserve the counts; historical
configs without these fields continue to use 1 / 8. Both `legacy` and `jaccard_supcon` support
these settings. Changing counts changes the partner table for a new run, so record the values
and keep the split, seed, and other settings fixed when comparing experiments.

## Reproducibility and artifacts

Semantic training fixes the split, seed, candidate ordering, and partner count. The main loader keeps PyTorch's `RandomSampler` algorithm, and model metadata records a SHA-256 of the sample order for every epoch. With artifact output enabled, the system also writes:

- `data_split_indices.npz`: actual train/validation/test sample identifiers;
- `semantic_relation_source.npz`: training labels or the positive training graph;
- `semantic_partner_table.npz`: fused row-level anchor-partner relations;
- `semantic_peptide_partner_table.npz` / `semantic_context_partner_table.npz`: role-level entity relations;
- `semantic_placebo_reference_table.npz` and role-specific placebo reference tables: the unshuffled fixed tables used to audit an exact structure-matched placebo;
- `semantic_role_mapping.npz`: mapping from training rows to peptide/context entity indices;
- `semantic_provenance.json`: relation type, seed, mode, temperature, projection dimension, and file hashes; `jaccard_supcon` additionally includes `loss_contract`.

Semantic-enabled model metadata includes a semantic-representation contract. It records available fused and role-specific vectors, dimensions, L2 normalization, role-level classification usage, whether a residual adapter is enabled, fixed versus learned gate type, configured residual weight, and the learned gate's final effective value. Earlier semantic-representation artifacts remain readable as historical metadata. Missing projectors are reported as unsupported; export never silently falls back to the ordinary predictor embedding.

This provides ordinary method-level reproducibility, not cross-hardware bitwise identity.

## Examples

```bash
# Single-sequence function task: label-set Jaccard is automatic
python scripts/train_sequence_pipeline.py --data_dir /path/to/function-data \
  --task_type pep_function \
  --model transformer \
  --enable_semantic_similarity \
  --semantic_similarity_weight 0.1

# Any pair task: positive-interaction neighborhood Jaccard is automatic
python scripts/train_pair_pipeline.py --data_dir /path/to/pair-data \
  --task_type pep_hlai \
  --model bi_cross_attn \
  --enable_semantic_similarity \
  --semantic_pair_mode role_fused \
  --semantic_similarity_weight 0.1
```

## Related pages

- [Task Types](./tasks)
- [Pair Interaction](./pair-interaction)
- [Training Modes](./training-modes)
