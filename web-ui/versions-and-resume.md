# Versions and Downstream Resume

Version records in experiment detail identify the source, configuration, inputs and model actually used by a run. Several runs may reference identical content. A version ID identifies content, not performance rank.

## Inspect Versions

Use the version section to inspect recording status, content versions and related runs, or download a JSON summary. Access requires visibility of the associated experiment. Public responses filter local paths, commands and internal errors.

New runs capture dependencies and seal successful models. Failed sealing or integrity verification blocks verified-model inference. `not_recorded` means a legacy run has no version record; it does not certify the model under the new mechanism. See the [Version API](../api/versions).

## Rerun versus Resume

Rerun copies configuration into a new draft for a fresh training run. It does not restore the original training process.

Current downstream resume is specifically for a **failed SVM experiment** with an intact saved embedding resume bundle. It creates a new experiment, reuses the representation and refits the downstream SVM. It is not general epoch-level checkpoint resume and does not automatically recover training interrupted by a service restart.

## Resume a Downstream SVM

1. Check whether the failed experiment exposes the resume action and a usable bundle.
2. Adjust supported SVM convergence, regularization, scaling, reduction or tuning settings.
3. Preserve the SVM classifier and calibration mode. Upstream encoding, dataset and learned representation cannot be changed.
4. Submit after preflight; the original failure remains traceable.

Allowed overrides are documented in the [Experiment API](../api/experiments). Creation consumes the normal experiment quota. The CLI exposes `--resume_embedding_bundle`; it requires a valid resume bundle rather than an arbitrary model directory.
