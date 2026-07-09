# UI 治理初始化报告

## 1. 本次治理目标

为 `my-love-app` 建立项目级 UI Skill、配套治理文档和 `scan:project-ui` 静态扫描，确保未来 Codex/Claude 在进行任何 UI、页面、组件、布局、样式、导航、token、文案、交互或视觉质量改动时，都有统一的规则来源和可执行的检查手段。

本次任务**仅限治理**，不修改业务页面运行时逻辑、不修复既有 UI 缺陷、不改 CloudBase/访问控制/图片上传/临时 URL/心/反应功能/用户可见文案。

## 2. 新增文件

| 文件 | 作用 |
| --- | --- |
| `.ai/skills/project-ui/SKILL.md` | 项目 UI Skill 主文件，定义上下文、阅读顺序、硬规则、页面外壳/导航/背景/滚动/高度/安全区/键盘/Wot UI/原生控件/token/视觉方向/宠物导航/文案动效/CloudBase 边界/Codex-Claude 分工/验证/禁止行为/报告格式 |
| `.ai/skills/project-ui/checklists/page-shell.md` | 页面外壳 checklist：page-meta 首节点、绑定、app-shell 包裹、useNativeChromeSync、路由安全 |
| `.ai/skills/project-ui/checklists/navigation.md` | 自定义导航 checklist：导航所有者、胶囊避让、无顶空白、返回行为、变体、粘性区 |
| `.ai/skills/project-ui/checklists/scroll-and-height.md` | 滚动与高度 checklist：滚动归属、固定面板/内部滚动、下拉刷新、反模式 |
| `.ai/skills/project-ui/checklists/background-safe-area-keyboard.md` | 背景/安全区/键盘 checklist：全屏背景、safe-area、键盘规避、token 补充 |
| `.ai/skills/project-ui/checklists/theme-and-tokens.md` | 主题与 token checklist：token 来源、禁止裸值、新增 token 流程、Wot UI 主题 |
| `.ai/skills/project-ui/checklists/wot-ui-and-controls.md` | Wot UI 与原生控件 checklist：Wot 优先、原生控件禁令、允许例外、例外创建流程 |
| `.ai/skills/project-ui/checklists/states-copy-and-motion.md` | 状态/文案/动效 checklist：简体中文、文案语气、状态反馈、运动 token |
| `.ai/skills/project-ui/checklists/runtime-qa.md` | 运行时 QA checklist：构建、类型、扫描、手动检查、产品边界 |
| `.ai/skills/project-ui/references/page-patterns.md` | 受治理页面模式参考：标准页、首页、编辑页（键盘）、粘性过滤条、选项组 |
| `.ai/skills/project-ui/references/anti-patterns.md` | UI 反模式清单：页面外壳/导航/背景/滚动/键盘/token/控件/视觉/动效/文案 |
| `.ai/skills/project-ui/references/codex-claude-workflow.md` | Codex/Claude 协作参考：职责分工、协作流程、交接说明 |
| `docs/UI_GOVERNANCE.zh-CN.md` | 中文治理总览：为何有 Skill、Codex/Claude 分工、治理项、阅读顺序、扫描命令、禁止行为 |
| `scripts/scan-project-ui.mjs` | 新增 UI 治理扫描脚本 |
| `docs/audits/UI_GOVERNANCE_BOOTSTRAP_REPORT.zh-CN.md` | 本报告 |

## 3. 更新文件

| 文件 | 更新内容 |
| --- | --- |
| `AGENTS.md` | 新增“Root Governance for Codex”章节：要求先读 Skill/checklist/参考/源文件；定义 Codex 角色；明确禁止 broad git、恢复访问门、修改 CloudBase/访问控制/用户内容等行为；在 Validation 中追加 `pnpm scan:project-ui` |
| `CLAUDE.md` | 全面重写为 Claude 专属治理文件：要求先读 Skill/checklist/AGENTS.md/AI_CODING_GUIDELINES.md/PRODUCT_REQUIREMENTS/EXPERIENCE_BUILD_CHANGE_LOG/关键源文件；定义 Claude 视觉审查角色；明确非协商边界、UI 系统规则、禁止行为、验证要求和报告格式 |
| `docs/AI_CODING_GUIDELINES.md` | 在文件顶部新增指向 `.ai/skills/project-ui/SKILL.md` 和 `docs/UI_GOVERNANCE.zh-CN.md` 的指针，避免重复 Skill 全文 |
| `package.json` | `scripts` 中新增 `"scan:project-ui": "node scripts/scan-project-ui.mjs"` |

## 4. 故意未改动的内容

- 所有业务页面（`src/pages/**`）的模板、脚本、样式、运行时逻辑均保持原样。
- `src/components/AppShell.vue`、`src/components/AppCustomNav.vue`、`src/composables/useCustomNavMetrics.ts`、`src/composables/useKeyboardAvoidance.ts`、`src/composables/useStickySectionOffset.ts` 的 Runtime 实现未改。
- CloudBase 服务、CRUD、图片上传、临时 URL、文件删除逻辑未改。
- 访问控制运行时状态冻结：`pages/access/access` 未重新注册为路由，业务页未调用 `useAccessGuard`/`requireAccess`。
- `love_entries` 集合、`coupleId: "main"`、`love-entries/main/` 存储前缀保持不变。
- 用户可见的中文文案、视觉样式、动效保持原样。
- 未执行任何 git add / commit / push / deploy / upload / preview / clean / reset / stash。

