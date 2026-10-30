# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/jcyunpu/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.

---

**Project:** 家传云谱  
**Direction:** Ink & Jade Archive（墨色 + 青绿数字典藏）  
**Updated:** 2026-09-13

---

## Global Rules

### Color Palette

| Role | Hex | Notes |
|------|-----|-------|
| Ink / Primary | `#15202B` | 主文字与主按钮 |
| Accent | `#1F6B5C` | 青绿强调（世系/状态） |
| Background | `#F3F5F7` | 冷灰白，禁止米黄纸 |
| Surface | `#FFFFFF` | 卡片/面板 |
| Muted text | `#3D4F5F` / `#6B7C8A` | 次级与辅助文案 |
| Border | `#D5DDE5` | 细线分隔 |

### Typography

- **Body / UI:** Manrope
- **Brand / Titles (ZH):** Noto Serif SC
- Avoid Inter / Roboto / Arial as brand fonts

### Layout

- Max content width ≈ 1120px
- Spacious section padding 72–96px
- Button radius 8–10px（禁止胶囊按钮堆叠）

### Motion

- Light scroll reveal 400–500ms
- Respect `prefers-reduced-motion`

### Anti-patterns

- 米黄纸 + 朱砂/赤陶 + 烫金古风模板
- 紫色渐变、多阴影、emoji 图标
- 首屏堆统计数字 / 多块营销卡片
