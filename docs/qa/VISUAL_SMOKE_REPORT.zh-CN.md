# 小珊的树洞：Visual Smoke 1.0 验收证据

> 测试日期：2026-06-18
> 状态：accepted
> 证据来源：本机临时目录 `/tmp/my-love-app-visual-smoke/`
> 截图提交策略：不提交截图文件，仅保留可复核的轻量证据清单

## 1. 环境与版本

| 项目 | 记录 |
|---|---|
| 目标端 | `mp-weixin` |
| 自动化工具 | `@dcloudio/uni-automator` |
| UniApp 版本 | `3.0.0-4080420251103001` |
| DevTools 版本 | 当前仓库证据未记录具体版本，后续复测需补充 |
| 微信基础库版本 | 当前仓库证据未记录具体版本，后续复测需补充 |
| CloudBase envId | `love-d4g006mox4b78e5c6` |
| AppID | `wx04b0ef4f0de5c5c5` |

## 2. 覆盖页面

| 路由 / 状态 | 截图标签 |
|---|---|
| 首页 | `home` |
| 回忆创建 | `create` |
| 回忆详情 | `detail` |
| 小歌单 | `songs` |
| 点歌编辑 | `song-edit` |
| 小约定 | `tasks` |
| 事项编辑 | `task-edit` |
| 小档案 | `memos` |
| 小线索编辑 | `memo-edit` |
| 设置页 | `settings` |
| 小宠物菜单 | `pet-menu` |

## 3. 视觉矩阵

| 变体 | 覆盖 |
|---|---|
| `light-default` | 11 个页面 / 状态、1 张聚焦截图、2 张键盘避让截图 |
| `dark-default` | 11 个页面 / 状态 |
| `light-peach` | 11 个页面 / 状态 |
| `light-large-font` | 11 个页面 / 状态 |
| `light-compact` | 11 个页面 / 状态 |
| `palette-1-warm-paper-red-blue` 至 `palette-6-indigo-letter` | 每套补充首页和设置页 |

截图文件总数：75。

## 4. 截图文件清单

- `dark-default__contact-sheet.jpg`
- `dark-default__create.png`
- `dark-default__detail.png`
- `dark-default__home.png`
- `dark-default__memo-edit.png`
- `dark-default__memos.png`
- `dark-default__pet-menu.png`
- `dark-default__settings.png`
- `dark-default__song-edit.png`
- `dark-default__songs.png`
- `dark-default__task-edit.png`
- `dark-default__tasks.png`
- `light-compact__contact-sheet.jpg`
- `light-compact__create.png`
- `light-compact__detail.png`
- `light-compact__home.png`
- `light-compact__memo-edit.png`
- `light-compact__memos.png`
- `light-compact__pet-menu.png`
- `light-compact__settings.png`
- `light-compact__song-edit.png`
- `light-compact__songs.png`
- `light-compact__task-edit.png`
- `light-compact__tasks.png`
- `light-default__contact-sheet.jpg`
- `light-default__create-focus.png`
- `light-default__create-keyboard-event.png`
- `light-default__create-keyboard-spacer-bottom.png`
- `light-default__create.png`
- `light-default__detail.png`
- `light-default__home.png`
- `light-default__memo-edit.png`
- `light-default__memos.png`
- `light-default__pet-menu.png`
- `light-default__settings.png`
- `light-default__song-edit.png`
- `light-default__songs.png`
- `light-default__task-edit.png`
- `light-default__tasks.png`
- `light-large-font__contact-sheet.jpg`
- `light-large-font__create.png`
- `light-large-font__detail.png`
- `light-large-font__home.png`
- `light-large-font__memo-edit.png`
- `light-large-font__memos.png`
- `light-large-font__pet-menu.png`
- `light-large-font__settings.png`
- `light-large-font__song-edit.png`
- `light-large-font__songs.png`
- `light-large-font__task-edit.png`
- `light-large-font__tasks.png`
- `light-peach__contact-sheet.jpg`
- `light-peach__create.png`
- `light-peach__detail.png`
- `light-peach__home.png`
- `light-peach__memo-edit.png`
- `light-peach__memos.png`
- `light-peach__pet-menu.png`
- `light-peach__settings.png`
- `light-peach__song-edit.png`
- `light-peach__songs.png`
- `light-peach__task-edit.png`
- `light-peach__tasks.png`
- `palette-1-warm-paper-red-blue__home.png`
- `palette-1-warm-paper-red-blue__settings.png`
- `palette-2-peach-mist-blue__home.png`
- `palette-2-peach-mist-blue__settings.png`
- `palette-3-wisteria-tea__home.png`
- `palette-3-wisteria-tea__settings.png`
- `palette-4-apricot-sage__home.png`
- `palette-4-apricot-sage__settings.png`
- `palette-5-plum-garden__home.png`
- `palette-5-plum-garden__settings.png`
- `palette-6-indigo-letter__home.png`
- `palette-6-indigo-letter__settings.png`

## 5. 键盘避让证据

- 聚焦截图：`light-default__create-focus.png`
- 键盘事件截图：`light-default__create-keyboard-event.png`
- 底部 spacer 截图：`light-default__create-keyboard-spacer-bottom.png`
- 运行证据：触发原生 `keyboardheightchange` 后，`.keyboard-spacer` 从 `height:0;` 变为 `height:320px;`。

## 6. 验收结论

- 自定义导航、列表关键区域吸顶、键盘避让、统一 Toast、小宠物避让和设置页选择控件已完成 Visual Smoke 1.0 验收。
- 截图文件位于 `/tmp`，不可作为长期证据依赖；本文件仅固化当次轻量清单。
- 本轮最终验收记录必须使用正确 CloudBase envId：`love-d4g006mox4b78e5c6`。

## 7. 已知自动化限制

- `@dcloudio/uni-automator` 在当前 `mp-weixin` 目标返回 `App.keyboardInput unimplemented`，未自动化真实键盘文字输入。
- 键盘避让验收使用原生键盘高度事件与可视 spacer 变化作为遮挡证明。
- DevTools 版本和基础库版本未在当前仓库证据中留存，后续复测应在本文件补充。
