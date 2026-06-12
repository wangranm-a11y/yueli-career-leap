# 跃历 Career Leap

从零散经历到高匹配简历，只差一次跃历。

跃历是一个纯前端 AI 简历生成工具。用户可以上传已有简历、经历素材和目标岗位，工具会基于真实事实重组表达、补足 STAR，并生成一页能投递的 A4 简历。

## Features

- 目标岗位 / 完整 JD 输入
- PDF、DOCX、TXT、MD 经历素材批量上传
- 简历照片手动上传
- DeepSeek API 生成中文 / 英文结构化简历
- 事实优先机制：不编造公司、时间、奖项、数据和技能
- 实习经历、项目经历、创业 / 校园经历自动分类
- 一页 A4 简历预览与 PDF / PNG 下载
- 选中文字 AI 改写
- JD 匹配度评分
- 历史版本回退

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- DeepSeek Chat Completions API
- pdf.js
- mammoth.js
- Tesseract.js

## Local Development

```bash
python3 -m http.server 8788
```

Then open:

```text
http://localhost:8788
```

## Deploy

This project is a static website and can be deployed to Vercel, Netlify, GitHub Pages, or any static hosting service.

Vercel:

```bash
npx vercel@latest --prod
```

## Privacy

DeepSeek API Key is saved in the user's browser `localStorage` only. It is not included in the source code and is not uploaded to this static site.

Uploaded resume files are parsed in the browser. The extracted text is sent to the model only when the user generates or rewrites a resume.

## License

MIT
