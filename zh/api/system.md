# 系统

系统模块提供平台健康检查、能力清单（capabilities）与模型排行榜查询。健康检查和能力清单无需认证即可访问。

::: tip 交互式 API 文档
后端交互式接口文档位于 `http://127.0.0.1:8081/docs`（Swagger UI）和 `http://127.0.0.1:8081/redoc`（ReDoc）。部署时使用实际后端地址；Docker 前端默认只代理 `/api/`。
:::

## GET /api/health

- **方法**: `GET`
- **路径**: `/api/health`
- **认证**: 无需认证
- **用途**: 健康检查，报告 profile-inference 依赖的就绪状态。

```bash
curl http://127.0.0.1:8081/api/health
```

响应 `200`（节选）：

```json
{
  "ok": true,
  "dependencies": {
    "profile_inference": {
      "ready": false,
      "status": "blocked"
    }
  }
}
```

`profile_inference.ready` 反映该环境中的 BLAST 可执行文件与 profile 冒烟检查结果，不验证每个模型的参考数据、权重或完整推理能力。HTTP 200 和 `ok: true` 不表示所有依赖已就绪；查看 `checks` 和 `errors`。

## GET /api/capabilities

公开接口，返回当前能力分类与约束。下方响应由 `build_capabilities()` 截取，属于节选，不是完整响应，也不表示所有选项可以任意组合；具体实验仍需 Preflight。

```bash
curl http://127.0.0.1:8081/api/capabilities
```

<!-- BEGIN CAPABILITIES EXCERPT -->
```json
{
  "tasks": [
    {
      "id": "pep_function",
      "label": "Therapeutic peptide function prediction"
    },
    {
      "id": "pep_protein_interaction",
      "label": "Peptide–protein interaction prediction"
    },
    {
      "id": "pep_hlaii",
      "label": "Peptide–HLA-II ligand presentation prediction"
    },
    {
      "id": "pep_hlai",
      "label": "Peptide–HLA-I ligand presentation prediction"
    }
  ],
  "feature_routes": [
    "pretrained",
    "classic"
  ],
  "pretrained_tokenizers": [
    "esm2",
    "protbert",
    "prott5",
    "esmc",
    "esm3"
  ],
  "classic_tokenizers": [
    "kmer",
    "dr",
    "top-n-gram",
    "dt",
    "bpe",
    "wordpiece",
    "unigram"
  ],
  "pair_strategies": [
    "single_stream",
    "two_stream"
  ],
  "pair_strategy_aliases": {
    "single_stream": "single_stream",
    "single-stream": "single_stream",
    "two_stream": "two_stream",
    "two-stream": "two_stream",
    "single_tower": "single_stream",
    "single-tower": "single_stream",
    "dual_tower": "two_stream",
    "dual-tower": "two_stream"
  },
  "modeling_architectures": {
    "sequence": [
      "cnn",
      "rnn",
      "gru",
      "lstm",
      "transformer"
    ],
    "chain_graph": [
      "gcn",
      "gat"
    ]
  },
  "classifiers": [
    "mlp",
    "svm",
    "rf",
    "extratrees",
    "histgb",
    "xgb",
    "lgb",
    "logreg"
  ],
  "training_modes": [
    "end_to_end",
    "export_embeddings"
  ],
  "selection_objectives": [
    {
      "id": "f1",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "binary"
      ],
      "metric": "f1",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "macro_f1",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "f1",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "sacc",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "multilabel"
      ],
      "metric": "sacc",
      "requires_both_classes": false,
      "parameters": []
    },
    {
      "id": "auc",
      "direction": "max",
      "requires_predictions": false,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "auc",
      "requires_both_classes": true,
      "parameters": []
    },
    {
      "id": "aupr",
      "direction": "max",
      "requires_predictions": false,
      "tasks": [
        "binary",
        "multilabel"
      ],
      "metric": "aupr",
      "requires_both_classes": true,
      "parameters": []
    },
    {
      "id": "dual_f1_sacc",
      "direction": "max",
      "requires_predictions": true,
      "tasks": [
        "multilabel"
      ],
      "metric": "dual_score",
      "requires_both_classes": false,
      "parameters": [
        "reference_f1",
        "reference_sacc"
      ]
    }
  ],
  "semantic_relation_types": [
    "intrinsic_label_jaccard",
    "interaction_profile_jaccard"
  ],
  "task_semantic_relation_type": {
    "pep_function": "intrinsic_label_jaccard",
    "pep_protein_interaction": "interaction_profile_jaccard",
    "pep_hlaii": "interaction_profile_jaccard",
    "pep_hlai": "interaction_profile_jaccard"
  }
}
```
<!-- END CAPABILITIES EXCERPT -->

完整响应还包含 `route_families`、`encoder_specs`、`output_kinds`、`predictor_parts`、`defaults`、`classic_encoder_options`、`pretrained_models`、`tokenizer_constraints`、`classical_tuning`、`sequence_profile_contract`、`frequency_encoder_contract`、`covariance_encoder_contract`、`pdt_encoder_contract`、`pssm_covariance_encoder_contract`、`feature_transformations`、`pair_feature_transformations`、`lsa_contract`、`lda_contract`、`plsa_contract`、`svm_calibration`、`route_constraints`，以及交互与语义默认值。`sequence_models` 是兼容字段，新客户端应读取 `modeling_architectures` 和路线约束。旧任务专用语义模式字段不再返回。参见[模型选择目标](../concepts/selection-objectives)与[特征路线](../concepts/routes)。

## GET /api/leaderboard

- **方法**: `GET`
- **路径**: `/api/leaderboard`
- **认证**: 需要登录
- **用途**: 查询模型排行榜，支持按任务类型、数据集、指标、划分筛选。管理员可查看全局视图。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `task_type` | string | 空 | 按任务类型筛选 |
| `dataset_id` | string | 空 | 按数据集筛选 |
| `metric` | string | `f1` | 排序指标 |
| `split` | string | `auto` | 评估划分 |
| `supports_inference` | bool | 空 | 按是否支持推理筛选 |
| `status` | string | `succeeded` | 按实验状态筛选 |
| `limit` | int | 200 | 返回行数上限 |
| `global_view` | bool | false | 管理员查看全局（跨用户） |

```bash
curl "http://127.0.0.1:8081/api/leaderboard?task_type=pep_protein_interaction&metric=f1&limit=50" \
  -b cookies.txt
```

响应示例节选（`200`，值仅作示意）：

```json
{
  "rows": [
    {
      "model_id": "model-1",
      "model_name": "ESM2 + MLP model",
      "experiment_id": "exp-1",
      "task_type": "pep_protein_interaction",
      "dataset_id": "builtin-ppi-quick",
      "metric": "f1",
      "split": "test",
      "score": 0.82,
      "supports_inference": true,
      "status": "succeeded"
    }
  ],
  "total": 1,
  "metric": "f1",
  "split": "auto",
  "filters": {
    "task_type": "pep_protein_interaction",
    "dataset_id": "",
    "supports_inference": null,
    "status": "succeeded",
    "limit": 50,
    "global_view": false
  }
}
```

指标值非法返回 `400`。
