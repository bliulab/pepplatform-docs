import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  title: 'PepPlatform',
  description: 'Documentation for PepPlatform, a unified machine learning platform for peptide prediction',
  base: '/pepplatform-docs/',
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: [
    'README.md',
    '.export-audit/**',
    'tests/**',
    'experiment_paper/**',
    'Paper_revision_*/**',
    'Figure[0-9]*',
    'Figure[0-9]*/**',
    'tmp*/**',
    'AGENTS.md',
    '**/AGENTS.md',
    'CURRENT_MANUSCRIPT.md',
    'EXPERIMENT_REPRODUCIBILITY_NOTE.md',
    'OPEN_SOURCE_COPY_CHECKLIST.md',
    '*_AUDIT*.md',
    'PLATFORM_MAIN_INTEGRATION_*.md',
    'concepts/semantic-loss-extension-plan.md',
  ],
  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', href: 'data:,' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: { nav: nav_en(), sidebar: sidebar_en() },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      description: 'PepPlatform 肽段预测机器学习平台文档',
      themeConfig: {
        nav: nav_zh(),
        sidebar: sidebar_zh(),
        outline: { label: '本页目录', level: [2, 3] },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdatedText: '最后更新',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        editLink: {
          pattern: 'https://github.com/bliulab/pepplatform-docs/edit/main/:path',
          text: '在 GitHub 上编辑此页',
        },
        footer: {
          message:
            '采用 <a href="https://github.com/bliulab/pepplatform-docs/blob/main/LICENSE">MIT 许可证</a> 发布。',
          copyright: 'Copyright © 2026 BliuLab',
        },
      },
    },
  },
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/bliulab/pepplatform-docs' },
    ],
    editLink: {
      pattern: 'https://github.com/bliulab/pepplatform-docs/edit/main/:path',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {},
          zh: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
    footer: {
      message:
        'Released under the <a href="https://github.com/bliulab/pepplatform-docs/blob/main/LICENSE">MIT License</a>.',
      copyright: 'Copyright © 2026 BliuLab',
    },
  },
})

function nav_zh() {
  return [
    { text: '快速上手', link: '/zh/quick-start/' },
    { text: '安装', link: '/zh/install/requirements' },
    { text: '概念', link: '/zh/concepts/overview' },
    { text: 'CLI', link: '/zh/cli/overview' },
    { text: 'Web 指南', link: '/zh/web-ui/home' },
    { text: '数据集', link: '/zh/datasets/builtin' },
    { text: 'API', link: '/zh/api/auth' },
    { text: '部署', link: '/zh/deploy/overview' },
    { text: '配置', link: '/zh/config/overview' },
  ]
}

function nav_en() {
  return [
    { text: 'Quick Start', link: '/quick-start/' },
    { text: 'Install', link: '/install/requirements' },
    { text: 'Concepts', link: '/concepts/overview' },
    { text: 'CLI', link: '/cli/overview' },
    { text: 'Web UI', link: '/web-ui/home' },
    { text: 'Datasets', link: '/datasets/builtin' },
    { text: 'API', link: '/api/auth' },
    { text: 'Deploy', link: '/deploy/overview' },
    { text: 'Config', link: '/config/overview' },
  ]
}

