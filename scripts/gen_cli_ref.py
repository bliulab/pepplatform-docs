#!/usr/bin/env python3
"""Extract argparse arguments from CLI scripts using AST analysis.

Parses Python source files without executing them, extracting all
parser.add_argument() calls. Outputs JSON for downstream Markdown generation.
"""

import argparse
import ast
import json
import os
from pathlib import Path

PROJECT_ROOT = None
PUBLIC_TOOLS = (
    "audit_evaluation_protocol.py",
    "build_pair_split_data.py",
    "build_ppi_profile_cache.py",
    "build_psfm_cache.py",
    "build_pssm_cache.py",
    "build_sequence_profile_cache.py",
    "build_web_route_smoke_dataset.py",
    "decode_hlai_pseudoseq.py",
    "public_datasets.py",
    "train_static_embeddings.py",
    "train_unigram_tokenizer.py",
)
SUPPORTING_SCRIPTS = (
    "import_legacy_sqlite.py",
    "replay_experiment_metrics.py",
    "train_ensemble.py",
)


def configure_source_root(source_root):
    global PROJECT_ROOT
    root = Path(source_root).expanduser().resolve()
    for required in (
        "pepplatform/workflow.py",
        "scripts/train_sequence_pipeline.py",
        "scripts/train_pair_pipeline.py",
        "alembic/versions",
    ):
        if not (root / required).exists():
            raise ValueError(f"Invalid platform source root: missing {required}")
    PROJECT_ROOT = root
    return root


def static_value(node, values):
    """Resolve declarative constants only; never import or execute training code."""
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Name):
        if node.id in {"int", "float", "str", "bool"}:
            return {"int": int, "float": float, "str": str, "bool": bool}[node.id]
        return values[node.id]
    if (
        isinstance(node, ast.Attribute)
        and isinstance(node.value, ast.Name)
        and node.value.id == "argparse"
        and node.attr == "SUPPRESS"
    ):
        return argparse.SUPPRESS
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        items = []
        for item in node.elts:
            if isinstance(item, ast.Starred):
                items.extend(static_value(item.value, values))
            else:
                items.append(static_value(item, values))
        return (
            tuple(items)
            if isinstance(node, ast.Tuple)
            else set(items)
            if isinstance(node, ast.Set)
            else items
        )
    if isinstance(node, ast.Dict):
        result = {}
        for key, value in zip(node.keys, node.values):
            if key is None:
                result.update(static_value(value, values))
            else:
                result[static_value(key, values)] = static_value(value, values)
        return result
    if isinstance(node, ast.Subscript):
        return static_value(node.value, values)[static_value(node.slice, values)]
    if isinstance(node, ast.IfExp):
        return static_value(node.body if static_value(node.test, values) else node.orelse, values)
    if isinstance(node, ast.Slice):
        return slice(
            *(
                static_value(part, values) if part is not None else None
                for part in (node.lower, node.upper, node.step)
            )
        )
    if isinstance(node, (ast.ListComp, ast.SetComp, ast.GeneratorExp)):

        def expand(index, local):
            if index == len(node.generators):
                yield static_value(node.elt, local)
                return
            generator = node.generators[index]
            if not isinstance(generator.target, ast.Name) or generator.is_async:
                raise ValueError("unsupported comprehension target")
            for item in static_value(generator.iter, local):
                scope = {**local, generator.target.id: item}
                if all(static_value(condition, scope) for condition in generator.ifs):
                    yield from expand(index + 1, scope)

        result = list(expand(0, values))
        return set(result) if isinstance(node, ast.SetComp) else result
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return -static_value(node.operand, values)
    if isinstance(node, ast.Compare) and len(node.ops) == 1:
        left, right = static_value(node.left, values), static_value(node.comparators[0], values)
        if isinstance(node.ops[0], ast.Eq):
            return left == right
        if isinstance(node.ops[0], ast.NotEq):
            return left != right
        if isinstance(node.ops[0], ast.In):
            return left in right
        if isinstance(node.ops[0], ast.NotIn):
            return left not in right
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
        return static_value(node.left, values) + static_value(node.right, values)
    if isinstance(node, ast.JoinedStr):
        return "".join(
            str(static_value(part.value, values))
            if isinstance(part, ast.FormattedValue)
            else part.value
            for part in node.values
        )
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
        conversions = {
            "tuple": tuple,
            "list": list,
            "set": set,
            "frozenset": frozenset,
            "sorted": sorted,
        }
        if node.func.id in conversions and len(node.args) == 1 and not node.keywords:
            return conversions[node.func.id](static_value(node.args[0], values))
        function = values.get(node.func.id)
        if (
            isinstance(function, ast.FunctionDef)
            and len(function.body) == 1
            and isinstance(function.body[0], ast.Return)
        ):
            arguments = {
                arg.arg: static_value(value, values)
                for arg, value in zip(function.args.args, node.args)
            }
            return static_value(function.body[0].value, {**values, **arguments})
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and not node.keywords:
        if (
            isinstance(node.func.value, ast.Name)
            and node.func.value.id == "dict"
            and node.func.attr == "fromkeys"
            and len(node.args) == 1
        ):
            return dict.fromkeys(static_value(node.args[0], values))
        if node.func.attr in {"keys", "values", "items"} and not node.args:
            mapping = static_value(node.func.value, values)
            if isinstance(mapping, dict):
                return list(getattr(mapping, node.func.attr)())
    raise ValueError(ast.unparse(node) if node is not None else "unknown expression")


