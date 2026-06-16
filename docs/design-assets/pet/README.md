# Pet Design Asset Notes

## Current runtime status

当前 Stage 1 runtime 临时使用 `static/pet/pet-idle.png` 作为 `src/components/AppPetNavigator.vue` 的静态小宠物视觉。
来源文件是 `docs/design-assets/pet/runtime-source/pet-idle.png`。
这是透明 PNG 静态方案，不是最终 SVG 动画方案；本轮没有接入 blink、menu、hide 等动画状态。

旧 `raster-drafts/00.png` 到 `raster-drafts/07.png` 均为 RGB PNG，没有 alpha 通道；其中 `01.png` 的棋盘格背景已烘进图片像素，不是真透明背景。旧草稿 PNG 不得直接接入 runtime。

## Asset folders

- `raster-drafts/`: PNG 设计探索稿，仅作为视觉方向参考。草稿 PNG 不得放回 `static/pet/`，避免进入小程序构建产物并增加包体积。
- `runtime-source/`: 当前 runtime PNG 的来源目录。只允许将已验证透明的单张 runtime 文件复制到 `static/pet/`，不要把旧草稿批量复制回运行目录。
- `invalid-svg-attempt/`: 代码生成的无效 SVG 尝试。这些 SVG 虽然曾通过结构检查，但视觉不符合最终宠物设计，过硬且程序感强，不得接入 `AppPetNavigator`。
- `previews/`: 设计探索阶段的预览图，不属于运行时资产。

原 `static/pet/README.md` 描述的是上一轮不合格 SVG 的临时契约，已经失去运行时意义；本文件替代该说明。

## Formal SVG requirements

下一版正式 SVG 必须由人工矢量化或 Figma、Illustrator、Inkscape 等专业设计工具输出。Codex 只负责校验和接入，不继续生成或手写宠物 SVG。

正式 SVG 必须满足：

- 同一个 master body path。
- `viewBox="0 0 256 256"`。
- 透明背景。
- 不内嵌 bitmap。
- 不使用 heavy filter。
- 不使用 base64。
- 不出现 `text`。
- 不出现海洋、珊瑚、动物、3D、玻璃拟物。
- 接入 `AppPetNavigator` 前必须人工视觉验收。

推荐生产流程：

1. 先锁定一张最终 idle PNG 母版。
2. 用 Figma、Illustrator 或 Inkscape 人工矢量化。
3. 产出 `pet-master.svg`。
4. 再由设计工具基于同一个 body path 做 `pet-blink.svg`、`pet-menu.svg`、`pet-hide.svg`。
5. Codex 只负责校验和接入。
