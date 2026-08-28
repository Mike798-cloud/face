# 面目 · The Face of It v4.1

TypeScript + Phaser + Vite 浏览器原生互动解谜版。

核心变化：把原本“热点 -> 弹窗 -> 点击答案”的主要谜题迁回场景，让玩家通过拖、转、拉、擦、扫描、行走、拼合来验证世界规则；长文本、观察卡、提示与设置继续由 HTML/CSS 负责。

## 固定版本
- Phaser 3.90.0
- TypeScript 5.7.2
- Vite 6.3.1

## 本地验收
Windows 可运行 `tools\verify-and-build.bat`。通过后再执行 `npm run preview`，完整试玩至少一次，再推送 main。

GitHub Pages 使用 `.github/workflows/deploy.yml` 构建并发布 `dist/`，Vite base 固定为 `/face/`。
