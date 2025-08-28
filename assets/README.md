# Assets Guide

本目录存放网站的视觉与音频素材。当前包含：像素/手绘风 SVG、颜色调色板、来源清单与许可证占位。

---

## 结构

- `palette.css`: 全站颜色与阴影 CSS 变量（可在任意页面引入）。
- `svg/backgrounds/pastel-stars.svg`: 马卡龙星星背景（平铺友好）。
- `svg/ui/egg-shell.svg`: Tamagotchi 风格外壳与屏幕框。
- `svg/pet/pet-idle.svg`: 占位宠物（idle 状态，手绘柔和风）。
- `sources.json`: 第三方素材来源清单（含许可与备注）。
- `../CREDITS.md`: 素材致谢与许可证说明。
- `licenses/`: 各第三方素材的许可证文本副本。

---

## 使用方式（示例）

在 HTML/CSS 中直接引用 SVG：

```html
<img src="/assets/svg/ui/egg-shell.svg" alt="Egg shell" />
```

作为背景图：

```css
/* Use pastel stars as tiled background */
body {
  background-image: url('/assets/svg/backgrounds/pastel-stars.svg');
  background-repeat: repeat;
  background-size: 400px 400px;
}
```

引入调色板：

```html
<link rel="stylesheet" href="/assets/palette.css" />
```

---

## 约定

- 占位素材为自制，暂以 CC0（Public Domain）发布，允许自由使用与修改。
- 请勿使用任何涉及 Bandai Tamagotchi 原始 IP 的图形、Logo 或界面元素。
- 引入第三方素材时：务必在 `CREDITS.md` 添加条目，并将许可证文本放入 `assets/licenses/`。


