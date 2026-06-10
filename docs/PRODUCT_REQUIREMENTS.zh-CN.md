# 珊瑚行动 产品需求规范

## 1. 产品定位

珊瑚行动是一个只给两个人使用的私有微信小程序。

它不是公开社交产品，不提供公开发现页，不提供陌生人互动，不提供广场、动态流、评论区或公开分享能力。

核心用途：

- 记录两个人的重要瞬间
- 保存照片、文字、日期和心情
- 作为双人私密回忆空间
- 支持深浅模式和主题色
- 使用云开发保存数据和图片

## 2. 用户范围

本小程序只允许两个固定微信用户使用：

- 我
- 我的女友

当前开发阶段可以临时允许体验成员进入，用于获取 openid。

正式双人私有阶段必须使用云开发数据库安全规则限制为两个 openid。

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

## 4. 隐私规范

不得显示真实姓名、手机号、AppSecret、数据库密钥或任何敏感信息。

不得在前端项目中保存 AppSecret。

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

## 6. 云存储规范

所有上传文件必须放在：

```text
love-entries/main/
```

数据库中只保存云开发返回的 fileID 和必要的展示信息。

上传失败、保存失败、读取失败都必须使用中文提示。

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
- AppSecret
- 自建后端
- 非必要云函数
- 公开社交模块

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
- 你和女友能看到同一批记录
- 非白名单用户不能读写数据库