function sidebar_zh() {
  return {
    '/zh/install/': [
      {
        text: '安装',
        items: [
          { text: '环境要求', link: '/zh/install/requirements' },
          { text: 'Docker Compose 部署', link: '/zh/install/docker' },
          { text: '本地 Web 开发', link: '/zh/install/local-web' },
          { text: '仅 CLI 训练', link: '/zh/install/cli-only' },
          { text: '数据库配置', link: '/zh/install/database' },
          { text: '可选配置', link: '/zh/install/optional-config' },
          { text: '安装验证', link: '/zh/install/verify' },
        ],
      },
    ],
    '/zh/concepts/': [
      {
        text: '概念与建模原理',
        items: [
          { text: '总览', link: '/zh/concepts/overview' },
          { text: '任务类型', link: '/zh/concepts/tasks' },
          { text: '评估协议', link: '/zh/concepts/evaluation-protocol' },
          { text: '模型选择目标', link: '/zh/concepts/selection-objectives' },
          { text: '特征路线', link: '/zh/concepts/routes' },
          { text: '编码器', link: '/zh/concepts/encoders' },
          { text: '分词器', link: '/zh/concepts/tokenizers' },
          { text: 'DR 实现附录', link: '/zh/concepts/dr-appendix' },
          { text: 'DT 实现附录', link: '/zh/concepts/dt-appendix' },
          { text: '建模架构', link: '/zh/concepts/sequence-models' },
          { text: '分类器', link: '/zh/concepts/classifiers' },
          { text: 'Pair 互作', link: '/zh/concepts/pair-interaction' },
          { text: '训练模式', link: '/zh/concepts/training-modes' },
          { text: '特征变换', link: '/zh/concepts/feature-transforms' },
          { text: '语义辅助损失', link: '/zh/concepts/semantic-loss' },
        ],
      },
    ],
    '/zh/cli/': [
      {
        text: 'CLI 使用',
        items: [
          { text: '概览', link: '/zh/cli/overview' },
          { text: '交互式向导', link: '/zh/cli/wizard' },
          { text: 'train_pipeline.py', link: '/zh/cli/train-pipeline' },
          { text: 'train_sequence_pipeline.py', link: '/zh/cli/train-sequence-pipeline' },
          { text: 'train_pair_pipeline.py', link: '/zh/cli/train-pair-pipeline' },
          { text: '工具脚本', link: '/zh/cli/tools' },
          { text: '常用配方', link: '/zh/cli/recipes' },
        ],
      },
    ],
    '/zh/web-ui/': [
      {
        text: 'Web 端使用指南',
        items: [
          { text: '首页', link: '/zh/web-ui/home' },
          { text: '数据集管理', link: '/zh/web-ui/datasets' },
          { text: '实验列表', link: '/zh/web-ui/experiments' },
          { text: '实验创建向导', link: '/zh/web-ui/experiment-wizard' },
          { text: '实验详情', link: '/zh/web-ui/experiment-detail' },
          { text: '实验对比', link: '/zh/web-ui/experiment-compare' },
          { text: '排行榜', link: '/zh/web-ui/leaderboard' },
          { text: '模型管理与推理', link: '/zh/web-ui/models' },
          { text: '集成模型', link: '/zh/web-ui/ensembles' },
          { text: '版本与下游续训', link: '/zh/web-ui/versions-and-resume' },
          { text: 'AI Agent', link: '/zh/web-ui/agent' },
          { text: 'Agent 计划与迭代', link: '/zh/web-ui/agent-history' },
          { text: '管理后台', link: '/zh/web-ui/admin' },
          { text: '账户与认证', link: '/zh/web-ui/account' },
        ],
      },
    ],
    '/zh/datasets/': [
      {
        text: '数据集',
        items: [
          { text: '内置数据集', link: '/zh/datasets/builtin' },
          { text: '数据格式规范', link: '/zh/datasets/format' },
          { text: '自定义数据集上传', link: '/zh/datasets/upload' },
          { text: '公开数据库（命令行）', link: '/zh/datasets/public-databases-cli' },
        ],
      },
    ],
    '/zh/api/': [
      {
        text: 'API 参考',
        items: [
          { text: '认证', link: '/zh/api/auth' },
          { text: 'AI Provider', link: '/zh/api/ai' },
          { text: 'Agent', link: '/zh/api/agent' },
          { text: '管理员', link: '/zh/api/admin' },
          { text: '数据集', link: '/zh/api/datasets' },
          { text: '实验', link: '/zh/api/experiments' },
          { text: '模型', link: '/zh/api/models' },
          { text: '集成', link: '/zh/api/ensembles' },
          { text: '版本', link: '/zh/api/versions' },
          { text: '可视化', link: '/zh/api/visualizations' },
          { text: '推理', link: '/zh/api/inference' },
          { text: '系统', link: '/zh/api/system' },
          { text: '路由索引', link: '/zh/api/routes' },
        ],
      },
    ],
    '/zh/quick-start/': [
      {
        text: '快速上手',
        items: [
          { text: '5 分钟教程', link: '/zh/quick-start/' },
          { text: '故障排查', link: '/zh/troubleshooting' },
        ],
      },
    ],
    '/zh/deploy/': [
      {
        text: '部署运维',
        items: [
          { text: '架构总览', link: '/zh/deploy/overview' },
          { text: '数据库迁移', link: '/zh/deploy/migrations' },
          { text: '备份与恢复', link: '/zh/deploy/backup-restore' },
          { text: '运维操作', link: '/zh/deploy/operations' },
        ],
      },
    ],
    '/zh/config/': [
      {
        text: '配置参考',
        items: [
          { text: '配置总览', link: '/zh/config/overview' },
          { text: '环境变量参考', link: '/zh/config/environment' },
        ],
      },
    ],
    '/zh/troubleshooting': [
      {
        text: '快速上手',
        items: [
          { text: '5 分钟教程', link: '/zh/quick-start/' },
          { text: '故障排查', link: '/zh/troubleshooting' },
        ],
      },
    ],
  }
}

