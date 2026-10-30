# 家传云谱 · OpenAPI 接口目录草案

**版本**：v0.1.1  
**日期**：2026-10-27  
**状态**：P0 五域路径已评审冻结；其余域仍为目录草案；字段 Schema 开仓后以 `openapi.yaml` 为准，变更需改本文档  
**依据**：产品 v3.1.6；成员专题 §8；《必读文档》；前端 `src/api/*` 域划分  

> 本文只列 **资源与能力清单**，不写完整 Schema。开仓后用 springdoc 生成正式契约，并与本表对账。

### P0 域评审结论（2026-10-27）

以下五域 **路径与能力清单通过评审**，开仓首期必须实现；增删路径须先改本文档再改代码：

| 域 | 章节 | 结论 |
|----|------|------|
| `auth` / `user` | §1 | **冻结** |
| `genealogy` | §2 | **冻结** |
| `member`（邀请码/成员） | §3 | **冻结**（对齐成员专题 §8） |
| `person` / `relationship` | §5 | **冻结**（含 search；import 仍为 P1） |
| `subscription` / `order` / `quota` / 支付回调 | §10 | **冻结**（支付回调验签+幂等；沙箱见《开仓约定与沙箱策略》） |

**非 P0 首期**：§4 协作细改、§6 流程门禁全量、§7 文化、§8 附件、§9 导出归档、§11 锁、§12 日志、§13 ops — 目录保留，开仓第二波再冻结实现顺序（建议：collaborator → lock → workflow → attachment → export/archive → ops）。

---

## 0. 全局约定

| 项 | 约定 |
|----|------|
| Base | `/api`（系统菜单若沿用模板可为 `/api/v3/...`，业务接口统一 `/api/...`） |
| 响应 | `{ code, msg, data }`；成功 `code=200` |
| 鉴权 | Header `Authorization: Bearer <accessToken>`；刷新另议 |
| 分页 | Query：`current`,`size`；`data: { records, total, current, size }` |
| 谱上下文 | 多数业务需 `genealogyId`（路径或查询参数）；服务端校验访问权 |
| 幂等 | 支付回调、建谱、加入成员建议支持 |

**权限图例**：`Public` 未登录；`User` 登录；`Owner` 谱拥有者；`Collab` L2；`Member` L1 只读；`Admin` 运营后台。

---

## 1. 认证与用户 `auth` / `user`

| 方法 | 路径（建议） | 权限 | 说明 | 优先级 |
|------|----------------|------|------|--------|
| POST | `/api/auth/sms/send` | Public | 发送短信验证码；限流 | P0 |
| POST | `/api/auth/register` | Public | 注册；可选 `inviteCode`（成员专题） | P0 |
| POST | `/api/auth/login` | Public | 登录；返回 token / refreshToken | P0 |
| POST | `/api/auth/token/refresh` | Public | 刷新令牌 | P0 |
| POST | `/api/auth/logout` | User | 登出作废 | P0 |
| POST | `/api/auth/password/reset` | Public | 重置密码 | P0 |
| GET | `/api/user/info` | User | 当前用户；含角色、租户摘要 | P0 |
| PUT | `/api/user/profile` | User | 更新昵称等 | P1 |

对齐前端：`src/api/auth.ts`。

---

## 2. 族谱 `genealogy`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/list` | User | 我的族谱；`membership`: owner/collaborator/member；`genealogyNo` | P0 |
| POST | `/api/genealogy` | User | 创建；校验自建名额与订阅；自动生成邀请码 | P0 |
| GET | `/api/genealogy/{id}` | 可访问者 | 详情 | P0 |
| PUT | `/api/genealogy/{id}` | Owner | 编辑基础信息 | P0 |
| POST | `/api/genealogy/{id}/trash` | Owner | 移入回收站 | P0 |
| POST | `/api/genealogy/{id}/restore` | Owner | 恢复；校验额度 | P0 |
| DELETE | `/api/genealogy/{id}` | Owner | 回收站内彻底删除；返还额度 | P0 |
| GET | `/api/genealogy/trash` | User | 回收站列表 | P0 |

---