## 5. `scan:project-ui` 行为说明

### 硬失败（Hard failures）

以下任何一条命中都会让扫描以非零退出码失败：

- `src/pages.json` 中首页不是 `pages/index/index`。
- `pages/access/access` 被重新注册，或被移到首页。
- 注册页面文件缺失。
- 注册页面缺少 `<page-meta>` 作为首模板节点。
- 注册页面未使用 `<app-shell>` 包裹。
- 注册页面未调用 `useNativeChromeSync()`。
- 业务注册页面调用 `useAccessGuard` 或 `requireAccess`。
- `src/pages/**` 或 `src/components/**` 中直接调用 `wx.cloud.*`。
- `src/design-system/nav-theme.ts` 之外调用 `uni.setNavigationBarColor` / `setBackgroundColor` / `setBackgroundTextStyle`。
- 扫描文件中出现疑似真实 OpenID、配对码、密码、AppSecret、token 等字面量。
- `AGENTS.md` 或 `CLAUDE.md` 没有引用 `.ai/skills/project-ui/SKILL.md`。

### 警告（Warnings，扫描仍通过）

以下问题只报告为 `[WARN]`，不影响退出码，对应需要后续 UI 重构或评估的遗留项：

- 页面/组件中出现 `<scroll-view>`、`overflow: auto/scroll`、或 `height: 100vh` / `calc(100vh - ...)`。
- 页面/组件中出现原生 `<button>` / `<input>` / `<textarea>` / `<checkbox>` / `<radio>` / `<switch>` / `<picker>` / `<slider>` / `<form>`（`AppOptionButton.vue` 已作为允许例外被排除）。
- 页面/组件样式中出现裸 hex、rgba、固定 px/rpx、裸 box-shadow、裸 transition/animation 时长。
- 除 `AppShell.vue` 外的页面/组件重复出现 `env(safe-area-inset-bottom)` padding。
- 页面/组件中出现 `position: fixed` 的浮动操作（`AppPetNavigator.vue` 已作为允许例外被排除）。
- 使用 `useKeyboardAvoidance` 但未渲染 `keyboardSpacerStyle` spacer，或有可编辑 Wot 控件未设置 `:adjust-position="false"`。
- `src/design-system/token-registry.ts` 中缺少 `--app-keyboard-height` / `--app-safe-keyboard-bottom` 等共享 token。

## 6. 当前扫描警告

运行 `pnpm scan:project-ui` 当前输出 3 条 warning：

1. `src/pages/access/access.vue:style:7: fixed viewport height calculation should use runtime metrics and tokens`
   - 原因：`access.vue` 是体验版冻结的未注册页面，仍保留旧的 `min-height: calc(100vh - var(--app-space-48))`。
   - 处理：不作为本次治理任务修复；若未来重新评估访问门 UI，再按 Skill 规则重构。

2. `src/design-system/token-registry.ts: --app-keyboard-height is not registered; add it if the keyboard/safe-area pattern needs a shared token`
   - 原因：当前 `useKeyboardAvoidance` 使用运行时 JS 变量，未暴露为 CSS token。
   - 处理：如后续需要页面级 CSS 使用键盘高度，再通过 `src/design-system/token-registry.ts` 注册。

3. `src/design-system/token-registry.ts: --app-safe-keyboard-bottom is not registered; add it if the keyboard/safe-area pattern needs a shared token`
   - 原因：同理，安全键盘底部 token 尚未定义。
   - 处理：按需注册。

## 7. 验证结果

本次修改完成后执行了以下命令：

```bash
pnpm scan:project-ui        # 通过，3 warnings
pnpm scan:ui-copy           # 通过
pnpm scan:design-tokens     # 通过
pnpm scan:access-control    # 通过
pnpm scan:security-baseline # 通过
pnpm type-check             # 通过
pnpm type-check:strict      # 通过
pnpm build:mp-weixin        # 通过
git diff --check            # 通过
```

所有命令均正常退出，`git status --short` 仅显示本次治理新增/修改的文件：

- 修改：`AGENTS.md`、`docs/AI_CODING_GUIDELINES.md`、`package.json`
- 新增：`.ai/`、`docs/UI_GOVERNANCE.zh-CN.md`、`scripts/scan-project-ui.mjs`
- `dist/` 未被跟踪，未出现在工作树变更中。

## 8. 未来 UI 修复优先级

1. **注册 `--app-keyboard-height` / `--app-safe-keyboard-bottom`**（可选）：如果后续键盘规避需要从 CSS 读取键盘高度，再按 token 流程注册并更新 `useKeyboardAvoidance`；当前 JS 方案工作正常，不强制修复。
2. **显式滚动归属声明**：未来新增页面时应在 checklist 中明确标注“页面滚动”或“内部滚动容器”，避免嵌套滚动。
3. **`access.vue` 视觉重构（如访问门重新启用）**：若产品决定恢复访问门，需按 Skill 重新实现 page-meta/app-shell/useNativeChromeSync、移除旧的 `100vh` 计算、并使用 token。
4. **逐步减少 warnings**：新增页面/组件时应让 `scan:project-ui` 不产生新 warning；遗留 warning 只应在明确允许例外的情况下保留。

## 9. 结论

UI 治理基础设施已建立并验证通过。当前基线处于 **UI_GOVERNANCE_BOOTSTRAPPED_WITH_WARNINGS** 状态：硬失败规则已全部满足，剩余 3 条警告均为冻结遗留项或可延后注册的 token，不影响本次治理完成。
