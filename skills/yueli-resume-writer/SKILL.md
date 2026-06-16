---
name: yueli-resume-writer
description: Create, rewrite, and polish fact-first resumes from existing resumes, raw notes, portfolios, links, target roles, or JDs. Use when the user wants an agent-native resume workflow that preserves truth, prioritizes internships/projects, applies STAR writing, targets a role, controls density, and exports a polished Chinese or English resume without relying on a resume-builder UI.
---

# Yueli Resume Writer

## Purpose

Turn scattered real experiences into a credible, dense, role-matched resume.

The resume should feel human-written, specific, and ready to submit. It should not feel like a generic AI rewrite. The core method is:

`facts first -> role translation -> experience selection -> STAR bullets -> layout verification -> export`

## Non-Negotiables

- Preserve facts. Never invent schools, companies, roles, dates, awards, metrics, tools, links, products, competitions, or responsibilities.
- If a fact is missing, use conservative wording or ask one concise question. Do not fill gaps with confident fiction.
- Keep internships as internships. Any experience with a company, organization, formal role, work period, client, or team belongs in `实习经历` / `Work Experience`, not `项目经历`, unless the user explicitly says it was only a project.
- Experiences matter most. Use `个人概述` and `技能` only when core experiences, education, projects, campus, entrepreneurship, and portfolio content are still insufficient or when the target role requires a quick skill scan.
- Sort by target relevance first, then recency. If relevance is equal, put newer experiences above older ones.
- Every major experience must show dates when known. If exact dates are missing, use the most conservative available period, e.g. `2026.03 - 2026.06`, `2026`, or `时间待补充`.
- Do not crop content. If a one-page resume overflows, reduce content by selection and compression, or export a multi-page complete version. Never hide overflowing content.
- Do not make text tiny to fake a full page. Keep font size readable; fill space by adding relevant factual content and stronger bullets.
- The final PDF must match the preview. Verify page count and visual layout when producing designed output.

## Operating Modes

### Complete Version

Use when the user has rich experience or asks not to lose content.

- Allow multiple A4 pages if needed.
- Preserve all strong relevant experience.
- Export all pages; do not force one page.
- This is the default when the user says content has been cut off or when the source material is dense.

### One-Page Compact Version

Use when the user explicitly wants a one-page resume.

- Fit exactly one A4 page by selecting and compressing content.
- Do not crop.
- Do not shrink fonts below professional readability.
- Keep education + strongest internships/projects first.
- Remove weaker bullets, low-signal projects, repeated claims, and fallback summary/skills before cutting core internships.

### Editor/HTML Version

Use when the user wants a designed resume, PDF, or editable source.

- Produce HTML/CSS or DOCX/PDF-ready layout.
- Keep dates aligned right.
- Use compact sections and dense but readable bullets.
- Render/check before final delivery when possible.

## Source Reading Workflow

1. Gather all source material:
   - Existing resume or PDF/DOCX.
   - Raw experience notes.
   - Project summaries.
   - Portfolio/GitHub/product links.
   - Target role name and JD if available.
   - User preferences: Chinese/English, photo/no photo, one page/complete version.
2. Extract a factual brief:
   - Basic info: name, phone, email, links, location if provided.
   - Education: school, major, degree, dates, GPA/rank, scholarships, competitions, relevant courses, languages.
   - Experiences: organization, role, dates, category, tasks, actions, outputs, metrics, tools, collaborators, links.
   - Target: role title, JD keywords, industry language, core evaluation criteria.
3. Build an experience inventory before writing:
   - List all candidate experiences.
   - Classify each as education, internship/work, project, campus, entrepreneurship, portfolio, award, or skill.
   - Recommend a selection order.
   - If the user wants control, ask them to confirm which experiences to include before final writing.
4. Write the resume:
   - Translate raw facts into target-role evidence.
   - Prioritize internships/work.
   - Expand selected experiences using STAR.
   - Add projects/campus/entrepreneurship to fill and strengthen the page.
   - Add skills/summary only when useful or necessary.
5. Verify layout:
   - Check page count.
   - Check no cropping.
   - Check dates, section order, bullet length, photo placement, and PDF/preview consistency.

## Experience Selection

Before generating a final resume from many raw materials, create a short recommendation like:

```markdown
建议写入：
1. Spatius / SpatialWalk - 数字人产品与海外增长实习
2. ZooNotFound - AI 陪伴机器人产品实习
3. 新浪微博 - 品牌运营实习
4. 跃历 Career Leap - AI 简历工具
5. 抖音黑客松 - AI 健身信息流卡
6. Funlish / 校园创业 - 如版面需要补充

建议弱化或不写：
- 与目标岗位无关且缺少产出的经历
```

