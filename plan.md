# Tamagotchi 风格情侣网站 · 项目计划（v1）

> 目标：打造一个可爱的“关系电子宠物”，承载你们的照片、回忆、小游戏与纪念日，形成“每日互动养成”的轻游戏化个人网站。

---

## 1. 愿景与体验目标

- **核心体验**：通过“喂养（上传/回顾回忆）-互动（小游戏）-成长（解锁皮肤/成就）”的循环，让电子宠物成为你们关系的情感仪式载体。
- **风格基调**：像素/掌机风（8/16-bit），温柔可爱，轻量音效，强记忆点的 UI（类似 Tamagotchi 的小屏窗口）。
- **访问方式**：私密访问（仅你和女朋友），支持手机端优先，离线可浏览核心内容。

---

## 2. 用户与访问控制

- **对象**：你与女友两位核心用户。
- **访问控制（MVP）**：简单口令或私密链接；后续可用邮件魔法链接（无需密码）。
- **数据所有权**：你们拥有全部数据，支持一键导出 JSON/媒体文件。

---

## 3. 玩法核心循环（Game Loop）

1. 每日进入网站 → 电子宠物问候与当前心情展示。
2. 执行 1-2 个动作：
   - 喂食“回忆”（新增/挑选一条 Moment：照片/文字/语音/短视频链接）。
   - 玩一个 30-60 秒的小游戏（如接爱心/记忆拼图/打地鼠）。
   - 完成每日签到或纪念日互动。
3. 获得数值提升（心情/亲密度/能量），推动成长（解锁自定义外观、主题、徽章）。
4. 当日“回忆卡片”被收录到时间线与相册。

---

## 4. 数值与状态（简化）

- **状态**：`心情 happiness`、`亲密 intimacy`、`能量 energy`、`清洁 cleanliness`。
- **衰减**：每日 0-2 点轻度衰减，持续互动可抵消。
- **动作收益（示例）**：
  - 喂食回忆：`happiness +3`、`intimacy +2`；
  - 小游戏胜利：`happiness +2`、`energy -1（临时消耗）`；
  - 清洁互动（点击打扫/整理相册标签）：`cleanliness +3`。
- **简单线性更新**：\( s_{t+1} = max(0, s_t - d + g) \)。

---

## 5. 功能分期

### 5.1 MVP（1-2 周）

- 电子宠物主页（动态表情/姿态 + 当日心情）。
- 回忆库 `Moments`：图片/文字/标签，支持随机抽卡回忆。
- 每日签到与“喂食回忆”动作，基础数值系统。
- 一个小游戏（接爱心）+ 简易成就（如“连续 3 天喂食”）。
- 时间线视图（按日期展示回忆）。
- 私密访问（口令）与本地缓存；PWA 基础离线。
- 响应式与暗黑模式。

### 5.2 v1（再 2-3 周）

- 纪念日倒计时与提醒（生日、相识日等）。
- 第二个小游戏（记忆拼图）与更多成就。
- 相册地图（可选，基于拍摄位置元数据）。
- 情书/便签（加密存储可选）。
- 轻量音效与背景音乐（可关闭）。

### 5.3 v2（扩展）

- 皮肤/主题商店（通过成就解锁）。
- 备份/恢复 + 导出（JSON + 媒体）。
- 简单 AI 辅助：回忆自动标签、纪念日祝福语生成。

---

## 6. 交互与视觉设计

- **UI**：掌机外观容器 + 像素字体 + 低像素精灵动画（眨眼、跳跃、睡觉）。
- **反馈**：微动画（Framer Motion/GSAP）、粒子特效（爱心/星星）。
- **音频**：点击/奖励音效，背景旋律（默认静音）。
- **可用性**：高对比度、键盘可操作、图片替代文本。

---

## 7. 技术架构建议

- **前端**：Next.js（App Router）+ TypeScript + Tailwind CSS + Framer Motion。
- **状态**：Zustand/Jotai（轻量），或 React Query 管理远程数据。
- **渲染**：Canvas/PixiJS 承载像素精灵（可从简单 CSS/SVG 动画起步）。
- **后端/存储（两选一）**：
  - A. 纯本地优先（MVP）：IndexedDB/LocalStorage 存数据，媒体文件放公开仓库/CDN；
  - B. 托管后端：Supabase（Auth + Postgres + Storage + Edge Functions）。
