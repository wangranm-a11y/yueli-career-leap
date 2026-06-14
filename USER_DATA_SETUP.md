# 跃历用户数据记录配置

跃历现在分两层记录：

1. **匿名功能统计**：默认记录，不保存简历正文、输入素材、照片或 API Key。
2. **完整生成记录**：只有用户主动勾选同意后，才保存本次输入快照和生成结果。

后端使用 Supabase REST API。未配置 Supabase 环境变量时，接口会静默 no-op，不影响用户生成简历。

## 1. 创建 Supabase 表

在 Supabase SQL Editor 执行：

```sql
create table if not exists yueli_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  user_agent text
);

create index if not exists yueli_events_created_at_idx
  on yueli_events (created_at desc);

create index if not exists yueli_events_event_name_idx
  on yueli_events (event_name);

create table if not exists yueli_resume_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  consent_version text not null,
  jd_title text,
  jd_mode text,
  input_snapshot jsonb not null default '{}'::jsonb,
  resume_zh jsonb,
  resume_en jsonb,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text
);

create index if not exists yueli_resume_records_created_at_idx
  on yueli_resume_records (created_at desc);

create index if not exists yueli_resume_records_jd_title_idx
  on yueli_resume_records (jd_title);
```

## 2. 配置 Vercel 环境变量

需要在 Vercel 里添加两个 Production 环境变量：

```bash
npx vercel@latest env add SUPABASE_URL production
npx vercel@latest env add SUPABASE_SERVICE_ROLE_KEY production
```

然后重新部署：

```bash
npx vercel@latest --prod --yes
```

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只能放在 Vercel 服务端环境变量里。
- 不要把它写进前端代码、README、GitHub 或截图里。
- 如果 key 泄露，要立刻去 Supabase 轮换。

## 3. 能看到什么数据

### 匿名统计表：`yueli_events`

会记录：

- 页面打开：`page_open`
- 开始生成：`generate_start`
- 生成成功：`generate_success`
- 生成失败：`generate_failed`
- 导出 PDF：`export_pdf`
- AI 局部改写成功：`rewrite_success`
- 继续优化成功：`followup_success`

默认不会记录：

- 姓名
- 手机号
- 邮箱
- 完整 JD
- 经历正文
- 生成后的简历正文
- 照片
- API Key

### 完整记录表：`yueli_resume_records`

只有用户主动勾选同意后，才会保存：

- 用户填写的个人信息
- 岗位名 / JD
- 经历素材文本
- 特殊要求
- 作品链接
- 生成后的中文 / 英文简历 JSON

不会保存：

- 简历照片 base64
- 用户自定义 API Key

## 4. 常用查询

查看最近生成次数：

```sql
select
  date_trunc('day', created_at) as day,
  event_name,
  count(*) as count
from yueli_events
group by 1, 2
order by day desc, event_name;
```

查看最近用户主动授权保存的记录：

```sql
select
  created_at,
  jd_title,
  jd_mode,
  input_snapshot -> 'profile' as profile,
  metadata
from yueli_resume_records
order by created_at desc
limit 20;
```

查看生成失败原因：

```sql
select
  created_at,
  payload ->> 'errorType' as error_type,
  payload
from yueli_events
where event_name = 'generate_failed'
order by created_at desc
limit 50;
```

## 5. 后台看板

项目提供一个轻量后台页面：

```text
/admin.html?token=你的后台口令
```

后台口令来自 Vercel 环境变量：

```bash
npx vercel@latest env add ADMIN_TOKEN production
```

后台数据接口：

```text
/api/admin-stats?token=你的后台口令
```

可以看到：

- 使用人数
- 页面打开次数
- 开始生成次数
- 生成成功次数
- 生成失败次数
- PDF 导出次数
- 局部改写次数
- 用户主动授权保存记录数量
- 最近 20 条授权保存记录摘要

## 6. 隐私建议

完整简历记录属于敏感个人信息。上线后建议：

- 在页面底部补一个隐私说明。
- 默认不保存完整记录。
- 保存完整记录必须用户主动勾选。
- 给用户提供删除记录的联系方式。
- 不在公开日志、截图、README 中展示用户原文。