If the user does not respond and the task should proceed, use the recommended set.

## Section Rules

### Header

Use a compact header:

`姓名`

`电话 | 邮箱 | GitHub/作品集/LinkedIn`

Optional target line only when useful:

`求职方向：投资人实习生 / VC Analyst Intern`

### Photo

- Chinese resumes may include a photo if the user provides one.
- English/international resumes usually do not need a photo unless requested.
- Keep photo aspect ratio natural.
- Place it in the top-right header area.
- It must sit above the education section line and must not cover section borders, dates, or text.

### Education

Always include education near the top unless explicitly asked otherwise.

Preferred dense format:

`学校 | 专业/学位 | 时间`

`GPA/排名 | 奖项 | 竞赛 | 语言能力 | 相关课程`

Include factual awards such as scholarships, rankings, competitions, honors, and language scores.

### Internship / Work Experience

Use company/organization as the title anchor:

`公司 / 组织 — 岗位名称` on the left, `YYYY.MM - YYYY.MM` on the right.

Write 2-4 dense bullets for important experiences. Each bullet should include:

- Context or task.
- Action/method.
- Output/evidence/metric.
- Target-role relevance.

### Projects

Use project name as the title anchor only when it is not a formal internship.

`项目名称 — 角色` on the left, `YYYY.MM - YYYY.MM` on the right.

If the project has GitHub, demo, portfolio, article, or prototype links, embed the link in the title or place it on the title line.

### Campus / Entrepreneurship

Include when it shows:

- Leadership.
- Growth/operations.
- Monetization.
- User research.
- Community building.
- Cross-cultural communication.
- Project execution.
- Business judgment.

Do not discard campus/entrepreneurial experience just because it is not a formal internship. Reframe it toward the target role.

### Skills

Skills should be compact and grouped. Avoid random keyword dumping.

Good format:

`研究分析：行业/竞品研究、公司基本面分析、财报/招股书阅读、用户访谈、双语资料检索`

`工具与表达：Excel/飞书多维表格、Markdown、SQL/Python（如真实）、PRD/调研报告/策略文档撰写`

Only include skills that are factual or clearly supported by experience.

### Summary

Use only when:

- The resume is still visually sparse.
- The target role benefits from a concise profile.
- The user asks for it.

Keep it to 2-3 lines and make it specific. Do not write generic self-praise.

## STAR Writing Pattern

Every major bullet should follow a compressed STAR pattern:

`Action/Method + Task/Scope + Result/Evidence + Role-fit takeaway`

Chinese bullet shape:

`行业研究：围绕 AI 陪伴硬件赛道调研 20+ 款软硬件产品，拆解定位、人群、定价订阅、交互玩法与用户反馈，为赛道判断和商业模式分析提供证据。`

English bullet shape:

`Market Research: Analyzed 20+ AI companion hardware/software products across positioning, target users, pricing, interaction design, and user feedback, building evidence for market and business model assessment.`

Avoid:

- `负责很多工作`
- `提升综合能力`
- `显著提升体验` without proof
- Unsupported ownership claims
- Same rhythm in every bullet
- Copying raw notes too literally

## Target-Role Translation

Translate facts into the evaluation language of the target role.

### Product Manager / AI Product

Emphasize:

- User research.
- Requirement definition.
- PRD/prototype.
- AI workflow.
- Model testing.
- Cross-functional collaboration.
- Product metrics.

### Operations / Growth

Emphasize:

- Campaigns.
- Community.
- Funnel.
- Conversion.
- Retention.
- Content.
- SOP.
- Data review.

### Marketing / Brand

Emphasize:

- Positioning.
- Audience insight.
- Brand campaign.
- Channel strategy.
- Content strategy.
- KOL/resource leverage.
- Communication results.

### Consulting / Strategy

Emphasize:

- Structured analysis.
- Business diagnosis.
- Industry research.
- Competitor benchmarking.
- Stakeholder communication.
- Insight synthesis.
- Recommendation logic.

### Investor Intern / VC Analyst

Emphasize:

- Industry mapping and market sizing logic.
- Company/competitor research.
- Business model and monetization analysis.
- Financial statement, prospectus, annual report, or earnings report reading.
- Customer/market demand validation.
- Founder/startup resource research.
- Growth channel and GTM analysis.
- AI/consumer/content/education-tech trend sensitivity.
- Clear writing and memo-style output.

Good wording:

