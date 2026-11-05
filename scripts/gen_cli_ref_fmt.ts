import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname, isAbsolute } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface Param {
  name: string
  type: string
  default: string
  choices?: string[] | null
  help?: string
  aliases?: string[]
  required?: boolean
  choices_expression?: string
}

interface CategorizedRef {
  script: string
  total_args: number
  categories: Record<string, Param[]>
}

interface ToolRef {
  script: string
  name: string
  total_args: number
  params: Param[]
}

interface CliRef {
  train_pipeline: CategorizedRef
  train_sequence_pipeline: CategorizedRef
  train_pair_pipeline: CategorizedRef
  tools: ToolRef[]
  supporting_scripts: ToolRef[]
}

const CATEGORY_LABELS_ZH: Record<string, string> = {
  task: '任务与数据',
  tokenizer: '分词器',
  encoder: '编码器',
  model: '模型与训练模式',
  training: '训练超参数',
  pretrained: '预训练模型',
  embedding: '静态嵌入',
  profile: 'Profile / PSSM / PSFM',
  feature_transform: '特征变换',
  ml_reduction: 'ML 降维与调优',
  classifier_svm: 'SVM 分类器',
  classifier_logreg: '逻辑回归',
  classifier_rf: '随机森林',
  classifier_et: 'Extra Trees',
  classifier_histgb: 'HistGB',
  classifier_xgb: 'XGBoost',
  classifier_lgb: 'LightGBM',
  pair: 'Pair 互作',
  semantic: '语义辅助损失',
  io: '输入输出与控制',
  other: '其他',
  selection: '模型选择目标',
  towers: 'Pair 两侧独立配置',
}

const CATEGORY_LABELS_EN: Record<string, string> = {
  task: 'Task & Data',
  tokenizer: 'Tokenizer',
  encoder: 'Encoder',
  model: 'Model & Training Mode',
  training: 'Training Hyperparameters',
  pretrained: 'Pretrained Models',
  embedding: 'Static Embeddings',
  profile: 'Profile / PSSM / PSFM',
  feature_transform: 'Feature Transformation',
  ml_reduction: 'ML Reduction & Tuning',
  classifier_svm: 'SVM Classifier',
  classifier_logreg: 'Logistic Regression',
  classifier_rf: 'Random Forest',
  classifier_et: 'Extra Trees',
  classifier_histgb: 'HistGB',
  classifier_xgb: 'XGBoost',
  classifier_lgb: 'LightGBM',
  pair: 'Pair Interaction',
  semantic: 'Semantic Auxiliary Loss',
  io: 'I/O & Control',
  other: 'Other',
  selection: 'Model Selection Objectives',
  towers: 'Role-specific Pair Stream Configuration',
}

const TASK_TYPE_META: Record<string, { choices: string; helpZh: string; helpEn: string }> = {
  'train_pipeline.py----task_type': {
    choices: '`pep_function`, `pep_protein_interaction`, `pep_hlaii`, `pep_hlai`',
    helpZh: '调度入口。根据任务类型转发到 `train_sequence_pipeline.py` 或 `train_pair_pipeline.py`',
    helpEn:
      'Dispatcher entrypoint. Forwards to `train_sequence_pipeline.py` or `train_pair_pipeline.py` based on task type',
  },
  'train_sequence_pipeline.py----task_type': {
    choices: '`pep_function`',
    helpZh: '单序列任务专用脚本；pair 任务请使用 `train_pair_pipeline.py`',
    helpEn: 'Single-sequence task script; use `train_pair_pipeline.py` for pair tasks',
  },
  'train_pair_pipeline.py----task_type': {
    choices: '`pep_protein_interaction`, `pep_hlaii`, `pep_hlai`',
    helpZh: 'Pair 专用脚本。选 `pep_function` 时向导会提示改用 `train_sequence_pipeline.py`',
    helpEn:
      'Pair-only script. Selecting `pep_function` prompts the user to use `train_sequence_pipeline.py` instead',
  },
}

