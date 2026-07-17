# 小珊的树洞 产品需求规范

## 1. 产品定位

小珊的树洞当前仍保持 Stage 1 私有微信小程序体验：已新增状态展示型访问入口和业务页访问守卫，但不新增密码输入、配对码输入、邀请、绑定、伴侣管理或公开社交能力。

Phase 1 只升级仓库中的云开发安全基线：规则样例使用两人 OpenID 白名单占位符。真实 OpenID 只能在云开发控制台或私有部署通道配置，不得提交到公开仓库。

当前访问控制阶段只增加前端访问入口外壳、业务页路由守卫和运行时错误安全提示：访问页仅展示检查中、已授权跳转、拒绝访问、账号停用/撤销、配置缺失、需要配对和重试状态，不提供密码 UI、配对码输入 UI，也不调用 `verifyPairingCode`。

它不是公开社交产品，不提供公开发现页，不提供陌生人互动，不提供广场、动态流、评论区或公开分享能力。

核心用途：

- 记录两个人的重要瞬间
- 保存照片、文字、日期和心情
- 作为双人私密回忆空间
- 支持深浅模式和主题色
- 使用云开发保存数据和图片

## 2. 用户范围

Phase 1 云开发访问基线只允许两个固定微信用户访问：

- 拥有者 OpenID：`OWNER_OPENID`
- 伴侣 OpenID：`PARTNER_OPENID`

仓库提交的规则文件只能保留上述占位符。真实 OpenID、配对码、密码、AppSecret、云开发密钥、token 或其他秘密值不得提交到公开仓库。

`love_entries` 的读取、新建、更新和删除都必须限制为两人 OpenID 白名单；新建还必须要求 `doc.coupleId == 'main'`。云存储读写必须限制为同一两人白名单和 `love-entries/main/` 路径。

当前阶段仍不得在应用端新增访问门 UI、密码输入、配对码流程、邀请流程或账号管理页面。

后端访问控制云函数必须只从云开发服务端上下文读取调用者 OpenID，不得信任客户端传入的 OpenID。

## 3. 语言规范

所有用户可见文字必须使用简体中文。

禁止出现英文用户界面文案，包括但不限于：

- Settings
- Timeline
- Write a memory
- Private photos
- Save memory
- Appearance mode
- Follow system
- Light
- Dark
- Romantic palette
- Environment
- Not configured

允许保留的英文仅限：

- 技术文件名
- 代码变量名
- 依赖包名
- 必要的技术产品名

面向用户的界面中，CloudBase 应优先显示为“云开发”。

## 3.1 视觉与主题规范

当前阶段已经建立全局设计令牌系统。页面和组件不得直接新增硬编码颜色、间距、圆角、阴影、字号、透明度或动效时长。

主题能力仅包括：

- 外观模式：跟随系统、浅色、深色
- 主题配色：策展配色，不支持任意颜色输入
- 界面密度：舒适、紧凑
- 字号大小：标准、偏大

视觉方向应保持私密、温柔、可爱、手绘感、干净和轻盈。不得把 Coral 解释为海洋或珊瑚礁主题。

## 3.2 非传统导航策略

本项目不使用传统底部 tabBar，也不使用微信 custom-tab-bar。页面路由仍通过 `src/pages.json` 登记，页面跳转仍使用 `uni.navigateTo`、`uni.redirectTo`、`uni.navigateBack`。

后续导航体验推荐用 Vue 组件方式实现小宠物导航，不改变现有页面必须 `page-meta + useNativeChromeSync + app-shell` 的结构。

## 3.3 小宠物导航规范

小宠物是 Stage 1 owner-only 阶段的小小引导员，用于引导拥有者进入：

- 写回忆
- 小日子
- 小歌单
- 小约定
- 小档案
- 小纸样本

小宠物必须遵守以下边界：

- 不代表女友账号
- 不暗示双方在线
- 不是聊天机器人
- 不自动读取或改写用户数据
- 不新增 partner access、邀请、绑定、分享、评论或公开能力
- 不新增女友 / 伴侣访问、账号体系或登录页