- `训练投资研究中的供给侧扫描、可比公司拆解和成本结构判断能力。`
- `沉淀自上而下行业机会与自下而上公司需求验证的方法。`
- `辅助判断增长故事、盈利质量和规模化潜力。`
- `体现对早期产品需求真实性、用户体验和迭代速度的判断。`

Avoid making the user sound like they already made investment decisions unless factual.

### Campus Recruiting

Emphasize:

- Learning agility.
- Structured thinking.
- Internship evidence.
- Campus leadership.
- Project ownership.
- Potential and transferability.

## Density Rules

For Chinese resumes:

- Core bullets should usually be 55-95 Chinese characters depending on layout.
- Important experiences: 2-4 bullets.
- Secondary experiences: 1-2 bullets.
- Section spacing should be tight but readable.
- Do not leave a large blank bottom area if factual content exists.
- If short, add relevant factual campus/project/skills content before enlarging fonts.
- If long, remove repeated claims before shrinking text.

For English resumes:

- Use one strong sentence per bullet.
- Avoid photos by default.
- Prefer concise, active verbs.

## Layout Rules

For A4 designed output:

- Use A4 dimensions and print CSS if producing HTML.
- Keep margins professional: roughly 9-13 mm depending on density.
- Header should not waste vertical space.
- Dates align right and use consistent font size.
- Section rules must not be covered by photos or floating elements.
- Bullets use consistent indentation.
- Bold leading keywords when useful: `行业研究：`, `用户洞察：`, `增长验证：`.
- Hyperlinks should survive PDF export when possible.
- Verify page count after export.

## One-Page Fit Strategy

If underfilled:

1. Expand core internship bullets with factual method/output/relevance.
2. Add additional real experiences from the source inventory.
3. Add awards, language scores, relevant courses under education.
4. Add compact skills.
5. Add a brief summary only as a last resort.

If overflowing:

1. Remove generic summary first.
2. Remove weak skills.
3. Compress repeated bullets.
4. Reduce secondary projects to one bullet.
5. Keep strongest internships and education intact.
6. If still overflowing, offer a complete multi-page version instead of cropping.

## Output Formats

### Text/Markdown

```markdown
# 姓名
电话 | 邮箱 | 作品链接

## 教育经历
学校 | 专业/学位 | 时间
GPA/排名 | 奖项 | 相关课程/语言能力

## 实习经历
公司 — 岗位 | 时间
- **关键词：** 内容...

## 项目经历
项目 — 角色 | 时间
- **关键词：** 内容...
```

### HTML/PDF

When asked for PDF:

1. Produce editable HTML/CSS source.
2. Export to PDF.
3. Confirm page count.
4. Render or visually inspect the PDF if tools are available.
5. If photo is included, verify it sits above the education rule and does not distort.

## Quality Checklist

Before final delivery, verify:

- Basic info is correct.
- Education is present.
- Internships are not misclassified as projects.
- Major experiences have dates.
- Role keywords are reflected naturally.
- Bullets are fact-based and not generic.
- Claims trace back to source material.
- Page is full enough but not crowded.
- PDF does not crop content.
- Preview and export match.
- If a photo is used, it is correctly placed and not stretched.

## Quick Variant Commands

When the user asks for quick changes, apply these without requiring a long prompt:

- `更像产品经理`: emphasize user research, requirements, prioritization, PRD, cross-functional collaboration, product metrics.
- `更像运营`: emphasize campaigns, communities, growth funnels, conversion, content, retention, execution.
- `更像市场`: emphasize positioning, audience insight, campaign planning, brand, channel strategy, data review.
- `更像咨询`: emphasize structured analysis, business diagnosis, competitor research, stakeholder communication, insight synthesis.
- `更像投资人实习生`: emphasize industry research, competitor/company analysis, business model, financial signals, growth channels, market demand validation, and memo-style output.
- `更数据化`: add real metrics, denominators, methods, dashboards, A/B tests, SQL/Python/Tableau only if factual.
- `更简洁`: compress wording while preserving facts, results, and role-fit takeaway.
- `更适合校招`: emphasize potential, learning agility, campus leadership, internships, projects, awards, and transferable skills.

## Missing Facts Protocol

If key facts are missing:

- Ask one concise question if the missing fact blocks the resume.
- Use conservative wording when ownership is unclear: `参与`, `协助`, `支持`.
- Use qualitative evidence when no metric exists: `输出调研报告`, `完成竞品拆解`, `搭建 SOP`.
- Mark placeholders only when necessary: `时间待补充`.
- Never invent a metric just because the bullet looks stronger with numbers.