## 3. 族谱成员与邀请码 `member`（专题）

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/invite-codes/preview` | Public | `?code=` 预览谱名/堂号（脱敏） | P0 |
| POST | `/api/genealogy/members/join` | User | `{ code }` 加入 L1 | P0 |
| GET | `/api/genealogy/{id}/invite-code` | Owner | 当前有效码 | P0 |
| POST | `/api/genealogy/{id}/invite-code/rotate` | Owner | 重置 | P0 |
| GET | `/api/genealogy/{id}/members` | Owner | 成员列表 | P1 |
| DELETE | `/api/genealogy/{id}/members/{userId}` | Owner | 移除成员 | P1 |
| POST | `/api/genealogy/{id}/members/leave` | Member | 自行退出 | P1 |

---

## 4. 协作 `collaborator`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/{id}/collaborators` | Owner/可见角色 | 列表；占席位数 | P0 |
| POST | `/api/genealogy/{id}/collaborators` | Owner | 邀请采编等；占 `max_collaborators` | P0 |
| PUT | `/api/genealogy/{id}/collaborators/{userId}` | Owner | 改角色 / 分支范围 | P1 |
| DELETE | `/api/genealogy/{id}/collaborators/{userId}` | Owner | 移除协作；默认保留 L1 成员 | P0 |

---

## 5. 人物与关系 `person` / `relationship`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/{id}/persons` | 可访问者 | 分页列表；成员只读 | P0 |
| GET | `/api/genealogy/{id}/persons/search` | 可访问者 | 姓名/字号/字辈等；≤300ms 目标 | P0 |
| POST | `/api/genealogy/{id}/persons` | Collab+额度 | 新增；扣人物额度 | P0 |
| GET | `/api/genealogy/{id}/persons/{personId}` | 可访问者 | 详情；在世脱敏 | P0 |
| PUT | `/api/genealogy/{id}/persons/{personId}` | Collab | 编辑；流程期可能重置 review_status | P0 |
| DELETE | `/api/genealogy/{id}/persons/{personId}` | Collab | 软删进回收逻辑 | P0 |
| GET | `/api/genealogy/{id}/relationships` | 可访问者 | 关系列表 / 图谱数据 | P0 |
| POST | `/api/genealogy/{id}/relationships` | Collab | 新增关系；关联人 review 重置规则 | P0 |
| PUT | `/api/genealogy/{id}/relationships/{rid}` | Collab | 修改 | P0 |
| DELETE | `/api/genealogy/{id}/relationships/{rid}` | Collab | 删除 | P0 |
| POST | `/api/genealogy/{id}/persons/import` | Collab+额度 | Excel 批量导入任务 | P1 |

---