后续推荐组件为：

```text
src/components/AppPetNavigator.vue
```

Stage 1 小宠物只在首页挂载。其他页面不挂载 `AppPetNavigator`，避免页面栈叠加和返回体验异常。小宠物菜单负责从首页进入写回忆、小日子、小歌单、小约定、小档案和小纸样本；不要第一版就强行改 `AppShell`。如后续确认需要全页面常驻，再评估 `AppShell` 内置可选插槽或可选组件。

AppPetNavigator 的菜单项必须使用中文文案，菜单动作优先使用 Wot UI `wd-button`，菜单弹层优先使用 Wot UI `wd-popup` 或现有 Wot UI 组件。不得使用原生 `button`、`input`、`textarea`、`picker`、`checkbox`、`form` 作为主要业务控件；不得直接调用 `wx.cloud`；不得新增 store，除非后续实现确实需要并单独说明。

## 3.4 小宠物视觉与微动画边界

小宠物视觉允许：

- 纸团感
- 小便签感
- 红蓝线条小人感
- 手绘短线
- 轻微眨眼 / 呼吸 / 点头
- 中文短句引导

小宠物视觉禁止：

- 海洋、珊瑚礁、贝壳、珍珠
- 复杂动物 IP
- 儿童卡通
- 商业吉祥物
- 3D 宠物
- 大量贴纸
- 大面积动画

微动画允许：

- 小宠物轻微呼吸
- 菜单轻柔展开
- 卡片轻压
- 完成后轻轻收好
- 小勾选轻柔反馈

微动画禁止：

- 页面级炫技过场
- 高频循环动画
- 粒子特效
- 强烈弹跳
- 大面积渐变动画
- 影响阅读和点击的装饰动画

样式必须继续遵守设计令牌系统：动画时长使用已登记 motion token，不写 raw transition duration，不写 raw animation duration，不写固定 rpx / px，不写 raw hex，不写 `rgba()`，不写直接 `box-shadow`，不新增未登记 `--app-*` token。

## 3.5 可爱俏皮文案分级

文案可以更可爱，但不能所有场景都过度卖萌。

可更俏皮的场景：

- 首页引导
- 小宠物菜单
- 空态
- 完成反馈
- 点歌说明
- 事项说明

必须克制清楚的场景：

- 删除确认
- 错误提示
- 权限失败
- 云开发失败
- 保存失败
- 数据不可恢复提示

推荐文案示例：

- 想去哪儿呀？（第一版菜单标题；名称确认后再评估是否替换）
- 今天想把哪件小事收好？
- 她点的歌，先放进小歌单。
- 小约定慢慢勾。
- 已经轻轻收好。
- 这里暂时没读到，请稍后再试。
- 这会删除这条记录。

第一版小宠物名称待定。小珊可以作为产品名（“小珊的树洞”）的一部分出现在用户可见文案里，但完整真实姓名仍不得出现。

禁止文案示例：

- 小珊哭哭
- 任务被你干掉啦
- 数据飞走咯
- 删除了就再也见不到它啦呜呜
- 含英文的按钮、标题、placeholder、toast、modal、empty state、loading、error、tab、tag、label

## 4. 隐私规范

不得显示真实姓名、手机号、真实 OpenID、配对码、密码、小程序密钥、数据库密钥、token 或任何敏感信息。

不得在前端项目中保存小程序密钥。

不得把真实 OpenID、配对码、密码、AppSecret、云开发密钥、token 或其他秘密值提交到公开仓库；真实云开发规则必须在云开发控制台或私有部署通道应用。

不得把私密照片设置为公开内容。

不得添加公开分享、公开动态、公开评论、陌生人访问等能力。

## 5. 数据规范

数据库集合固定为：

```text
love_entries
```

每条记录必须包含：

- coupleId: "main"
- title
- content
- occurredAt
- mood
- files
- createdAt
- updatedAt

所有新增记录必须写入 `coupleId: "main"`。

首页列表必须按 `createdAt` 倒序排列。

