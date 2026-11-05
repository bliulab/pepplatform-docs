"""Documentation maintenance checks requiring no platform checkout or training libraries."""

import argparse
import ast
import copy
import importlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import patch

DOCS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(DOCS / "scripts"))

check_docs = importlib.import_module("check_docs")
gen_cli_ref = importlib.import_module("gen_cli_ref")


HELPER = textwrap.dedent("""\
    import argparse

    raise RuntimeError("Reference extraction must not execute this module")

    ROUTES = ("classic", "pretrained")

    def add_stream_cli_arguments(parser):
        for role in ("peptide", "partner"):
            def options(name):
                return (f"--{role}_{name}", f"--protein_{name}") if role == "partner" else (f"--{role}_{name}",)
            parser.add_argument(*options("encoder"), type=str, default="")
            parser.add_argument(*options("feature_route"), choices=ROUTES, default="classic")
            parser.add_argument(*options("length"), type=int, default=128)
            parser.add_argument(*options("optional"), type=float, default=argparse.SUPPRESS)
            parser.add_argument(*options("internal"), help=argparse.SUPPRESS)
""")

ENTRYPOINT = textwrap.dedent("""\
    import argparse
    from pepplatform.stream_spec import add_stream_cli_arguments

    raise RuntimeError("Reference extraction must not execute the training entry point")

    def build_argument_parser():
        parser = argparse.ArgumentParser()
        parser.add_argument("--stream_alignment_dim", type=int, default=256)
        parser.add_argument("--pair_strategy", choices=["single_stream", "two_stream"], default=None)
        add_stream_cli_arguments(parser)
        return parser
""")


class ArgumentExtractionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="pep-docs-arguments-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / "pepplatform").mkdir()
        (self.root / "scripts").mkdir()
        (self.root / "pepplatform/stream_spec.py").write_text(HELPER)
        self.script = self.root / "scripts/train_pair_pipeline.py"
        self.script.write_text(ENTRYPOINT)
        self.patch_root = patch.object(gen_cli_ref, "PROJECT_ROOT", self.root)
        self.patch_root.start()
        self.addCleanup(self.patch_root.stop)

    def extracted(self):
        result = gen_cli_ref.process_script(self.script)
        return {
            entry["name"]: entry for entries in result["categories"].values() for entry in entries
        }

    def runtime_parser(self):
        # Execute only this test's trusted declarations to obtain an independent
        # argparse reference; the module-level failure sentinels are excluded.
        namespace = {}
        for source in (HELPER, ENTRYPOINT):
            tree = ast.parse(source)
            tree.body = [
                node
                for node in tree.body
                if isinstance(node, (ast.Import, ast.Assign, ast.FunctionDef))
            ]
            exec(compile(tree, "<test parser declarations>", "exec"), namespace)  # noqa: S102
        return namespace["build_argument_parser"]()

    def test_shared_stream_helper_matches_visible_runtime_arguments(self):
        extracted = self.extracted()
        actual = {
            action.option_strings[0]: action
            for action in self.runtime_parser()._actions
            if action.option_strings[0] != "-h" and action.help != argparse.SUPPRESS
        }
        self.assertEqual(set(extracted), set(actual))
        for name, action in actual.items():
            with self.subTest(argument=name):
                entry = extracted[name]
                self.assertEqual(entry["default"], repr(action.default))
                self.assertEqual(entry["aliases"], action.option_strings[1:])
                self.assertEqual(entry["choices"], list(action.choices) if action.choices else None)
                self.assertEqual(entry["type"], action.type.__name__ if action.type else "str")

    def test_loop_roles_aliases_and_suppressed_defaults_are_retained(self):
        extracted = self.extracted()
        for role in ("peptide", "partner"):
            self.assertIn(f"--{role}_encoder", extracted)
            self.assertNotIn(f"--{role}_internal", extracted)
            self.assertEqual(extracted[f"--{role}_optional"]["default"], repr(argparse.SUPPRESS))
        self.assertEqual(extracted["--partner_encoder"]["aliases"], ["--protein_encoder"])
        self.assertEqual(extracted["--pair_strategy"]["choices"], ["single_stream", "two_stream"])

    def test_extraction_does_not_execute_source_modules(self):
        self.assertEqual(len(self.extracted()), 10)


