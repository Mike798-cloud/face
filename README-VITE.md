# 《面目》The Face of It · v4.1

本版本针对“画面成立，但交互仍像网页”进行重构：核心场景交互由 Phaser + TypeScript 接管，DOM 只承担长文本、笔记本、设置和提示。

## 固定技术栈
- Phaser 3.90.0
- TypeScript 5.7.2
- Vite 6.3.1
- HTML / CSS / SVG / WAV / WebAudio

## 本地验收
```cmd
npm install
npm run typecheck
npm run test:logic
npm run build
npm run preview
```

GitHub Pages 使用 `.github/workflows/deploy.yml` 自动执行 `npm ci -> typecheck -> logic tests -> build -> deploy dist`。

## 交互原则
- 动作发生在场景里：拖、转、拉、擦、扫描、行走、拼合。
- 错误反馈说明世界规则，不弹“答错了”。
- 核心谜题至少有两条世界内依据。
- 手机端给连续操作提供大吸附区与点击/按键替代。