def source_constants(path, seen=None):
    """Read local constant imports with AST, including defaults and choice registries."""
    seen = set() if seen is None else seen
    path = Path(path).resolve()
    if path in seen:
        return {}
    seen.add(path)
    values = {}
    for node in ast.parse(path.read_text()).body:
        if (
            isinstance(node, ast.ImportFrom)
            and node.module
            and node.module.startswith("pepplatform")
        ):
            target = PROJECT_ROOT.joinpath(*node.module.split(".")).with_suffix(".py")
            if target.is_file():
                imported = source_constants(target, seen)
                values.update(
                    {
                        alias.asname or alias.name: imported[alias.name]
                        for alias in node.names
                        if alias.name in imported
                    }
                )
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            try:
                value = static_value(node.value, values)
            except (ValueError, KeyError, TypeError, IndexError):
                continue
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            for target in targets:
                if isinstance(target, ast.Name):
                    values[target.id] = value
    seen.remove(path)
    return values


def extract_add_argument_calls(tree: ast.AST, values=None) -> list[dict]:
    """Walk AST and extract all add_argument method calls."""
    results = []

    values = values or {}
    nodes = []

    class Calls(ast.NodeVisitor):
        def visit_Assign(self, node):
            if isinstance(tree, ast.FunctionDef):
                try:
                    value = static_value(node.value, values)
                except (ValueError, KeyError, TypeError, IndexError):
                    return self.generic_visit(node)
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        values[target.id] = value
            self.generic_visit(node)

        def visit_FunctionDef(self, node):
            if isinstance(tree, ast.FunctionDef) and node is not tree:
                values[node.name] = node
                return
            self.generic_visit(node)

        def visit_Call(self, node):
            helpers = {
                "add_selection_arguments": "objectives.py",
                "add_stream_cli_arguments": "stream_spec.py",
                "add_tower_cli_arguments": "tower_spec.py",
            }
            if isinstance(node.func, ast.Name) and node.func.id in helpers:
                helper_path = PROJECT_ROOT / "pepplatform" / helpers[node.func.id]
                helper_values = source_constants(helper_path)
                helper_values["checkpoint"] = True
                for kw in node.keywords:
                    if kw.arg == "checkpoint":
                        helper_values["checkpoint"] = static_value(kw.value, values)
                helper = next(
                    item
                    for item in ast.parse(helper_path.read_text()).body
                    if isinstance(item, ast.FunctionDef) and item.name == node.func.id
                )
                results.extend(extract_add_argument_calls(helper, helper_values))
            else:
                nodes.append((node, dict(values)))
            self.generic_visit(node)

        def visit_For(self, node):
            if isinstance(node.target, ast.Name):
                try:
                    items = static_value(node.iter, values)
                except (ValueError, KeyError, TypeError, IndexError):
                    return self.generic_visit(node)
                old = dict(values)
                for item in items:
                    values[node.target.id] = item
                    for statement in node.body:
                        self.visit(statement)
                values.clear()
                values.update(old)
                return
            self.generic_visit(node)

        def visit_If(self, node):
            try:
                condition = static_value(node.test, values)
            except (ValueError, KeyError, TypeError, IndexError):
                return self.generic_visit(node)
            for statement in node.body if condition else node.orelse:
                self.visit(statement)

    Calls().visit(tree)
    for node, local_values in nodes:
        if not isinstance(node, ast.Call):
            continue

        func = node.func
        if not (isinstance(func, ast.Attribute) and func.attr == "add_argument"):
            continue

        entry: dict = {
            "name": "",
            "type": "str",
            "default": "None",
            "choices": None,
            "help": "",
            "required": False,
        }
        hidden = False

        try:
            names = []
            for arg in node.args:
                if isinstance(arg, ast.Starred):
                    names.extend(static_value(arg.value, local_values))
                else:
                    names.append(static_value(arg, local_values))
        except (ValueError, KeyError, TypeError, IndexError):
            continue
        if not names or not all(isinstance(name, str) for name in names):
            continue
        entry["name"] = names[0]
        entry["aliases"] = names[1:]

        for kw in node.keywords:
            if kw.arg == "type":
                if isinstance(kw.value, ast.Name):
                    entry["type"] = "str" if kw.value.id == "encoder_argument" else kw.value.id
                elif isinstance(kw.value, ast.Attribute):
                    entry["type"] = ast.unparse(kw.value)
                else:
                    try:
                        entry["type"] = static_value(kw.value, local_values).__name__
                    except (ValueError, KeyError, TypeError, IndexError, AttributeError):
                        entry["type"] = ast.unparse(kw.value)
            elif kw.arg == "default":
                try:
                    entry["default"] = repr(static_value(kw.value, local_values))
                except (ValueError, KeyError, TypeError, IndexError):
                    entry["default"] = ast.unparse(kw.value)
            elif kw.arg == "choices":
                try:
                    entry["choices"] = list(static_value(kw.value, local_values))
                except (ValueError, KeyError, TypeError, IndexError):
                    entry["choices_expression"] = ast.unparse(kw.value)
            elif kw.arg == "required":
                entry["required"] = isinstance(kw.value, ast.Constant) and kw.value.value is True
            elif kw.arg == "help":
                if isinstance(kw.value, ast.Constant):
                    entry["help"] = kw.value.value
                elif isinstance(kw.value, ast.Attribute) and kw.value.attr == "SUPPRESS":
                    hidden = True
            elif kw.arg == "action":
                if isinstance(kw.value, ast.Constant):
                    entry["type"] = f"flag ({kw.value.value})"
                    if not any(k.arg == "default" for k in node.keywords):
                        entry["default"] = {"store_true": "False", "store_false": "True"}.get(
                            kw.value.value, "None"
                        )
                elif isinstance(kw.value, ast.Attribute):
                    entry["type"] = f"flag ({ast.unparse(kw.value)})"

        if not hidden:
            results.append(entry)

    return list({entry["name"]: entry for entry in results}.values())


