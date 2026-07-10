# Yifei Labs - AI 岗位匹配与能力差距分析

Yifei Labs AI 求职工具 MVP。两条主路径：

1. **简历 → 匹配岗位库**：粘贴/上传简历，大模型分析后与本地市场需求岗位库匹配，输出排行榜。
2. **目标岗位 → 市场匹配度**：输入目标岗位（可选粘贴 JD），结合岗位库市场样本，分析准备度、市场匹配度与缺失技能。

## 功能

- 简历输入：粘贴文本，或上传 **PDF / DOCX / TXT / MD / CSV**
- 路径一：简历一键匹配本地市场需求岗位库
- 路径二：目标岗位市场匹配度 + 能力差距分析
- 基于差距诊断生成 **30 天学习计划 + 项目选题**
- 报告导出：**Markdown** 与 **PDF**（打印）
- Chrome 扩展：从 Boss / 智联详情页导入 JD（`extensions/jd-importer`）
- 展示岗位匹配度、原因、优势、缺口、关键词
- 展示准备度、市场匹配度、缺失技能、学习优先级、面试建议
- 可选生成面向目标岗的简历优化
- 未配置 API Key 时提供本地关键词 fallback
- 配置 Supabase 后保存岗位匹配历史
- 岗位库文件：`data/job-database.json`
  - `npm run seed:jobs` — MiniMax 生成
  - `npm run seed:jobs:grok` — Grok 批次
  - `npm run seed:jobs:hot` — 热门市场方向批次

## 暂时不做

- Boss / 智联自动爬虫
- 登录
- 支付
- PDF 导出
- DOCX 导出
- 复杂模板

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI API（兼容 MiniMax）
- 本地 JSON 岗位库（`data/job-database.json`）
- Supabase + PostgreSQL（可选历史记录）

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

从 `.env.example` 创建 `.env.local`。

```bash
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
AI_MODEL=MiniMax-M3
OPENAI_API_KEY=
OPENAI_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

如果没有 API Key，系统会使用本地关键词匹配 fallback。配置 Key 后会使用大模型进行语义分析。

如果没有 Supabase 变量，应用仍可运行，但历史记录保存和读取会跳过。

## 项目结构

```text
src/
  app/
    page.tsx
    dashboard/page.tsx
    apps/job-match/
      page.tsx
      actions.ts
      history/page.tsx
      history/[id]/page.tsx
  components/
    layout/
    ui/
    home/
    job-match/          # 工作台编排 + 展示组件
  hooks/                # 业务 hooks（简历/匹配/诊断/学习计划等）
  lib/
    openai.ts
    jobDatabase.ts
    actionState.ts      # ActionState + ActionErrorCode
    navigation.ts
    scoreUtils.ts
    prompts/
  types/jobMatch.ts
data/
  job-database.json
extensions/jd-importer/
```

## Supabase SQL（可选）

岗位匹配历史：

```sql
create table job_match_projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  full_name text not null,
  current_status text not null,
  experience_level text not null,
  preferred_language text not null,
  preferred_location text,
  resume_content text not null,
  job_match_result jsonb not null
);
```

简历优化历史：

```sql
create table resume_optimizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  job_match_project_id uuid,
  selected_role jsonb not null,
  optional_job_description text,
  optimization_result jsonb not null
);

alter table resume_optimizations
add constraint resume_optimizations_project_fk
foreign key (job_match_project_id)
references job_match_projects(id)
on delete set null;
```