- **部署**：Vercel（域名 + HTTPS），图片走 Next/Image 或 Supabase CDN。
- **分析**：Plausible（匿名）。
- **PWA**：离线缓存首页与最近回忆，安装到主屏。

---

## 8. 数据模型（草案）

```sql
-- Users（如使用后端）
id uuid pk
email text unique
display_name text

-- Pet（一只电子宠物）
id uuid pk
owner_id uuid fk -> users.id
name text
skin text -- 当前皮肤标识
created_at timestamptz

-- PetStats（每日快照）
id uuid pk
pet_id uuid fk -> pet.id
date date
happiness int
intimacy int
energy int
cleanliness int

-- Moments（回忆）
id uuid pk
owner_id uuid fk -> users.id
title text
type text -- image|text|audio|video|link
url text -- 媒体地址（或本地相对路径）
content text -- 文本/附注
tags text[]
taken_at timestamptz
created_at timestamptz

-- ActivityLog（动作日志）
id uuid pk
pet_id uuid fk
action text -- feed|play|clean|checkin
delta jsonb -- {happiness: +2, intimacy: +1}
created_at timestamptz

-- MiniGameScore
id uuid pk
user_id uuid fk
game_key text -- hearts|puzzle
score int
created_at timestamptz

-- Achievement
id uuid pk
user_id uuid fk
key text unique per user
unlocked_at timestamptz
```

---

## 9. 功能流程（关键页面）

- **首页（宠物）**：状态展示、今日任务入口（喂食/游戏/签到）。
- **回忆库**：网格相册 + 过滤/标签；“随机抽卡回忆”。
- **时间线**：按日期瀑布流展示回忆与互动记录。
- **纪念日**：倒计时卡片 + 历史回顾。
- **设置**：主题/皮肤、访问口令、数据导出。

---

## 10. 安全与隐私

- 私密访问口令（前期），后期可升级魔法链接/简单 Auth。
- 图片可放私有存储（Supabase Storage 私有 Bucket + 签名 URL）。
- 数据导出与删除权；最小化日志与匿名分析。

---

## 11. 里程碑与时间预估（示例）

- **Sprint 0（0.5-1 天）**：视觉方向、像素字体、色板、宠物草图与表情集。
- **Sprint 1（2-3 天）**：项目脚手架、首页宠物与数值、签到/喂食、回忆库（本地存储）。
- **Sprint 2（2-3 天）**：小游戏 1、成就系统、时间线、PWA。
- **Sprint 3（2-3 天）**：纪念日、音效、暗黑模式、隐私访问。
- **Sprint 4（弹性）**：第二小游戏、导出/备份、皮肤商店。

---

## 12. 验收标准（DoD）

- 首屏加载 < 3s（4G 网络，移动端）。
- 无登录也可在本机离线浏览已缓存回忆与宠物状态。
- 每日可完成 2 个核心互动（喂食 + 小游戏）。
- 图片懒加载与压缩，移动端流畅滚动，帧动画不卡顿（> 40 FPS）。
- 数据可一键导出；口令保护有效。

---

## 13. 风险与对策

- 媒体隐私泄露 → 默认私有存储 + 短时签名 URL；或纯本地。
- 动画性能 → 优先 CSS/SVG，复杂再上 Canvas/Pixi；使用图片雪碧图。
- 复杂度膨胀 → 明确 MVP 边界，延期 “地图/AI/多皮肤” 到 v1+。

---

## 14. 素材准备清单

- 20-50 张高质量照片（可裁剪成 1:1/4:3）。
- 5-10 段简短文字回忆/小故事。
- 重要纪念日清单（日期/标题/备注）。
- 宠物形象参考（表情：开心/害羞/困/生气/期待）。
- 点击/奖励音效（可用免费音效库）。

---

## 15. 下一步（执行顺序）

1. 确认视觉方向与宠物表情清单。
2. 选择数据策略（纯本地 vs Supabase）。
3. 初始化项目（Next.js + TS + Tailwind + PWA）。
4. 实现首页宠物与状态系统（本地存储）。
5. 实现回忆库 + 随机抽卡；接入图片优化。
6. 接入小游戏 1（接爱心）与基础成就。
7. 私密访问口令与 PWA 离线。
8. 首次部署到 Vercel → 内测 → 调整体验。