def categorize_params(params: list[dict]) -> dict[str, list[dict]]:
    """Group parameters by category for organized table output."""
    categories: dict[str, list[dict]] = {
        "task": [],
        "tokenizer": [],
        "encoder": [],
        "model": [],
        "training": [],
        "pretrained": [],
        "embedding": [],
        "profile": [],
        "feature_transform": [],
        "ml_reduction": [],
        "classifier_svm": [],
        "classifier_logreg": [],
        "classifier_rf": [],
        "classifier_et": [],
        "classifier_histgb": [],
        "classifier_xgb": [],
        "classifier_lgb": [],
        "pair": [],
        "semantic": [],
        "io": [],
        "other": [],
    }

    for p in params:
        name = p["name"].lstrip("-")

        if name.startswith(("peptide_", "partner_")) and not name.endswith(
            "feature_extraction_batch_size"
        ):
            categories.setdefault("towers", []).append(p)
        elif "objective" in name or "search_profile" in name:
            categories.setdefault("selection", []).append(p)
        elif name in (
            "task_type",
            "task_root",
            "train_csv",
            "val_csv",
            "test_csv",
            "val_ratio",
            "split_seed",
            "data_dir",
        ):
            categories["task"].append(p)
        elif name in (
            "tokenizer",
            "k",
            "dr_max_distance",
            "dr_max_raw_length",
            "dr_dense_memory_limit_gib",
            "top_ngram_n",
            "dt_max_distance",
            "dt_dense_memory_limit_gib",
            "bpe_path",
            "bpe_vocab_size",
            "unigram_path",
            "unigram_vocab_size",
            "unigram_sampling",
            "unigram_nbest_size",
            "unigram_alpha",
            "unigram_max_raw_length",
            "wordpiece_path",
            "wordpiece_vocab_size",
            "wordpiece_max_raw_length",
        ):
            categories["tokenizer"].append(p)
        elif name in (
            "encoder",
            "ac_lag",
            "cc_lag",
            "acc_lag",
            "pdt_lag",
            "pdt_max_raw_length",
            "ac_pssm_lag",
            "cc_pssm_lag",
            "acc_pssm_lag",
            "ac_pssm_blosum62_hybrid_lag",
            "cc_pssm_blosum62_hybrid_lag",
            "acc_pssm_blosum62_hybrid_lag",
            "feature_mode",
            "primary_feature_mode",
            "aux_feature_mode",
            "aux_tokenizer",
            "aux_encoder",
            "mm_align_dim",
        ):
            categories["encoder"].append(p)
        elif name in ("model", "sequence_model", "training_mode", "classifier"):
            categories["model"].append(p)
        elif name in (
            "max_length",
            "batch_size",
            "lr",
            "epochs",
            "dropout",
            "weight_decay",
            "grad_clip_norm",
            "early_stop_patience",
            "early_stop_min_delta",
            "dl_scaler",
        ):
            categories["training"].append(p)
        elif "esm" in name or "protbert" in name or "prott5" in name or "esmc" in name:
            categories["pretrained"].append(p)
        elif name in (
            "word2vec_path",
            "glove_path",
            "fasttext_path",
            "embedding_vector_size",
            "embedding_window",
            "embedding_min_count",
            "embedding_epochs",
            "embedding_workers",
            "feature_dir",
        ) or name.startswith("glove_"):
            categories["embedding"].append(p)
        elif "pssm" in name or "psfm" in name or "profile_" in name:
            categories["profile"].append(p)
        elif name in (
            "reduction",
            "lsa_dim",
            "lsa_dense_memory_limit_gib",
            "lda_topics",
            "lda_dense_memory_limit_gib",
            "plsa_topics",
            "plsa_memory_limit_gib",
            "tsvd_dense_memory_limit_gib",
            "pca_dense_memory_limit_gib",
            "kpca_memory_limit_gib",
            "ml_scaler",
        ):
            categories["feature_transform"].append(p)
        elif name.startswith("ml_"):
            categories["ml_reduction"].append(p)
        elif name.startswith("svm_"):
            categories["classifier_svm"].append(p)
        elif name.startswith("logreg_"):
            categories["classifier_logreg"].append(p)
        elif name.startswith("rf_"):
            categories["classifier_rf"].append(p)
        elif name.startswith("et_"):
            categories["classifier_et"].append(p)
        elif name.startswith("histgb_"):
            categories["classifier_histgb"].append(p)
        elif name.startswith("xgb_"):
            categories["classifier_xgb"].append(p)
        elif name.startswith("lgb_"):
            categories["classifier_lgb"].append(p)
        elif name in (
            "pair_strategy",
            "interaction_level",
            "interaction_model",
            "predictor_type",
            "graph_predictor",
            "ppi_interaction_mode",
            "hlaii_interaction_mode",
            "fusion_mode",
            "gnn_k",
            "gnn_hidden_dim",
        ):
            categories["pair"].append(p)
        elif "semantic" in name or "hla_context" in name or "hlai_semantic" in name:
            categories["semantic"].append(p)
        elif name in (
            "interactive",
            "advanced_wizard",
            "report_aupr",
            "artifact_dir",
            "cache_features",
        ):
            categories["io"].append(p)
        else:
            categories["other"].append(p)

    return {k: v for k, v in categories.items() if v}


