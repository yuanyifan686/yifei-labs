# 黄金集（Golden Set）

固定脱敏样例 + 期望方向，用于回归匹配稳定性。

## 用法

```bash
npm run golden
```

脚本会：

1. 对每份简历做规则画像 + 岗位库 TopK（无需 API Key）
2. 检查 Top1 标题是否命中 `expectTopTitleIncludes` 任一关键词
3. 输出 `data/golden-set/last-run.json`

## 维护

- 新增样例：编辑 `samples.json`
- 人工评分字段 `notes` 仅供评审，不参与自动判定