const PARAM_HELP_META: Record<string, { helpZh: string; helpEn: string }> = {
  'train_pair_pipeline.py----task_root': {
    helpZh:
      '默认值随 `task_type` 动态变化：`pep_hlai` → `datasets/task_peptide_HLAI_interaction`，`pep_hlaii` → `datasets/task_peptide_HLAII_interaction`，其他 → `datasets/task_peptide_protein_interaction`',
    helpEn:
      'Default changes with `task_type`: `pep_hlai` → `datasets/task_peptide_HLAI_interaction`, `pep_hlaii` → `datasets/task_peptide_HLAII_interaction`, others → `datasets/task_peptide_protein_interaction`',
  },
  'build_ppi_profile_cache.py----max_length': {
    helpZh: 'Top-n-gram 安全长度上限；矩阵按完整长度保存',
    helpEn: 'Top-n-gram safety limit; matrices are stored at full length',
  },
  'build_sequence_profile_cache.py----max-length': {
    helpZh: 'Top-n-gram 安全长度上限；矩阵按完整长度保存',
    helpEn: 'Top-n-gram safety limit; matrices are stored at full length',
  },
  'build_psfm_cache.py----max_length': {
    helpZh: '已弃用的兼容选项；profile 矩阵按完整长度保存',
    helpEn: 'Deprecated compatibility option; profile matrices are stored at full length',
  },
  'build_pssm_cache.py----max_length': {
    helpZh: '已弃用的兼容选项；profile 矩阵按完整长度保存',
    helpEn: 'Deprecated compatibility option; profile matrices are stored at full length',
  },
}

function paramTable(params: Param[], lang: 'zh' | 'en', scriptName?: string): string {
  const headers =
    lang === 'zh'
      ? ['参数', '类型', '默认值', '可选值', '说明']
      : ['Argument', 'Type', 'Default', 'Choices', 'Description']

  const rows = params.map((p) => {
    const name = [p.name, ...(p.aliases || [])].map((name) => `\`${name}\``).join(', ')
    const type = p.type || '—'
    const def =
      p.default === "'==SUPPRESS=='"
        ? lang === 'zh'
          ? '未设置（不创建属性）'
          : 'Unset (attribute omitted)'
        : p.default
          ? `\`${p.default}\``
          : '—'

    let choices = p.choices
      ? p.choices.map((c) => `\`${c}\``).join(', ')
      : p.choices_expression
        ? `\`${p.choices_expression}\``
        : '—'
    let help = p.help || '—'
    if (p.required) help = `${lang === 'zh' ? '必需。' : 'Required. '}${p.help || ''}`

    if (scriptName) {
      const taskKey = `${scriptName}--${p.name}`
      const tt = TASK_TYPE_META[taskKey]
      if (tt) {
        choices = tt.choices
        help = lang === 'zh' ? tt.helpZh : tt.helpEn
      }
      const tr = PARAM_HELP_META[taskKey]
      if (tr) {
        help = lang === 'zh' ? tr.helpZh : tr.helpEn
      }
    }

    help = help.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const cell = (value: string) => value.replace(/\|/g, '&#124;').replace(/\r?\n/g, ' ')
    return `| ${[name, type, def, choices, help].map(cell).join(' | ')} |`
  })

  return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.join('\n')}\n`
}

function repoRelativeScriptPath(scriptPath: string): string {
  const normalized = scriptPath.replace(/\\/g, '/')
  if (isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error('CLI references must use repository-relative script paths')
  }
  return normalized
}

function generateTrainPipelineMd(ref: CategorizedRef, lang: 'zh' | 'en'): string {
  const labels = lang === 'zh' ? CATEGORY_LABELS_ZH : CATEGORY_LABELS_EN
  const title = lang === 'zh' ? 'train_pipeline.py 参数参考' : 'train_pipeline.py Arguments'
  const intro =
    lang === 'zh'
      ? '统一调度入口，按 `--task_type` 转发到专用训练脚本：单序列任务走 `train_sequence_pipeline.py`，pair 互作任务走 `train_pair_pipeline.py`。新命令推荐直接使用专用脚本；本入口主要用于兼容旧命令。\n\n本页参数由 `gen_cli_ref.py` 从源码自动提取。'
      : 'Dispatcher entry point. It forwards by `--task_type`: single-sequence tasks go to `train_sequence_pipeline.py`, and pair-interaction tasks go to `train_pair_pipeline.py`. New commands should prefer the task-specific scripts; this entrypoint primarily keeps older commands working.\n\nArguments on this page are auto-extracted from source code.'

  let md = `# ${title}\n\n${intro}\n\n`
  md += `> ${lang === 'zh' ? '共' : 'Total'} \`${ref.total_args}\` ${lang === 'zh' ? '个参数' : 'arguments'}\n\n`

  md +=
    lang === 'zh'
      ? `## 基本用法\n\n\`\`\`bash\n# 兼容旧的单序列命令；实际转发到 train_sequence_pipeline.py\npython scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50\n\n# 兼容旧的 pair 命令；实际转发到 train_pair_pipeline.py\npython scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp\n\n# 查看调度入口帮助\npython scripts/train_pipeline.py --help\n\`\`\`\n\n`
      : `## Basic Usage\n\n\`\`\`bash\n# Compatibility path for older single-sequence commands; forwards to train_sequence_pipeline.py\npython scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50\n\n# Compatibility path for older pair commands; forwards to train_pair_pipeline.py\npython scripts/train_pipeline.py --data_dir /path/to/task-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp\n\n# Show dispatcher help\npython scripts/train_pipeline.py --help\n\`\`\`\n\n`

  for (const [cat, params] of Object.entries(ref.categories)) {
    const label = labels[cat] || cat
    md += `## ${label}\n\n`
    md += paramTable(params, lang, 'train_pipeline.py')
    md += '\n'
  }

  return md
}

