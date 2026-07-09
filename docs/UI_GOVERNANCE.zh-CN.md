# UI 治理总览

## 为什么要有项目级 UI Skill

`my-love-app` 是一个私密的、 owner-only 的微信小程序，采用 UniApp Vue 3 + Wot Design Uni + 自定义 design-token 系统。它有以下几个容易在后续迭代中被破坏的脆弱点：

- **自定义导航与全屏背景**：`AppShell.vue` 必须覆盖状态栏、自定义导航、内容区和底部安全区，不能出现白条或黑条。
- **滚动归属**：每个页面只能有一个明确的滚动所有者，避免嵌套滚动或不需要滚动条时出现滚动条。
- **安全区与键盘**：底部安全区 padding 只能由 `AppShell` 统一处理，键盘遮挡必须通过共享的 `useKeyboardAvoidance` 处理，不允许页面自己写死 padding。
- **Design token 系统**：所有颜色、间距、圆角、阴影、动效必须走 `src/design-system/**` 和 `src/styles/tokens/**`，页面中禁止出现裸 hex、裸 rpx/px、裸 shadow 等。
- **Wot UI 优先**：业务 UI 必须优先使用 Wot Design Uni，禁止在页面里直接写原生 `button`/`input`/`textarea`/`checkbox`/`radio`/`switch`/`picker`/`slider`/`form`。
- **视觉方向**：私密、温暖、可爱但不幼稚、手绘纸张感、手机优先，不能变成通用后台、社交应用或海洋/珊瑚主题。

为了避免每位 AI 在改页面时重新“发明”这些规则，我们把它们固化成 `.ai/skills/project-ui/SKILL.md` 和一组 checklist。未来所有 UI、页面、组件、布局、样式、导航、token、文案、交互、扫描或视觉质量相关的工作，都必须先读 Skill 和对应 checklist。

## Codex 与 Claude 的分工

- **Codex（架构安全执行者）**：
  - 在改代码前读 Skill 与 checklist。
  - 产出精确、最小化的 diff。
  - 保证 TypeScript 正确（含 strict 模式）。
  - 维护静态扫描脚本与仓库卫生。
  - 每次改动后跑完整验证。
  - 不使用 `git add .`、不 reset/clean/stash、不推送/部署/上传、不接触密钥。

- **Claude（视觉质量审查者）**：
  - 在视觉相关建议前读 Skill、checklist、`AGENTS.md`、`CLAUDE.md`、产品文档与关键源文件。
  - 负责视觉精修、截图审查、文案语气、间距构图、动效打磨、用户可见质量。
  - 仍必须遵守所有 token、Wot UI、架构、验证与禁止行为规则，不能绕过 Skill 另立视觉体系。

如果一项需求以视觉审查为主，Claude 先给出意见；需要代码改动时由 Codex 执行并验证。

## 哪些 UI 问题现在被治理

| 治理项 | 关键文件/组合 | 说明 |
| --- | --- | --- |
| 页面外壳 | `AppShell.vue` + `page-meta` + `useNativeChromeSync()` | 每个注册页面必须有 page-meta、app-shell、调用同步 |
| 自定义导航 | `AppCustomNav.vue` + `useCustomNavMetrics.ts` | 导航条、状态栏、标题、返回/主页、胶囊避让、右侧操作 |
| 全屏背景 | `AppShell.vue` + `page-shell` mixin | 状态栏、导航、内容、底部安全区无断层 |
| 滚动与高度 | 页面约定 + `useStickySectionOffset.ts` | 单一滚动所有者，避免嵌套滚动和魔法高度 |
| 安全区/键盘 | `AppShell.vue` + `useKeyboardAvoidance.ts` | 禁止重复 safe-area padding，禁止页面级键盘 magic spacing |
| Token 系统 | `src/design-system/**` + `src/styles/tokens/**` + `token-registry.ts` | 页面禁止裸样式值，新增 token 必须注册 |
| Wot UI / 原生控件 | Skill + `wot-design-uni` | 业务 UI 优先 Wot，禁止原生业务控件 |
| 文案/动效 | Skill + `scan:ui-copy` + `scan:design-tokens` | 用户可见文案必须简体中文，动效必须走 token |
| 产品边界 | `src/pages.json` + access-control 冻结 | 首页保持 `pages/index/index`，不恢复 `pages/access/access` 路由 |
| CloudBase 边界 | `src/services/cloudbase.ts` | 页面/组件禁止直接 `wx.cloud`，保持 `love_entries` / `coupleId: "main"` / `love-entries/main/` |

## 未来 UI 工作必须先读什么

按顺序：

1. `.ai/skills/project-ui/SKILL.md`
2. `.ai/skills/project-ui/checklists/` 中相关的 checklist
3. `.ai/skills/project-ui/references/` 中的参考（`page-patterns.md`、`anti-patterns.md`、`codex-claude-workflow.md`）
4. `AGENTS.md` / `CLAUDE.md`
5. `docs/AI_CODING_GUIDELINES.md`
6. `docs/PRODUCT_REQUIREMENTS.zh-CN.md`
7. 相关运行时源文件：`src/pages.json`、`src/components/AppShell.vue`、`src/components/AppCustomNav.vue`、`src/composables/useCustomNavMetrics.ts`、`src/composables/useKeyboardAvoidance.ts`、`src/styles/mixins.scss`、`src/design-system/token-registry.ts` 等。

## 保护这些规则的扫描命令

```bash
# UI 治理扫描（新增）：硬失败当前已必须遵守的规则，遗留问题只报 warning
pnpm scan:project-ui

# 已有扫描
pnpm scan:ui-copy           # 用户可见文案必须是简体中文
pnpm scan:design-tokens     # design token 合规性
pnpm scan:access-control    # 访问控制冻结状态
pnpm scan:security-baseline # 密钥/OpenID 等敏感信息

# 类型与构建
pnpm type-check
pnpm type-check:strict
pnpm build:mp-weixin

# Git 空白检查
git diff --check
```

## 禁止行为

- 不恢复 `pages/access/access` 为注册路由，不让它成为首页。
- 业务页面不调用 `useAccessGuard` 或 `requireAccess`。
- 不改 CloudBase CRUD、图片上传、临时 URL、心/反应功能、运行时路由、用户可见内容，除非任务明确要求。
- 不在页面/组件中直接调用 `wx.cloud`。
- 不在 `nav-theme.ts` 之外调用 `uni.setNavigationBarColor` / `setBackgroundColor` / `setBackgroundTextStyle`。
- 不使用 `git add .`、不 broad reset、不 `git clean`、不 stash、不 push、不 deploy、不 upload、不 preview。
- 不检查或打印密钥、AppSecret、OpenID、配对码等敏感信息。

## 相关文档

- `.ai/skills/project-ui/SKILL.md`
- `.ai/skills/project-ui/checklists/`
- `.ai/skills/project-ui/references/`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/AI_CODING_GUIDELINES.md`
- `docs/PRODUCT_REQUIREMENTS.zh-CN.md`
