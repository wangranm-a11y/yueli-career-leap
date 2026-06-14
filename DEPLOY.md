# 跃历 Career Leap 部署说明

当前项目是纯静态站点，不需要后端构建。

## Vercel 一键部署

先在 Vercel 配置服务器环境变量，避免把 DeepSeek Key 暴露在前端代码里：

```bash
npx vercel@latest env add DEEPSEEK_API_KEY production
```

然后部署：

```bash
cd resume-tool
npx vercel@latest login
npx vercel@latest --prod --yes
```

如果提示 token 无效，先重新登录：

```bash
npx vercel@latest logout
npx vercel@latest login
npx vercel@latest --prod --yes
```

## 手动拖拽部署

也可以将桌面的 `yueli-career-leap-deploy.zip` 解压后拖到 Vercel 或 Netlify 的静态站点部署页面。

## 隐私说明

线上默认使用 Vercel 环境变量 `DEEPSEEK_API_KEY`，不会暴露在 GitHub 或前端代码里。
如果用户在页面里填写自己的 DeepSeek API Key，该 Key 仅保存在用户浏览器 localStorage 中。

## 用户数据记录（可选）

项目支持两层记录：

- 默认匿名功能统计：不保存简历正文。
- 用户主动勾选后保存完整生成记录：保存输入快照和生成结果，不保存照片和 API Key。

如需启用，请参考：

```bash
cat USER_DATA_SETUP.md
```