function generateSequencePipelineMd(ref: CategorizedRef, lang: 'zh' | 'en'): string {
  const labels = lang === 'zh' ? CATEGORY_LABELS_ZH : CATEGORY_LABELS_EN
  const title =
    lang === 'zh' ? 'train_sequence_pipeline.py 参数参考' : 'train_sequence_pipeline.py Arguments'
  const intro =
    lang === 'zh'
      ? '单序列训练脚本，用于不涉及互作对象的肽段功能预测任务（`pep_function`）。Pair 任务请使用 `train_pair_pipeline.py`。\n\n本页参数由 `gen_cli_ref.py` 从源码自动提取，确保与代码一致。'
      : 'Single-sequence training script for peptide function prediction (`pep_function`) where no interaction partner is modeled. Use `train_pair_pipeline.py` for pair tasks.\n\nArguments on this page are auto-extracted from source code by `gen_cli_ref.py` to stay in sync.'

  let md = `# ${title}\n\n${intro}\n\n`
  md += `> ${lang === 'zh' ? '共' : 'Total'} \`${ref.total_args}\` ${lang === 'zh' ? '个参数' : 'arguments'}\n\n`

  md +=
    lang === 'zh'
      ? `## 基本用法\n\n\`\`\`bash\n# 交互式向导\npython scripts/train_sequence_pipeline.py\n\n# 肽段功能预测（单序列任务）\npython scripts/train_sequence_pipeline.py --data_dir /path/to/function-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50\n\n# 查看完整帮助\npython scripts/train_sequence_pipeline.py --help\n\`\`\`\n\n`
      : `## Basic Usage\n\n\`\`\`bash\n# Interactive wizard\npython scripts/train_sequence_pipeline.py\n\n# Peptide function prediction (single-sequence task)\npython scripts/train_sequence_pipeline.py --data_dir /path/to/function-data --task_type pep_function --tokenizer kmer --encoder onehot --model cnn --epochs 50\n\n# Show full help\npython scripts/train_sequence_pipeline.py --help\n\`\`\`\n\n`

  for (const [cat, params] of Object.entries(ref.categories)) {
    const label = labels[cat] || cat
    md += `## ${label}\n\n`
    md += paramTable(params, lang, 'train_sequence_pipeline.py')
    md += '\n'
  }

  return md
}