---

## 16. 素材来源与授权策略

### 推荐素材来源（高质量/可商用优先）

- **像素美术与 UI 素材**：
  - [Kenney Game Assets（CC0 免署名）](https://kenney.nl/assets)
  - [itch.io 素材商店 · 像素风标签（逐包查看许可证）](https://itch.io/game-assets/tag-pixel-art)
  - [OpenGameArt（筛选 CC0 / CC-BY）](https://opengameart.org/)
  - [Lospec（调色板与资源索引）](https://lospec.com)

- **字体（像素/掌机感）**：
  - [Google Fonts · Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
  - [Google Fonts · VT323](https://fonts.google.com/specimen/VT323)
  - [1001 Fonts · Pixel 类（注意每款许可）](https://www.1001fonts.com/pixel-fonts.html)

- **音效与 BGM（8-bit/Chiptune）**：
  - [Freesound（筛选 CC0，保留链接与作者）](https://freesound.org/)
  - [Zapsplat（需署名或订阅）](https://www.zapsplat.com/)
  - [ChipTone（在线 8-bit 音效生成）](https://sfbgames.itch.io/chiptone)
  - [Bfxr（复古音效生成器）](https://www.bfxr.net/)
  - [BeepBox（浏览器作曲，导出循环 BGM）](https://www.beepbox.co/)

- **像素编辑与动画工具（自制路线）**：
  - [Aseprite（主流像素绘制，支持逐帧与导出雪碧图）](https://www.aseprite.org/)
  - [Piskel（免费在线像素编辑器）](https://www.piskelapp.com/)
  - [Pixelorama（开源像素编辑器）](https://orama-interactive.itch.io/pixelorama)

### 授权与合规要点

- **避免侵犯 IP**：不要使用 Bandai 的 Tamagotchi 原始角色、Logo、界面元素；仅参考“电子宠物”风格，自创形象与 UI。
- **优先选择宽松许可**：CC0/MIT 优先；若为 CC-BY 或自定义许可，务必在站内保留作者与链接。
- **逐包核对许可条款**：是否允许商用、修改、再分发、在付费项目中使用（即使本项目是私密，也建议遵循商用标准）。
- **建立 `CREDITS.md` 与 `assets/licenses/`**：记录来源、作者、链接、许可证版本；保存许可证文本/截图备份。

### 建议的素材规格（便于一次到位）

- **精灵尺寸**：32×32 或 48×48 起步；表情 6-8 帧，动作 8-12 帧。
- **调色板**：
  - [PICO-8 16 色](https://lospec.com/palette-list/pico-8)
  - [Sweetie 16](https://lospec.com/palette-list/sweetie-16)
  - [Nostalgia](https://lospec.com/palette-list/nostalgia)
- **导出**：统一导出为 PNG 雪碧图 + JSON（帧坐标）；提供 1x/2x 两套比例。
- **UI 元素**：像素 9-slice 边框；图标 16×16 或 24×24；按钮三态（normal/hover/active）。
- **音频规范**：SFX 44.1kHz/16-bit WAV，BGM 建议 OGG（循环点可选）。

### 可立即采用的组合（省时精选）

- **UI/图标**：Kenney 的 UI/Icons 套件 + 自定义调色板覆盖。
- **字体**：`Press Start 2P` 作为标题字，`VT323` 用于正文（大字号）。
- **音效**：用 ChipTone/Bfxr 现场生成点击/奖励音；不足部分从 Freesound（CC0）补齐。
- **宠物形象**：先用 Piskel 绘制 3 个基础状态（idle/joy/sleep），后续在 Aseprite 丰富动作。

### 委托创作（如需原创可爱风格）

- 平台可选：[Fiverr](https://www.fiverr.com/)、[Upwork](https://www.upwork.com/)、[VGen](https://vgen.co/)。
- 合同要点：明确像素尺寸/帧数、源文件交付（.ase/.psd）、著作权与署名、可修改与商用范围。

---

如需，我可以在下一步直接为你初始化项目结构与基础页面组件（Next.js + TS + Tailwind + PWA），并搭好宠物状态与回忆库的最小可用版本。