## 6. 修谱项目与流程 `project` / `workflow`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/{id}/projects` | 可访问者 | 项目列表 | P0 |
| POST | `/api/genealogy/{id}/projects` | Owner/主编 | 启动初始/续修；额度门禁 | P0 |
| GET | `/api/genealogy/{id}/projects/{pid}` | 可访问者 | 详情含 current_stage、layout_dirty | P0 |
| PUT | `/api/genealogy/{id}/projects/{pid}` | 授权角色 | 团队配置等 | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/advance` | 授权角色 | 推进阶段；服务端门禁 | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/rollback` | 授权角色 | 回退；解锁规则 | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/review/*` | 校勘/拥有者 | 审核批注、终审放行（标准模式） | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/layout/lock` | 授权 | 版式锁定 | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/layout/confirm-dirty` | 简易模式 | 活数据变更一键确认 | P0 |

阶段取值与五步规则严格对齐产品 §0.6 / §1.4，禁止六步遗留。

---

## 7. 章节与家族文化 `chapter` / `culture`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| CRUD | `/api/genealogy/{id}/chapters` | 读写分权 | 谱书章节；项目级/族谱级 | P0 |
| CRUD | `/api/genealogy/{id}/family-events` | 读写分权 | 大事记 | P1 |
| CRUD | `/api/genealogy/{id}/family-rules` | 读写分权 | 家规家训 | P1 |

---

## 8. 附件 `attachment`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| POST | `/api/genealogy/{id}/attachments/upload-token` | Collab+存储额度 | 预签名 | P0 |
| POST | `/api/genealogy/{id}/attachments/confirm` | Collab | 确认入库写元数据 | P0 |
| GET | `/api/genealogy/{id}/attachments` | 可访问者 | 列表；成员只预览 | P0 |
| DELETE | `/api/genealogy/{id}/attachments/{aid}` | Collab | 删；回收站策略 | P0 |

---

## 9. 导出、归档、分享 `export` / `archive` / `share`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| POST | `/api/genealogy/{id}/projects/{pid}/pdf` | 授权+套餐 | 创建 PDF 任务；layout_dirty=1 禁止 | P0 |
| GET | `/api/tasks/{taskId}` | User | 查询异步任务状态 | P0 |
| POST | `/api/genealogy/{id}/projects/{pid}/archive` | 授权 | 发布归档；写快照 | P0 |
| GET | `/api/genealogy/{id}/versions` | 可访问者 | 版本列表 | P0 |
| GET | `/api/genealogy/{id}/versions/{vid}` | 可访问者 | 快照元信息 | P1 |
| POST | `/api/genealogy/{id}/share-links` | Owner/授权 | 只读分享；返回 token | P0 |
| GET | `/api/s/{token}` 或 `/api/share/{token}` | Public | 分享只读数据 | P0 |
| DELETE | `/api/genealogy/{id}/share-links/{sid}` | Owner | 撤销 | P1 |

---

## 10. 订阅、订单、额度 `subscription`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/subscription/summary` | User | 套餐、额度、过期状态 | P0 |
| GET | `/api/subscription/plans` | User | 套餐/扩容包 | P0 |
| POST | `/api/orders` | User | 下单 | P0 |
| GET | `/api/orders` | User | 我的订单 | P0 |
| GET | `/api/orders/{orderNo}` | User | 订单详情/支付状态 | P0 |
| POST | `/api/payments/wechat/notify` | Public | 微信回调；验签幂等 | P0 |
| POST | `/api/payments/alipay/notify` | Public | 支付宝回调 | P0 |
| GET | `/api/quota/transactions` | User | 额度流水 | P0 |

写路径统一走「订阅守卫」等价后端校验（过期 / 额度用尽分场景，§1.5）。

---

## 11. 协作锁 `lock`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| POST | `/api/locks/acquire` | Collab | 抢锁 | P0 |
| POST | `/api/locks/heartbeat` | 持锁人 | 续租 | P0 |
| POST | `/api/locks/release` | 持锁人 | 释放 | P0 |
| POST | `/api/locks/force-release` | Owner/主编 | 强制接管；审计 | P1 |
| GET | `/api/locks` | 可访问者 | 查询资源锁状态 | P0 |

Body 含 `resourceType` + `resourceId`（person/chapter/…）。

---

## 12. 操作日志 `operation-log`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/genealogy/{id}/operation-logs` | Owner/授权 | 分页审计 | P1 |

---

## 13. 运营后台 `ops`

| 方法 | 路径 | 权限 | 说明 | 优先级 |
|------|------|------|------|--------|
| GET | `/api/ops/dashboard` | Admin | 工作台摘要 | P1 |
| GET | `/api/ops/users` | Admin | 用户列表 | P0 |
| POST | `/api/ops/users/{id}/freeze` | Admin | 冻结 | P0 |
| POST | `/api/ops/users/{id}/unfreeze` | Admin | 解冻 | P0 |
| GET | `/api/ops/orders` | Admin | 全平台订单 | P0 |
| GET | `/api/ops/audit-logs` | Admin | 审计 | P0 |
| GET | `/api/v3/system/menus/simple` | User/Admin | 若继续后端菜单模式 | P1 |

---

## 14. 开仓后交付物

1. `openapi/openapi.yaml`（或分模块 yaml）与本目录表 **逐条可对账**。  
2. 错误码表 `docs/backend/error-codes.md`。  
3. 前端关闭对应 Mock 的 checklist（按域）。

---

## 15. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-10-27 | 初稿：按域列出 MVP 优先接口目录 |
| v0.1.1 | 2026-10-27 | P0 五域（auth/genealogy/member/person/subscription）路径评审冻结 |