function generatePairPipelineMd(ref: CategorizedRef, lang: 'zh' | 'en'): string {
  const labels = lang === 'zh' ? CATEGORY_LABELS_ZH : CATEGORY_LABELS_EN
  const title =
    lang === 'zh' ? 'train_pair_pipeline.py 参数参考' : 'train_pair_pipeline.py Arguments'
  const intro =
    lang === 'zh'
      ? 'Pair 任务专用训练脚本，用于肽-蛋白互作（`pep_protein_interaction`）、肽-HLA-II 互作（`pep_hlaii`）、肽-HLA-I 互作（`pep_hlai`）。单序列 `pep_function` 请使用 `train_sequence_pipeline.py`；`train_pipeline.py` 只是兼容调度入口。\n\n本页参数由 `gen_cli_ref.py` 从源码自动提取。'
      : 'Pair-task training script for peptide-protein interaction (`pep_protein_interaction`), peptide-HLA-II (`pep_hlaii`), and peptide-HLA-I (`pep_hlai`). Use `train_sequence_pipeline.py` for single-sequence `pep_function`; `train_pipeline.py` is only the compatibility dispatcher.\n\nArguments are auto-extracted from source code by `gen_cli_ref.py`.'

  let md = `# ${title}\n\n${intro}\n\n`
  md += `> ${lang === 'zh' ? '共' : 'Total'} \`${ref.total_args}\` ${lang === 'zh' ? '个参数' : 'arguments'}\n\n`

  md +=
    lang === 'zh'
      ? `## 基本用法\n\n\`\`\`bash\n# 交互式向导\npython scripts/train_pair_pipeline.py\n\n# 肽-蛋白互作：ESM2 预训练 + two_stream\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp\n\n# 肽-HLA-II 互作：kmer + PSSM + two_stream + cross_attn\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlaii --tokenizer kmer --encoder pssm --pair_strategy two_stream --interaction_level token --interaction_model cross_attn --training_mode end_to_end --epochs 10\n\n# 肽-HLA-I 互作：ESM2 + two_stream + bi_cross_attn\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlai --tokenizer esm2 --pair_strategy two_stream --interaction_level token --interaction_model bi_cross_attn --training_mode end_to_end --epochs 20\n\n# 查看完整帮助\npython scripts/train_pair_pipeline.py --help\n\`\`\`\n\n`
      : `## Basic Usage\n\n\`\`\`bash\n# Interactive wizard\npython scripts/train_pair_pipeline.py\n\n# Peptide-protein interaction: ESM2 pretrained + two_stream\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_protein_interaction --tokenizer esm2 --pair_strategy two_stream --interaction_level vector --predictor_type classifier --classifier mlp\n\n# Peptide-HLA-II interaction: kmer + PSSM + two_stream + cross_attn\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlaii --tokenizer kmer --encoder pssm --pair_strategy two_stream --interaction_level token --interaction_model cross_attn --training_mode end_to_end --epochs 10\n\n# Peptide-HLA-I interaction: ESM2 + two_stream + bi_cross_attn\npython scripts/train_pair_pipeline.py --data_dir /path/to/pair-data --task_type pep_hlai --tokenizer esm2 --pair_strategy two_stream --interaction_level token --interaction_model bi_cross_attn --training_mode end_to_end --epochs 20\n\n# Show full help\npython scripts/train_pair_pipeline.py --help\n\`\`\`\n\n`

  for (const [cat, params] of Object.entries(ref.categories)) {
    const label = labels[cat] || cat
    md += `## ${label}\n\n`
    md += paramTable(params, lang, 'train_pair_pipeline.py')
    md += '\n'
  }

  return md
}

function generateToolsMd(tools: ToolRef[], supporting: ToolRef[], lang: 'zh' | 'en'): string {
  const title = lang === 'zh' ? '工具脚本' : 'Tool Scripts'
  const intro =
    lang === 'zh'
      ? '以下脚本用于构建离线特征缓存、训练分词器和嵌入等预处理工作。参数由 `gen_cli_ref.py` 自动提取。'
      : 'Scripts for building offline feature caches, training tokenizers and embeddings, etc. Arguments auto-extracted by `gen_cli_ref.py`.'

  let md = `# ${title}\n\n${intro}\n\n`

  md += lang === 'zh' ? '## 离线缓存工具\n\n' : '## Offline Cache Tools\n\n'
  for (const tool of tools) {
    md += `### ${tool.name}\n\n`
    md += `> \`${repoRelativeScriptPath(tool.script)}\`\n\n`
    md += paramTable(tool.params, lang, `${tool.name}.py`)
    md += '\n'
  }

  md += lang === 'zh' ? '## 辅助脚本\n\n' : '## Supporting Scripts\n\n'
  for (const script of supporting) {
    md += `### ${script.name}\n\n`
    md += `> \`${repoRelativeScriptPath(script.script)}\`\n\n`
    md += paramTable(script.params, lang, `${script.name}.py`)
    md += '\n'
  }

  return md
}

