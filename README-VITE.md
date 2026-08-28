# 《面目》v4.0 — npm + Vite 工程说明

本工程只做构建与依赖标准化，不增加或改写游戏内容。

## 固定版本

- Phaser 3.90.0
- TypeScript 5.7.2
- Vite 6.3.1

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run dev` / `npm run build` 会先把当前仓库已有的 `assets/images` 与 `assets/audio` 同步到 `public/assets`，保证 Vite 开发服务器和 `dist` 构建产物继续沿用原资源路径。

GitHub Pages 使用 `dist/` 作为发布目录；`vite.config.ts` 使用相对 `base: './'`，兼容项目页路径。