### 5.1 她的小档案 / 小线索本

Stage 1 允许在 `love_entries` 单集合内增加 `kind: "memo"` 记录，用于悄悄收好她喜欢的东西、小档案、避雷、礼物线索、重要日子和随手小线索。

小线索记录必须继续写入 `coupleId: "main"`，不得新增 collection、cloud function、公开分享、伴侣访问或图片上传能力。

小线索不属于首页回忆时间线，也不属于小歌单或小约定列表。

## 6. 云存储规范

所有上传文件必须放在：

```text
love-entries/main/
```

数据库中只保存云开发返回的 fileID 和必要的展示信息。

上传失败、保存失败、读取失败都必须使用中文提示。

## 6.1 后端访问控制基础

云函数固定使用 `access-control`。Phase 3 前端只通过访问页和业务页守卫调用 `getAccessStatus`，在授权确认前不得加载私有业务数据。

云函数必须支持：

- `getAccessStatus`
- `verifyPairingCode`

云函数配置必须私下保存在云开发环境变量或等价私有配置中，不得提交到公开仓库。配置模型必须包含：

- coupleId: "main"
- 拥有者 OpenID 槽位
- 伴侣 OpenID 槽位
- 最多两个 OpenID
- owner / partner 角色标签
- active / disabled / revoked 状态
- 可选配对码哈希校验

前端只能通过 `src/services/access-control.ts` 调用访问控制能力，并且该服务必须继续通过 `src/services/cloudbase.ts` 的受控封装调用云函数。页面、组件、store 和 composable 不得直接调用 `wx.cloud.callFunction`。

业务页必须在读取、创建、更新、删除记录或获取文件临时链接前先通过 `useAccessGuard().requireAccess()`。访问页在本阶段不得调用 `verifyPairingCode`。

访问控制错误提示必须保持安全、中文、克制：不得展示 OpenID、环境变量名、函数日志原文、异常栈、配对码哈希/盐或服务端私有配置。

## 7. UI 风格规范

整体风格：

- 温柔
- 私密
- 简洁
- 可爱但不幼稚
- 手绘感
- 红蓝小人视觉体系
- 浅色暖白背景优先

禁止：

- 珊瑚礁
- 海洋主题
- 珍珠
- 贝壳
- 玻璃盒子
- 过度商业化
- 过度 3D
- 大量英文

## 8. 技术约束

必须继续使用：

- UniApp CLI
- Vue 3
- TypeScript
- Pinia
- Wot UI
- SCSS / CSS Variables
- 云开发

禁止引入：

- UnoCSS
- 小程序密钥
- 自建后端
- 非必要云函数
- 公开社交模块
- 传统底部 tabBar
- 微信 custom-tab-bar

## 9. 验收标准

上线体验版前必须满足：

- 所有页面用户可见文案为中文
- 首页、创建页、详情页、设置页无英文
- 云开发环境 ID 正常读取
- 可以新增记录
- 可以读取记录
- 可以上传图片
- 可以显示图片
- 记录写入 love_entries
- 图片写入 love-entries/main/
- 新记录包含 coupleId: "main"
- 云开发数据库规则只允许 `OWNER_OPENID` / `PARTNER_OPENID` 对应的真实两人白名单读写
- 云开发数据库新增规则必须要求 coupleId: "main"
- 云存储规则只允许真实两人白名单读写 love-entries/main/
- 访问控制云函数只从服务端上下文读取 OpenID
- 页面和组件不直接调用 wx.cloud.callFunction
- 非白名单用户不能读写数据库
- 未新增访问门 UI、密码输入、配对码流程、账号体系、公开分享、评论、公开 feed
- 未新增 CloudBase collection、cloud functions、AppSecret
- 未提交真实 OpenID、配对码、密码、AppSecret、云开发密钥、token 或其他秘密值
- 未新增 UnoCSS
- 未新增传统 tabBar 或微信 custom-tab-bar
- 小宠物导航仍遵守 AppShell、page-meta、useNativeChromeSync、Wot UI、token 规则
