# 版本 API

版本记录与实验访问权限绑定。读取内容版本时，至少需要能访问一个引用该版本的实验；不可见版本返回 404。响应过滤本机路径、命令和内部错误，不提供原始服务器文件下载。

## GET /api/experiments/{experiment_id}/versions

返回该实验的运行版本记录、内容版本与关系。`download=true` 将同一过滤后的 JSON 作为 `versions.json` 附件返回。源实验不可访问时返回相应权限或不存在错误；指向不可见实验的重跑/表征复用关系也会过滤。

状态可能包含 `not_recorded`、记录进行中、`sealed` 或封存失败等，应读取实际 `status`，不能把旧实验缺少记录解释为校验成功。

## GET /api/versions/{version_id}

返回可见内容版本的身份与元数据。版本 ID 由内容身份决定；它不是可以直接拼接成本机路径的文件名。

## GET /api/versions/{version_id}/runs

返回引用同一版本且当前账户可见的实验：

```json
{
  "items": [
    {"id": "exp-1", "name": "Example run", "status": "succeeded"}
  ]
}
```

参见[版本与下游续训](../web-ui/versions-and-resume)。