class PublicPageTests(unittest.TestCase):
    def test_private_material_is_excluded_without_hiding_dataset_guides(self):
        public = {"index.md", "datasets/format.md", "zh/datasets/format.md", "api/system.md"}
        private = {
            ".export-audit/before/index.md",
            "tests/fixtures/index.md",
            "experiment_paper/note.md",
            "Paper_revision_example/note.md",
            "Figure7_example/note.md",
            "tmp_preview/note.md",
            "AGENTS.md",
            "notes/AGENTS.md",
            "CURRENT_MANUSCRIPT.md",
            "EXPERIMENT_REPRODUCIBILITY_NOTE.md",
            "OPEN_SOURCE_COPY_CHECKLIST.md",
            "INTERNAL_AUDIT.md",
            "README.md",
        }
        with tempfile.TemporaryDirectory(prefix="pep-docs-pages-") as temporary:
            root = Path(temporary)
            for relative in public | private:
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("# Fixture\n")
            with patch.object(check_docs, "DOCS", root):
                self.assertEqual(
                    {p.relative_to(root).as_posix() for p in check_docs.pages()}, public
                )


class InternalVersionTests(unittest.TestCase):
    def test_internal_prose_and_numeric_json_versions_are_rejected(self):
        for text in (
            "Evaluation protocol V3",
            "protocol_v3_seed42",
            "LSA contract-v1",
            "provenance schema v3",
            "BoW-v2 raw counts",
            "v4 profiles are never truncated",
            "Version 1 reads completed experiments",
            "当前定义版本为 2",
            "协议V3",
            "契约版本为v2",
            "第 3 版契约",
            "single_stream(role-boundary-sequence-join-v1)",
            '{"evaluation_protocol_version": 3}',
            '{"selection_objectives": [{"version": 1}]}',
        ):
            with self.subTest(text=text):
                errors = []
                check_docs.check_internal_versions(text, "example.md", errors)
                self.assertTrue(errors)
                self.assertTrue(all("example.md:1:" in error for error in errors))

    def test_public_identifiers_dependencies_and_migration_ids_are_allowed(self):
        text = "\n".join((
            "EvolutionaryScale/esm3-sm-open-v1",
            "models/esm3-sm-open-v1",
            "deepseek-v4-pro",
            "DOI: `10.3115/v1/D14-1181`",
            "https://provider.example/v1/schema-v2",
            "Python 3.10, Python 版本3.10, Node.js v24, VitePress version 1.6.4, esm==3.2.0",
            "`20260918_0012` and `2026-01-01T00:00:00Z`",
            "迁移版本20260918_0012",
            "Current artifacts include `loss_contract`; older artifacts remain `legacy_only`.",
        ))
        errors = []
        check_docs.check_internal_versions(text, "example.md", errors)
        self.assertEqual(errors, [])

    def test_rendered_json_is_checked_across_syntax_spans(self):
        page = check_docs.Links()
        page.feed(
            '<script>const schema = {"schema_version": 9};</script>'
            '<pre><span>"schema_version"</span><span>: </span><span>2</span></pre>'
            '<table><tr><td>内容版本</td><td><code>20260918_0012</code></td>'
            '<td><code>20260721_0011</code></td></tr></table>'
        )
        errors = []
        check_docs.check_internal_versions("".join(page.text), "example.html", errors)
        self.assertEqual(len(errors), 1)
        self.assertIn('"schema_version": 2', errors[0])


class CapabilitiesExcerptTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="pep-docs-capabilities-")
        self.addCleanup(self.temporary.cleanup)
        self.site = Path(self.temporary.name)
        self.actual = {
            "route_schema_version": 6,
            "tasks": [{"id": "pep_function", "label": "Peptide function"}],
            "selection_objectives": [
                {"id": "f1", "version": 1, "direction": "max", "tasks": ["binary"]},
                {"id": "macro_f1", "version": 1, "direction": "max", "tasks": ["multilabel"]},
            ],
        }
        excerpt = copy.deepcopy(self.actual)
        excerpt.pop("route_schema_version")
        for objective in excerpt["selection_objectives"]:
            objective.pop("version")
        for prefix in ("", "zh"):
            path = self.site / prefix / "api/system.md"
            path.parent.mkdir(parents=True)
            path.write_text(
                "<!-- BEGIN CAPABILITIES EXCERPT -->\n```json\n"
                + json.dumps(excerpt) + "\n```\n<!-- END CAPABILITIES EXCERPT -->\n"
            )

    def check(self, actual):
        errors = []
        with patch.object(check_docs, "DOCS", self.site), patch.object(
            check_docs, "LOCALES", {"en": "", "zh": "zh/"}
        ):
            check_docs.check_capabilities(actual, errors)
        return errors

    def test_only_omitted_objective_versions_are_projected_without_mutating_input(self):
        actual = copy.deepcopy(self.actual)
        actual["route_schema_version"] = 99
        actual["selection_objectives"][0]["version"] = 99
        original = copy.deepcopy(actual)
        self.assertEqual(self.check(actual), [])
        self.assertEqual(actual, original)

    def test_objective_fields_members_and_order_remain_strict(self):
        changes = []
        for field, value in (("direction", "min"), ("tasks", ["binary", "multilabel"])):
            actual = copy.deepcopy(self.actual)
            actual["selection_objectives"][0][field] = value
            changes.append(actual)
        actual = copy.deepcopy(self.actual)
        actual["selection_objectives"][0].pop("direction")
        changes.append(actual)
        actual = copy.deepcopy(self.actual)
        actual["selection_objectives"][0]["extra"] = True
        changes.append(actual)
        actual = copy.deepcopy(self.actual)
        actual["selection_objectives"].reverse()
        changes.append(actual)
        actual = copy.deepcopy(self.actual)
        actual["selection_objectives"].pop()
        changes.append(actual)
        actual = copy.deepcopy(self.actual)
        actual["selection_objectives"].append(copy.deepcopy(actual["selection_objectives"][0]))
        changes.append(actual)
        for actual in changes:
            with self.subTest(actual=actual):
                errors = self.check(actual)
                self.assertEqual(len(errors), 2)
                self.assertTrue(all("stale capabilities field selection_objectives" in e for e in errors))

    def test_other_capability_fields_are_still_checked(self):
        actual = copy.deepcopy(self.actual)
        actual["tasks"][0]["label"] = "Stale label"
        errors = self.check(actual)
        self.assertEqual(len(errors), 2)
        self.assertTrue(all("stale capabilities field tasks" in error for error in errors))


