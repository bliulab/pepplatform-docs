# PepPlatform documentation

English and Chinese documentation for PepPlatform, a unified machine learning platform for peptide prediction, built with VitePress.

- Website: https://bliulab.github.io/pepplatform-docs/
- Chinese documentation: https://bliulab.github.io/pepplatform-docs/zh/

Obtain the [platform source](https://github.com/AlbertTeslaWizard/PepPlatform) and follow the installation guides for
your chosen CLI, Web or development workflow. This repository contains
documentation only; it does not include training data, models or a running
platform service.

## Local development

Use Node.js 24 and npm. Python 3.10 or newer is needed for documentation checks
and optional reference generation; no training dependencies are required.

```bash
npm ci
npm run test:docs
npm run docs:dev
```

VitePress prints the local address, including the `/pepplatform-docs/` base path.

## Check and build

```bash
npm run test:docs
npm run docs:check
npm run docs:build
npm run docs:check:dist
npm run docs:preview
```

These commands work without the platform checkout. The checker validates paired
translations, API topic coverage, JSON examples, public script references, links,
anchors and built resources. The tests compare shared CLI registration with an
independent argparse parser and verify that generation preserves authored content
and is repeatable. They use the Python standard library and the installed Node.js
documentation tools. Documentation pages use text, code and tables.

## Update platform references

Maintain documentation in this repository. English pages live at the root;
Chinese pages mirror them under `zh/`.

To regenerate CLI tables or compare documentation with platform source, explicitly
select the platform checkout intended for the documentation release:

```bash
export PEPPLATFORM_SOURCE_ROOT=/path/to/PepPlatform
npm run gen:cli
python3 scripts/check_docs.py --write-api-index
python3 scripts/check_docs.py
```

Source inspection uses Python ASTs. Generation updates only the marked CLI table
blocks and API route indexes. Generate twice and review the diff: the second run
must not change the files, and text outside the CLI markers must remain intact.
Keep the platform commit and any working-tree changes in local verification
receipts under `.export-audit/`; verify the final public commit again before
publishing. Runtime capability/parser comparison is optional for local editing
and required when preparing a documentation release:

```bash
python3 scripts/check_docs.py --runtime
```

With source comparison enabled, checks also compare published CLI default/type/choice cells (including tool tables), command-example choices and route-specific ESM SDK pins. Runtime mode compares capability excerpts and dataset catalog identifiers. These checks do not establish full training, external-service or deployment readiness.

That optional mode requires the platform's Python dependencies. It does not start
the Web service or train models. Unset `PEPPLATFORM_SOURCE_ROOT` to return to
standalone checks.

When runtime checks report stale capability examples, update the marked JSON
excerpts in both system API pages from `build_capabilities()` and rerun the check.
Omit `route_schema_version` and `selection_objectives[*].version` from those
excerpts; preserve the other objective fields, list members and ordering.
Public prose and examples describe behavior and compatibility conditions without
internal protocol, schema or contract numbers. Dependency versions, official
model identifiers and database migration IDs remain explicit where needed.
Only read the capability and parser builders; do not start the Web service or run
training to refresh documentation. Platform source and frozen experiment assets
must remain unchanged during documentation maintenance.

The CI workflow runs tests and builds without a platform checkout or training
dependencies. Maintainers run source and runtime comparisons explicitly in a
platform environment before release. Local research materials, authentication
state, verification receipts and generated caches are excluded from source
distribution. The documentation's dataset guides remain part of the repository.

## Deployment

In repository **Settings → Pages → Build and deployment**, select **GitHub
Actions** as the source. The [deployment workflow](.github/workflows/deploy.yml)
checks and builds pull requests, and deploys successful pushes to `main` or manual
runs. Only the generated `.vitepress/dist` artifact is deployed.

The site uses the GitHub Pages project path `/pepplatform-docs/`. Keep this base
path consistent with the repository name. No custom domain is configured.

## License

The documentation and its maintenance scripts are available under the
[MIT License](LICENSE). Copyright © 2026 BliuLab.