function main() {
  const jsonPath = join(__dirname, '..', '.cli-ref', 'cli_ref.json')
  const data: CliRef = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  const site = join(__dirname, '..')
  const standalone = existsSync(join(site, 'zh'))
  const zhDir = join(site, ...(standalone ? ['zh', 'cli'] : ['cli']))
  const enDir = join(site, ...(standalone ? ['cli'] : ['en', 'cli']))
  mkdirSync(enDir, { recursive: true })

  writeReference(
    join(zhDir, 'train-pipeline.md'),
    generateTrainPipelineMd(data.train_pipeline, 'zh'),
  )
  writeReference(
    join(enDir, 'train-pipeline.md'),
    generateTrainPipelineMd(data.train_pipeline, 'en'),
  )

  writeReference(
    join(zhDir, 'train-sequence-pipeline.md'),
    generateSequencePipelineMd(data.train_sequence_pipeline, 'zh'),
  )
  writeReference(
    join(enDir, 'train-sequence-pipeline.md'),
    generateSequencePipelineMd(data.train_sequence_pipeline, 'en'),
  )

  writeReference(
    join(zhDir, 'train-pair-pipeline.md'),
    generatePairPipelineMd(data.train_pair_pipeline, 'zh'),
  )
  writeReference(
    join(enDir, 'train-pair-pipeline.md'),
    generatePairPipelineMd(data.train_pair_pipeline, 'en'),
  )

  writeReference(
    join(zhDir, 'tools.md'),
    generateToolsMd(data.tools, data.supporting_scripts, 'zh'),
  )
  writeReference(
    join(enDir, 'tools.md'),
    generateToolsMd(data.tools, data.supporting_scripts, 'en'),
  )

  console.log('Generated CLI reference markdown files:')
  console.log(`  zh: ${join(zhDir, 'train-pipeline.md')}`)
  console.log(`  zh: ${join(zhDir, 'train-sequence-pipeline.md')}`)
  console.log(`  zh: ${join(zhDir, 'train-pair-pipeline.md')}`)
  console.log(`  zh: ${join(zhDir, 'tools.md')}`)
  console.log(`  en: ${join(enDir, 'train-pipeline.md')}`)
  console.log(`  en: ${join(enDir, 'train-sequence-pipeline.md')}`)
  console.log(`  en: ${join(enDir, 'train-pair-pipeline.md')}`)
  console.log(`  en: ${join(enDir, 'tools.md')}`)
}

const BEGIN = '<!-- BEGIN GENERATED CLI -->'
const END = '<!-- END GENERATED CLI -->'

function writeReference(path: string, generated: string) {
  // Only the parameter tables belong to the generator. Introductions, usage
  // examples and notes outside the markers remain owned by their authors.
  const firstTableSection = /^## (任务与数据|Task & Data|离线缓存工具|Offline Cache Tools)$/m
  const start = generated.search(firstTableSection)
  if (start < 0) throw new Error(`Missing generated table section: ${path}`)
  const count = generated.match(/^> (?:共|Total).*$/m)?.[0]
  const block = `${BEGIN}\n\n${count ? count + '\n\n' : ''}${generated.slice(start).trimEnd()}\n\n${END}`
  let existing = existsSync(path) ? readFileSync(path, 'utf-8') : generated
  if (existing.includes(BEGIN) || existing.includes(END)) {
    if (
      existing.split(BEGIN).length !== 2 ||
      existing.split(END).length !== 2 ||
      existing.indexOf(BEGIN) > existing.indexOf(END)
    ) {
      throw new Error(`Invalid generated CLI markers: ${path}`)
    }
    existing =
      existing.slice(0, existing.indexOf(BEGIN)) +
      block +
      existing.slice(existing.indexOf(END) + END.length)
  } else {
    const oldStart = existing.search(firstTableSection)
    if (oldStart < 0) throw new Error(`Cannot migrate CLI page: ${path}`)
    const lastTable = [...existing.matchAll(/^\|.*\|\s*$/gm)].at(-1)
    const suffix = lastTable ? existing.slice(lastTable.index! + lastTable[0].length) : '\n'
    const prefix = existing.slice(0, oldStart).replace(/^> (?:共|Total).*\n\n/gm, '')
    existing = prefix + block + suffix
  }
  writeFileSync(path, existing)
}

main()