@unittest.skipUnless((DOCS / "node_modules/.bin/tsx").is_file(), "Run npm ci for renderer checks")
class ReferenceRenderingTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="pep-docs-rendering-")
        self.addCleanup(self.temporary.cleanup)
        self.site = Path(self.temporary.name)
        (self.site / "scripts").mkdir()
        (self.site / ".cli-ref").mkdir()
        (self.site / "package.json").write_text('{"type":"module"}\n')
        self.formatter = self.site / "scripts/gen_cli_ref_fmt.ts"
        shutil.copyfile(DOCS / "scripts/gen_cli_ref_fmt.ts", self.formatter)
        reference = {}
        for name in ("train_pipeline", "train_sequence_pipeline", "train_pair_pipeline"):
            reference[name] = {
                "script": f"scripts/{name}.py",
                "total_args": 1,
                "categories": {"task": [{"name": "--task_type", "type": "str", "default": "None"}]},
            }
        reference.update(tools=[], supporting_scripts=[])
        (self.site / ".cli-ref/cli_ref.json").write_text(json.dumps(reference))
        self.pages = []
        for prefix in ("cli", "zh/cli"):
            for name in (
                "train-pipeline",
                "train-sequence-pipeline",
                "train-pair-pipeline",
                "tools",
            ):
                path = self.site / prefix / f"{name}.md"
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(
                    "# Handwritten introduction\n\nKeep this example verbatim.\n\n"
                    "<!-- BEGIN GENERATED CLI -->\nOld table\n<!-- END GENERATED CLI -->"
                    "\n\n## Handwritten notes\nKeep this conclusion verbatim.\n"
                )
                self.pages.append(path)

    def render(self):
        environment = dict(os.environ)
        environment.pop("PEPPLATFORM_SOURCE_ROOT", None)
        return subprocess.run(
            [str(DOCS / "node_modules/.bin/tsx"), str(self.formatter)],
            cwd=self.site,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_generation_preserves_authored_content_and_is_idempotent(self):
        originals = {p: p.read_text() for p in self.pages}
        first = self.render()
        self.assertEqual(first.returncode, 0, first.stderr)
        generated = {p: p.read_bytes() for p in self.pages}
        for path in self.pages:
            with self.subTest(page=path.relative_to(self.site)):
                before, after = originals[path], path.read_text()
                self.assertEqual(
                    before.split("<!-- BEGIN GENERATED CLI -->")[0],
                    after.split("<!-- BEGIN GENERATED CLI -->")[0],
                )
                self.assertEqual(
                    before.split("<!-- END GENERATED CLI -->")[1],
                    after.split("<!-- END GENERATED CLI -->")[1],
                )
                self.assertNotIn("Old table", after)
        second = self.render()
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(generated, {p: p.read_bytes() for p in self.pages})

    def test_invalid_markers_reject_overwriting_the_affected_page(self):
        path = self.pages[0]
        path.write_text(path.read_text() + "\n<!-- BEGIN GENERATED CLI -->\n")
        original = path.read_bytes()
        result = self.render()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Invalid generated CLI markers", result.stderr)
        self.assertEqual(path.read_bytes(), original)

    def test_profile_descriptions_omit_internal_versions_and_preserve_model_ids(self):
        path = self.site / ".cli-ref/cli_ref.json"
        reference = json.loads(path.read_text())
        tools = (
            ("build_ppi_profile_cache", "--max_length", "512"),
            ("build_sequence_profile_cache", "--max-length", "128"),
            ("build_psfm_cache", "--max_length", "60"),
            ("build_pssm_cache", "--max_length", "60"),
        )
        reference["tools"] = [
            {
                "script": f"tools/{name}.py", "name": name, "total_args": 1,
                "params": [{"name": flag, "type": "int", "default": default, "help": "v3 profile matrices"}],
            }
            for name, flag, default in tools
        ]
        reference["train_sequence_pipeline"]["categories"]["pretrained"] = [{
            "name": "--esm3_model", "type": "str", "default": "'EvolutionaryScale/esm3-sm-open-v1'",
        }]
        path.write_text(json.dumps(reference))
        first = self.render()
        self.assertEqual(first.returncode, 0, first.stderr)
        for prefix in ("cli", "zh/cli"):
            text = (self.site / prefix / "tools.md").read_text()
            self.assertNotIn("v3", text)
            for _name, flag, default in tools:
                self.assertIn(f"| `{flag}` | int | `{default}` |", text)
            self.assertIn("esm3-sm-open-v1", (self.site / prefix / "train-sequence-pipeline.md").read_text())
        self.assertIn("profile matrices are stored at full length", (self.site / "cli/tools.md").read_text())
        self.assertIn("矩阵按完整长度保存", (self.site / "zh/cli/tools.md").read_text())
        generated = {p: p.read_bytes() for p in self.pages}
        second = self.render()
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(generated, {p: p.read_bytes() for p in self.pages})


if __name__ == "__main__":
    unittest.main()