def process_script(script_path: str) -> dict:
    """Parse a Python script and extract argparse arguments."""
    source = Path(script_path).read_text()
    tree = ast.parse(source)
    params = extract_add_argument_calls(tree, source_constants(script_path))
    categorized = categorize_params(params)
    return {
        "script": str(Path(script_path).resolve().relative_to(PROJECT_ROOT)),
        "total_args": len(params),
        "categories": categorized,
    }


def process_tools_dir(tools_dir: str) -> list[dict]:
    """Parse the public platform tools."""
    results = []
    tools_path = Path(tools_dir)
    for name in PUBLIC_TOOLS:
        py_file = tools_path / name
        source = py_file.read_text()
        try:
            tree = ast.parse(source)
            params = extract_add_argument_calls(tree, source_constants(py_file))
            if params:
                results.append(
                    {
                        "script": str(py_file.resolve().relative_to(PROJECT_ROOT)),
                        "name": py_file.stem,
                        "total_args": len(params),
                        "params": params,
                    }
                )
        except SyntaxError:
            continue

    return results


def process_supporting_scripts(scripts_dir: str) -> list[dict]:
    """Parse supporting CLI scripts in scripts/ directory."""
    results = []
    scripts_path = Path(scripts_dir)
    for name in SUPPORTING_SCRIPTS:
        py_file = scripts_path / name
        source = py_file.read_text()
        try:
            tree = ast.parse(source)
            params = extract_add_argument_calls(tree, source_constants(py_file))
            if params:
                results.append(
                    {
                        "script": str(py_file.resolve().relative_to(PROJECT_ROOT)),
                        "name": py_file.stem,
                        "total_args": len(params),
                        "params": params,
                    }
                )
        except SyntaxError:
            continue

    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-root", type=Path, default=os.environ.get("PEPPLATFORM_SOURCE_ROOT")
    )
    args = parser.parse_args()
    if args.source_root is None:
        parser.error("Set PEPPLATFORM_SOURCE_ROOT or pass --source-root to select platform source")
    try:
        project_root = configure_source_root(args.source_root)
    except ValueError as exc:
        parser.error(str(exc))
    out_dir = Path(__file__).resolve().parent.parent / ".cli-ref"
    out_dir.mkdir(exist_ok=True)

    output: dict = {}

    train_pipeline = process_script(str(project_root / "scripts" / "train_pipeline.py"))
    output["train_pipeline"] = train_pipeline

    train_sequence = process_script(str(project_root / "scripts" / "train_sequence_pipeline.py"))
    output["train_sequence_pipeline"] = train_sequence

    train_pair = process_script(str(project_root / "scripts" / "train_pair_pipeline.py"))
    output["train_pair_pipeline"] = train_pair

    tools = process_tools_dir(str(project_root / "tools"))
    output["tools"] = tools

    supporting = process_supporting_scripts(str(project_root / "scripts"))
    output["supporting_scripts"] = supporting

    out_file = out_dir / "cli_ref.json"
    out_file.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"Extracted CLI reference to {out_file}")
    print(f"  train_pipeline.py: {train_pipeline['total_args']} args")
    print(f"  train_sequence_pipeline.py: {train_sequence['total_args']} args")
    print(f"  train_pair_pipeline.py: {train_pair['total_args']} args")
    print(f"  tools: {len(tools)} scripts")
    print(f"  supporting: {len(supporting)} scripts")


if __name__ == "__main__":
    main()
