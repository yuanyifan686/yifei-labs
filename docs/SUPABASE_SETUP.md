# Supabase 部署检查（A1）

## 1. 执行 migration

在 Supabase SQL Editor 运行：

`supabase/migrations/20260710_analysis_sessions_and_jobs.sql`

将创建：

- `analysis_sessions`（会话归档，按 `client_token` 隔离）
- `stored_jobs`（生产岗位库）

## 2. 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# 可选：强制岗位库用文件（本地调试）
# JOB_BANK_STORAGE=file
```

## 3. 验收

1. 启动应用，完成一次「岗位匹配」
2. 打开历史：应出现本浏览器会话
3. 无痕窗口：不应看到上一浏览器会话
4. 重启服务后：有 Supabase 时 session 仍可按 id/token 读取

未配置时：功能不挂，warning 提示「仅内存临时会话」。

## 4. 服务端探测

前端可调用 `getPersistenceStatusAction()`，返回：

- `sessionPersistence`
- `supabaseConfigured`
- `jobBankStorage`
- `migrationHint`
