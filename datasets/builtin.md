# Built-in Dataset Catalog

The source catalog defines 7 entries across four tasks. **Neither the source distribution nor the supplied Docker image bundles these datasets.** The platform registers an entry only when its source path exists; a catalog name does not establish valid contents or a particular sample count.

## Dataset Catalog

| ID | Task |
| --- | --- |
| `builtin-pep-function-quick` | `pep_function` |
| `builtin-pep-function` | `pep_function` |
| `builtin-pep-hlaii` | `pep_hlaii` |
| `builtin-pep-hlaii-full` | `pep_hlaii` |
| `builtin-ppi` | `pep_protein_interaction` |
| `builtin-ppi-quick` | `pep_protein_interaction` |
| `builtin-hlai` | `pep_hlai` |

The runtime may select a normalized split directory or a legacy source root depending on the available local files. Check the actual entry in the Datasets page and its report. For new data, use [Custom Upload](./upload); catalog registration alone does not replace validation or route preflight.

## Labels and Dataset Size

`pep_function` is a multilabel task whose label names and output width come from `labels.csv`; it does not require 15 labels. Pair tasks use binary labels. The current distribution contains none of the research datasets above, so this page makes no claim about their sample counts, class balance or benchmark performance.

## Checking the Upload Format

To check the single-sequence upload workflow, generate a synthetic ZIP from the source root:

```bash
python tools/build_web_route_smoke_dataset.py --output output/synthetic-sequences.zip
```

This tool produces a small set of artificial sequences with two example labels for workflow checks. They are not biological annotations or a performance benchmark. Upload the archive on the Datasets page and inspect its report.

## Next Steps

- [Data Format Spec](./format)
- [Custom Upload](./upload)
- [Public Databases CLI](./public-databases-cli)
- [Task Types](../concepts/tasks)