function sidebar_en() {
  return {
    '/install/': [
      {
        text: 'Installation',
        items: [
          { text: 'Requirements', link: '/install/requirements' },
          { text: 'Docker Compose', link: '/install/docker' },
          { text: 'Local Web Dev', link: '/install/local-web' },
          { text: 'CLI Only', link: '/install/cli-only' },
          { text: 'Database', link: '/install/database' },
          { text: 'Optional Config', link: '/install/optional-config' },
          { text: 'Verify', link: '/install/verify' },
        ],
      },
    ],
    '/concepts/': [
      {
        text: 'Concepts',
        items: [
          { text: 'Overview', link: '/concepts/overview' },
          { text: 'Task Types', link: '/concepts/tasks' },
          { text: 'Evaluation Protocol', link: '/concepts/evaluation-protocol' },
          { text: 'Selection Objectives', link: '/concepts/selection-objectives' },
          { text: 'Feature Routes', link: '/concepts/routes' },
          { text: 'Encoders', link: '/concepts/encoders' },
          { text: 'Tokenizers', link: '/concepts/tokenizers' },
          { text: 'DR Implementation Appendix', link: '/concepts/dr-appendix' },
          { text: 'DT Implementation Appendix', link: '/concepts/dt-appendix' },
          { text: 'Modeling Architectures', link: '/concepts/sequence-models' },
          { text: 'Classifiers', link: '/concepts/classifiers' },
          { text: 'Pair Interaction', link: '/concepts/pair-interaction' },
          { text: 'Training Modes', link: '/concepts/training-modes' },
          { text: 'Feature Transforms', link: '/concepts/feature-transforms' },
          { text: 'Semantic Loss', link: '/concepts/semantic-loss' },
        ],
      },
    ],
    '/cli/': [
      {
        text: 'CLI Usage',
        items: [
          { text: 'Overview', link: '/cli/overview' },
          { text: 'Interactive Wizard', link: '/cli/wizard' },
          { text: 'train_pipeline.py', link: '/cli/train-pipeline' },
          { text: 'train_sequence_pipeline.py', link: '/cli/train-sequence-pipeline' },
          { text: 'train_pair_pipeline.py', link: '/cli/train-pair-pipeline' },
          { text: 'Tools', link: '/cli/tools' },
          { text: 'Recipes', link: '/cli/recipes' },
        ],
      },
    ],
    '/web-ui/': [
      {
        text: 'Web UI Guide',
        items: [
          { text: 'Home', link: '/web-ui/home' },
          { text: 'Datasets', link: '/web-ui/datasets' },
          { text: 'Experiments', link: '/web-ui/experiments' },
          { text: 'Experiment Wizard', link: '/web-ui/experiment-wizard' },
          { text: 'Experiment Detail', link: '/web-ui/experiment-detail' },
          { text: 'Experiment Comparison', link: '/web-ui/experiment-compare' },
          { text: 'Leaderboard', link: '/web-ui/leaderboard' },
          { text: 'Models & Inference', link: '/web-ui/models' },
          { text: 'Model Ensembles', link: '/web-ui/ensembles' },
          { text: 'Versions & Resume', link: '/web-ui/versions-and-resume' },
          { text: 'AI Agent', link: '/web-ui/agent' },
          { text: 'Agent Plans & Campaigns', link: '/web-ui/agent-history' },
          { text: 'Admin Console', link: '/web-ui/admin' },
          { text: 'Account & Auth', link: '/web-ui/account' },
        ],
      },
    ],
    '/datasets/': [
      {
        text: 'Datasets',
        items: [
          { text: 'Built-in Datasets', link: '/datasets/builtin' },
          { text: 'Data Format Spec', link: '/datasets/format' },
          { text: 'Custom Upload', link: '/datasets/upload' },
          { text: 'Public Databases (CLI)', link: '/datasets/public-databases-cli' },
        ],
      },
    ],
    '/api/': [
      {
        text: 'API Reference',
        items: [
          { text: 'Auth', link: '/api/auth' },
          { text: 'AI Provider', link: '/api/ai' },
          { text: 'Agent', link: '/api/agent' },
          { text: 'Admin', link: '/api/admin' },
          { text: 'Datasets', link: '/api/datasets' },
          { text: 'Experiments', link: '/api/experiments' },
          { text: 'Models', link: '/api/models' },
          { text: 'Ensembles', link: '/api/ensembles' },
          { text: 'Versions', link: '/api/versions' },
          { text: 'Visualizations', link: '/api/visualizations' },
          { text: 'Inference', link: '/api/inference' },
          { text: 'System', link: '/api/system' },
          { text: 'Route Index', link: '/api/routes' },
        ],
      },
    ],
    '/quick-start/': [
      {
        text: 'Quick Start',
        items: [
          { text: 'Quick Start', link: '/quick-start/' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
    ],
    '/deploy/': [
      {
        text: 'Deployment',
        items: [
          { text: 'Architecture', link: '/deploy/overview' },
          { text: 'Migrations', link: '/deploy/migrations' },
          { text: 'Backup & Restore', link: '/deploy/backup-restore' },
          { text: 'Operations', link: '/deploy/operations' },
        ],
      },
    ],
    '/config/': [
      {
        text: 'Configuration',
        items: [
          { text: 'Overview', link: '/config/overview' },
          { text: 'Environment Variables', link: '/config/environment' },
        ],
      },
    ],
    '/troubleshooting': [
      {
        text: 'Quick Start',
        items: [
          { text: 'Quick Start', link: '/quick-start/' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
    ],
  }
}
