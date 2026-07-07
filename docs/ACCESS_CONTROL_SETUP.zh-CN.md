> **⚠️ 访问控制启动加固已冻结**
>
> 本项目已切换为仅用于体验版构建的微信小程序，仅由所有者和伴侣使用。`pages/access/access` 访问页和 `useAccessGuard` 业务页守卫已被禁用，业务页面现在可直接打开，不再调用访问校验云函数。
>
> Phase 5B/6 及面向公开发布的访问控制、配对码、社交/账号/安全流程已停止开发。
>
> 以下内容为源代码历史与技术参考，实际运行时不再生效；CloudBase CRUD、主题系统、Wot UI 及视觉设计保持原样。

# 私有访问控制云函数配置说明

本文件只记录公开仓库可以保存的配置模型和手工步骤。不要在本仓库提交真实 OpenID、配对码、密码、AppSecret、云开发密钥、token 或其他秘密值。

## 范围

Phase 2 提供后端访问控制基础，Phase 3 在此前基础上增加状态展示型访问入口和业务页访问守卫，Phase 4 补充运行时错误安全提示与手工 QA 清单：

- 云函数源码：`cloudfunctions/access-control`
- 前端服务边界：`src/services/access-control.ts`
- 类型定义：`src/types/access-control.ts`
- 访问页：`src/pages/access/access.vue`
- 访问状态 store：`src/stores/access.ts`
- 业务页守卫：`src/composables/useAccessGuard.ts`
- 静态扫描：`pnpm scan:security-baseline` 和 `pnpm scan:access-control`
- 运行时 QA：`docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md`

当前访问页只展示检查中、已授权跳转、拒绝访问、账号停用/撤销、配置缺失、需要配对和重试状态。不新增密码输入，不新增配对码输入 UI，不从页面调用 `verifyPairingCode`。

## 云函数

在云开发控制台或私有部署通道中创建 Event Function：

```text
函数名: access-control
运行时: Nodejs18.15
函数类型: Event Function
函数根目录: cloudfunctions
```

源码中的 `cloudfunctions/access-control/index.js` 使用 `cloud.getWXContext().OPENID` 获取调用者身份。客户端不得传入 OpenID，云函数也不会信任客户端传入的 OpenID。

## 私有环境变量

在云函数环境变量中配置：

```text
ACCESS_CONTROL_COUPLE_ID=main
ACCESS_CONTROL_OWNER_OPENID=<PRIVATE_OWNER_OPENID>
ACCESS_CONTROL_PARTNER_OPENID=<PRIVATE_PARTNER_OPENID>
ACCESS_CONTROL_OWNER_STATUS=active
ACCESS_CONTROL_PARTNER_STATUS=active
```

规则：

- 只能配置两个 OpenID 槽位：owner 和 partner。
- 真实 OpenID 只能保存在云开发控制台或私有部署通道。
- 状态只允许 `active`、`disabled`、`revoked`。
- 禁用或撤销用户时，优先把对应状态改为 `disabled` 或 `revoked`，不要把真实值写回仓库。

## 可选配对码

配对码不允许明文提交。需要启用时，只在云函数环境变量中配置哈希和盐：

```text
ACCESS_CONTROL_PAIRING_ENABLED=true
ACCESS_CONTROL_PAIRING_REQUIRED=true
ACCESS_CONTROL_PAIRING_CODE_HASH=<PRIVATE_HMAC_SHA256_HEX>
ACCESS_CONTROL_PAIRING_CODE_SALT=<PRIVATE_PAIRING_SALT>
```

Phase 3 访问页只显示“需要配对”状态，不提供配对码输入。开启 `ACCESS_CONTROL_PAIRING_REQUIRED` 会让未完成私有配对校验的访问者停留在提示状态，直到后续阶段接入配对码 UI 或你在私有后端完成等价处理。

可以在私有终端中生成哈希，命令只读取本地环境变量：

```bash
PRIVATE_PAIRING_CODE="<PRIVATE_PAIRING_CODE>" PRIVATE_PAIRING_CODE_SALT="<PRIVATE_PAIRING_SALT>" node -e "const crypto=require('crypto'); console.log(crypto.createHmac('sha256', process.env.PRIVATE_PAIRING_CODE_SALT).update(process.env.PRIVATE_PAIRING_CODE).digest('hex'))"
```

不要把生成命令中的真实输入值、输出 hash、salt 或配对码提交到仓库。

## 手工检查

部署或更新云函数后，在云开发控制台确认：

- `access-control` 已创建为 Event Function。
- 运行时为 `Nodejs18.15`，或明确记录私有环境中的实际运行时。
- 两个真实 OpenID 已配置在 owner / partner 槽位。
- 没有第三个允许访问的 OpenID。
- `love_entries` 数据库规则仍使用两人白名单，新增要求 `doc.coupleId == 'main'`。
- 云存储规则仍限制为两人白名单和 `love-entries/main/`。
- 公开仓库中仍只有 `OWNER_OPENID`、`PARTNER_OPENID` 或环境变量名。
- 按 `docs/ACCESS_CONTROL_RUNTIME_QA.zh-CN.md` 完成微信开发者工具和真机运行时验证。
