# 跃历 Career Leap 部署说明

当前项目是纯静态站点，不需要后端构建。

## Vercel 一键部署

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

DeepSeek API Key 仅保存在用户浏览器 localStorage 中，不会随静态站点一起上传。
