/**
 * API 接口类型定义模块
 *
 * 提供所有后端接口的类型定义
 *
 * ## 主要功能
 *
 * - 通用类型（分页参数、响应结构等）
 * - 认证类型（登录、用户信息等）
 * - 系统管理类型（用户、角色等）
 * - 全局命名空间声明
 *
 * ## 使用场景
 *
 * - API 请求参数类型约束
 * - API 响应数据类型定义
 * - 接口文档类型同步
 *
 * ## 注意事项
 *
 * - 在 .vue 文件使用需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 * - 使用全局命名空间，无需导入即可使用
 *
 * ## 使用方式
 *
 * ```typescript
 * const params: Api.Auth.LoginParams = { userName: 'admin', password: '123456' }
 * const response: Api.Auth.UserInfo = await fetchUserInfo()
 * ```
 *
 * @module types/api/api
 * @author 家传云谱
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录方式 */
    type LoginType = 'password' | 'sms'

    /** 发送验证码 */
    interface SendSmsParams {
      phone: string
      /** login | register | reset */
      scene?: 'login' | 'register' | 'reset'
    }

    /** 登录参数 */
    interface LoginParams {
      /** 兼容旧字段：账号/用户名 */
      userName?: string
      password?: string
      phone?: string
      smsCode?: string
      loginType?: LoginType
    }

    /** 注册参数 */
    interface RegisterParams {
      phone: string
      smsCode: string
      password: string
      /** 族谱成员邀请码（选填）；≠ 协作邀请 */
      inviteCode?: string
    }

    /** 重置密码 */
    interface ResetPasswordParams {
      phone: string
      smsCode: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      phone?: string
      avatar?: string
      nickName?: string
    }
  }

  /** 族谱（Sprint 2 / Sprint M · v3.1.6） */
  namespace Genealogy {
    type Mode = 'standard' | 'simple'
    type Privacy = 1 | 2 | 3
    /** 在世脱敏：1严格 2中度 3完整（仅拥有者查看时完整生效） */
    type LivingDesensitize = 1 | 2 | 3
    /** 内部五步：1启动 2编排 3校对 4智能排版 5归档 */
    type Stage = 1 | 2 | 3 | 4 | 5
    /** 当前用户相对该谱的身份 · 成员专题 v0.1 */
    type Membership = 'owner' | 'collaborator' | 'member'

    interface Item {
      id: number
      /**
       * 对外族谱编号（给人看 / 客服报号），非主键、非成员邀请码
       * 例：JP-001001；缺省由 id 回填
       */
      genealogyNo?: string
      name: string
      /** 本族姓氏，录入人物时自动带入 */
      surname?: string
      hallName?: string
      ancestor?: string
      privacy: Privacy
      /** 在世人物脱敏级别，默认 1 */
      livingDesensitize?: LivingDesensitize
      mode: Mode
      personCount: number
      attachmentCount: number
      projectCount: number
      /** 当前修谱项目已到达阶段（1–5） */
      currentStage: Stage
      /** 2 = 已按 v3.1 五步落库；缺省则读时迁移 */
      stageSchema?: 2
      /** 版式脏标记：版式锁定后活数据变更置 1 */
      layoutDirty?: 0 | 1
      /** 拥有者用户 ID；缺省视为当前 Mock 用户 */
      ownerUserId?: number
      /** 列表/详情附带：当前用户身份 */
      membership?: Membership
      createdAt: string
      updatedAt?: string
      /** 软删除时间，有值表示在回收站 */
      deletedAt?: string | null
    }

    interface CreateParams {
      name: string
      /** 本族姓氏 */
      surname: string
      hallName?: string
      ancestor?: string
      privacy: Privacy
      livingDesensitize?: LivingDesensitize
      mode: Mode
    }

    interface UpdateParams {
      name?: string
      surname?: string
      hallName?: string
      ancestor?: string
      privacy?: Privacy
      livingDesensitize?: LivingDesensitize
      /** 仅允许 simple → standard 升级 */
      mode?: Mode
    }

    /** 立项组编：采编席位 */
    interface ProjectEditorSeat {
      phone: string
      displayName: string
    }

    interface ProjectInfo {
      name: string
      yearGanZhi: string
      yearAd: number
      /** 1=初始修谱 2=续修(MVP隐藏) */
      projectType: 1 | 2
      fanliHtml: string
      /**
       * @deprecated 兼容旧 Mock；仅镜像本期 editors 手机号，不代表长久协作名单
       */
      collabPhones: string[]
      /** 主编是否由拥有者兼任（MVP 默认 true；独立主编 V1.5） */
      chiefEditorByOwner?: boolean
      chiefEditorName?: string
      chiefEditorPhone?: string
      /**
       * 本期修谱组编名录（项目级、临时）：归档/换期后随项目留存，不替代 Collaborator 长久权限
       */
      editors?: ProjectEditorSeat[]
      /**
       * 用户在「项目启动」页显式创建后为 true。
       * 建谱时仅占位草稿（initialized=false），不展示期次卡片。
       */
      initialized?: boolean
    }

    interface ListParams {
      current?: number
      size?: number
      keyword?: string
      /** active=正常列表 trash=回收站 */
      scope?: 'active' | 'trash'
    }

    /** 字辈设置（族谱级） */
    interface GenerationConfig {
      poem: string
      startGen: number
    }
  }

  /**
   * 族谱成员（只读归属）· 家传云谱·族谱成员与邀请码设计说明_v0.1
   * ≠ Collaborator 协作；≠ Project.editors 本期组编
   */
  namespace GenealogyMember {
    type JoinSource = 'register_invite' | 'manual_code' | 'owner_add'
    type MemberStatus = 1 | 2 | 3

    interface Item {
      id: number
      genealogyId: number
      userId: number
      displayName?: string
      status: MemberStatus
      joinSource: JoinSource
      inviteCodeUsed?: string
      joinedAt: string
      leftAt?: string
      createdAt: string
      updatedAt: string
    }

    interface InviteCode {
      id: number
      genealogyId: number
      code: string
      status: 0 | 1
      maxUses?: number | null
      usedCount: number
      expireAt?: string | null
      createdBy: number
      createdAt: string
      revokedAt?: string
    }

    interface InvitePreview {
      genealogyId: number
      name: string
      surname?: string
      hallName?: string
      code: string
    }

    interface JoinParams {
      code: string
    }
  }

  /**
   * 协作成员（§1.7.16 / §3.4 页面 12）
   * MVP 仅 owner + editor；其余角色 V1.5
   */
  namespace Collaborator {
    type Role = 'owner' | 'chief_editor' | 'editor' | 'reviewer' | 'branch_manager' | 'viewer'
    /** 0待接受 1已加入 2已拒绝 3已过期 4已移除 */
    type InviteStatus = 0 | 1 | 2 | 3 | 4

    interface Item {
      id: number
      genealogyId: number
      userId: number
      /** 展示用 */
      displayName: string
      phone: string
      role: Role
      inviteStatus: InviteStatus
      inviteToken?: string
      invitedBy?: number
      invitedAt?: string
      joinedAt?: string
      expireAt?: string
      createdAt: string
      updatedAt: string
    }

    interface InviteParams {
      phone: string
      displayName?: string
      /** MVP 固定 editor */
      role?: 'editor'
    }

    interface ListResult {
      list: Item[]
      /** 套餐协作人数上限（不含拥有者） */
      maxCollaborators: number
      /** 已占用席位：待接受 + 已加入（不含拥有者） */
      usedSeats: number
    }

    /** 被邀请人待办 · 产品 §3.4 页面 14 */
    interface MyInviteItem {
      id: number
      genealogyId: number
      genealogyName: string
      genealogyNo?: string
      surname?: string
      role: Role
      inviteStatus: InviteStatus
      inviteToken?: string
      invitedBy?: number
      inviterName: string
      invitedAt?: string
      expireAt?: string
    }
  }

  /** 家规家训（§1.7.8 / §3.4 页面 10） */
  namespace FamilyRule {
    type Category = 'zuxun' | 'jiagui' | 'jiaxun' | 'zugui' | 'jielv'

    interface Item {
      id: number
      genealogyId: number
      title: string
      category: Category
      content: string
      origin?: string
      sortOrder: number
      createdBy: number
      updatedBy: number
      createdAt: string
      updatedAt: string
      deletedAt?: string | null
    }

    interface FormParams {
      title: string
      category: Category
      content: string
      origin?: string
      sortOrder?: number
    }
  }

  /** 家族大事记（§1.7.7 / §3.4 页面 10） */
  namespace FamilyEvent {
    type EventType =
      | 'xiupu'
      | 'jisi'
      | 'qianxi'
      | 'hunjia'
      | 'sangzang'
      | 'kekao'
      | 'fengdeng'
      | 'zaihuang'
      | 'jianci'
      | 'other'

    interface Item {
      id: number
      genealogyId: number
      eventDate: string
      eventType: EventType
      title: string
      description?: string
      relatedPersonIds?: number[]
      relatedAttachmentIds?: number[]
      sortOrder: number
      createdBy: number
      updatedBy: number
      createdAt: string
      updatedAt: string
      deletedAt?: string | null
    }

    interface FormParams {
      eventDate: string
      eventType: EventType
      title: string
      description?: string
      relatedPersonIds?: number[]
      sortOrder?: number
    }

    interface ListParams {
      genealogyId: number
      eventType?: EventType | ''
      keyword?: string
    }
  }

  /**
   * 族内只读分享链接（§1.8.6 / 模块 M）
   */
  namespace ShareLink {
    type ExpirePreset = 7 | 30 | 90 | 0

    interface Item {
      id: number
      genealogyId: number
      token: string
      /** 0=永久；否则为过期时间 ISO */
      expireAt: string | null
      revokedAt?: string | null
      createdBy: number
      createdAt: string
      accessCount: number
      lastAccessAt?: string
    }

    interface CreateParams {
      genealogyId: number
      /** 天数：7/30/90；0=永久 */
      expireDays: ExpirePreset
    }

    interface PublicView {
      genealogy: Pick<
        Genealogy.Item,
        'id' | 'name' | 'surname' | 'hallName' | 'ancestor' | 'privacy' | 'livingDesensitize'
      >
      persons: Array<{
        id: number
        personNo: string
        generation: number
        nameWei: string
        gender: Person.Gender
        birthDate?: string
        deathDate?: string
        isAlive: 0 | 1
        zibei?: string
      }>
      rules: FamilyRule.Item[]
      events: FamilyEvent.Item[]
      readonly: true
    }
  }

  /**
   * 附件 / 资料档案（§1.7.14 / §3.4 页面 11）
   * 回收站内仍占用存储额度，彻底删除或期满才释放
   */
  namespace Attachment {
    type FileType = 'image' | 'pdf' | 'doc' | 'scan' | 'other'
    type AttachmentType =
      | 'person_photo'
      | 'old_scan'
      | 'tablet'
      | 'tomb_map'
      | 'document'
      | 'family_album'
      | 'other'

    interface Item {
      id: number
      genealogyId: number
      projectId?: number | null
      fileName: string
      fileType: FileType
      fileExt: string
      /** 字节 */
      fileSize: number
      storagePath: string
      thumbnailPath?: string
      attachmentType: AttachmentType
      metadata?: Record<string, unknown>
      bindPersonId?: number | null
      uploadUserId: number
      uploaderName?: string
      /** Mock：小文件 dataURL，用于预览/下载 */
      contentDataUrl?: string
      createdAt: string
      updatedAt: string
      /** 软删除时间，有值表示在回收站 */
      deletedAt?: string | null
    }

    interface ListParams {
      genealogyId: number
      current?: number
      size?: number
      keyword?: string
      attachmentType?: AttachmentType | ''
      fileType?: FileType | ''
      /** active=正常 trash=回收站 */
      scope?: 'active' | 'trash'
    }

    interface UploadParams {
      genealogyId: number
      attachmentType: AttachmentType
      projectId?: number | null
      bindPersonId?: number | null
      fileName: string
      fileExt: string
      fileSize: number
      mimeType?: string
      contentDataUrl?: string
      thumbnailPath?: string
    }
  }

  /**
   * 操作日志（§1.7.17 / §3.4 页面 12）
   * 永久留存，不可删除、不可篡改
   */
  namespace OperationLog {
    /** data/flow/collab/setting/file/admin；页面另列 AI，归入 ai */
    type Category = 'data' | 'flow' | 'collab' | 'setting' | 'file' | 'admin' | 'ai'

    interface Item {
      id: number
      genealogyId?: number | null
      projectId?: number | null
      operatorUserId?: number | null
      operatorName?: string
      adminUserId?: number | null
      logCategory: Category
      action: string
      targetType?: string
      targetId?: number | null
      changeSummary?: string
      changeDetail?: Record<string, { before?: unknown; after?: unknown }>
      ipAddress: string
      userAgent?: string
      createdAt: string
    }

    interface ListParams {
      genealogyId: number
      current?: number
      size?: number
      logCategory?: Category | ''
      operatorUserId?: number | ''
      /** YYYY-MM-DD */
      startDate?: string
      endDate?: string
      keyword?: string
    }

    interface OperatorOption {
      userId: number
      displayName: string
    }
  }

  /** 人物（Sprint 3） */
  namespace Person {
    type Gender = 0 | 1 | 2
    type PrivacyLevel = 1 | 2 | 3
    type ReviewStatus = 0 | 1 | 2 | 3

    interface Item {
      id: number
      genealogyId: number
      /** 可空：仅追溯最近关联修谱项目，非归属依据（v3.1.6） */
      projectId?: number | null
      personNo: string
      generation: number
      nameWei: string
      nameZi?: string
      nameHao?: string
      xingdi?: string
      zibei?: string
      gender: Gender
      birthDate?: string
      deathDate?: string
      isAlive: 0 | 1
      /**
       * 幼殇（文档待补字段）：勾选时视为已故，可与卒日并存
       * 不改变 is_alive 二值语义，仅附加谱牒标注
       */
      isYoushang?: boolean
      nativePlace?: string
      burialPlace?: string
      biography?: string
      privacyLevel: PrivacyLevel
      reviewStatus: ReviewStatus
      reviewNote?: string
      /** 归档后变更：0未变更 1新增 2修改 3已删除 */
      isChangedSinceArchive?: 0 | 1 | 2 | 3
      /** 字辈存疑标记 */
      zibeiDoubt?: boolean
      createdAt: string
      updatedAt?: string
      deletedAt?: string | null
    }

    interface FormParams {
      nameWei: string
      nameZi?: string
      nameHao?: string
      xingdi?: string
      zibei?: string
      generation: number
      gender: Gender
      birthDate?: string
      deathDate?: string
      isAlive: 0 | 1
      /** 幼殇（文档待补） */
      isYoushang?: boolean
      nativePlace?: string
      burialPlace?: string
      biography?: string
      privacyLevel: PrivacyLevel
      zibeiDoubt?: boolean
      /** 批量导入：指定人物编号（§1.10.1）；手动新增由后端/Mock 生成 */
      personNo?: string
    }

    /** 批量导入行（含关系引用，入库后挂边） */
    interface ImportRow {
      personNo: string
      form: FormParams
      fatherNo?: string
      motherNo?: string
      spouseNos?: string[]
    }

    /** 人员列表主系/姻亲视图：all=全部 lineage=仅本族主系（默认）affinal=仅姻亲 */
    type LineageScope = 'all' | 'lineage' | 'affinal'

    interface ListParams {
      genealogyId: number
      current?: number
      size?: number
      keyword?: string
      generation?: number
      gender?: Gender
      isAlive?: 0 | 1
      scope?: 'active' | 'trash'
      /** 默认 lineage：隐藏嫁入挂名配偶，突出本支录入 */
      lineageScope?: LineageScope
    }
  }

  /** 亲属关系（Sprint 3） */
  namespace Relationship {
    type RelType =
      | 'father'
      | 'sifu'
      | 'jiantiao'
      | 'jifu'
      | 'yifu'
      | 'mother'
      | 'spouse'
      | 'zhuixu'
      | 'chuji'

    interface Item {
      id: number
      genealogyId: number
      fromPersonId: number
      toPersonId: number
      relType: RelType
      remark?: string
      createdAt: string
      deletedAt?: string | null
    }

    interface CreateParams {
      genealogyId: number
      fromPersonId: number
      toPersonId: number
      relType: RelType
      remark?: string
    }
  }

  /** 谱书章节（Sprint 3） */
  namespace Chapter {
    type ChapterType =
      | 'preface'
      | 'fanli'
      | 'jiaxun'
      | 'ciji'
      | 'yiwen'
      | 'zhuanji'
      | 'postscript'
      | 'other'

    interface Item {
      id: number
      genealogyId: number
      chapterType: ChapterType
      title: string
      contentHtml: string
      sortOrder: number
      createdAt: string
      updatedAt?: string
    }

    interface FormParams {
      chapterType: ChapterType
      title: string
      contentHtml: string
    }
  }

  /** 校对（Sprint 4 / v3.1.6） */
  namespace Review {
    interface PendingItem {
      id: string
      targetType: 'person' | 'chapter' | 'relation'
      targetId: number
      title: string
      detail: string
      status: Person.ReviewStatus
    }

    interface DoubtItem {
      id: number
      nameWei: string
      generation: number
      reason: string
      note: string
      resolved: boolean
    }

    interface LogItem {
      id: number
      genealogyId: number
      action: string
      target: string
      remark: string
      before: string
      after: string
      operator: string
      createdAt: string
    }
  }

  /** 排版定稿（Sprint 4） */
  namespace Layout {
    type LayoutType = 'dieji' | 'sushi' | 'oushi' | 'baota'

    interface PdfJob {
      id: number
      genealogyId: number
      status: 'running' | 'done' | 'failed'
      progress: number
      downloadUrl?: string
      createdAt: string
      finishedAt?: string
    }

    interface DiejiEntry {
      generation: number
      title: string
      body: string
    }
  }

  /** 发布归档（Sprint 4） */
  namespace Archive {
    interface Snapshot {
      id: number
      genealogyId: number
      batchNo: number
      title: string
      layoutType: Layout.LayoutType
      pageCount: number
      personCount: number
      chapterCount: number
      relationCount: number
      privacy: Genealogy.Privacy
      operator: string
      createdAt: string
      summary: string
    }
  }

  /** 订阅与额度 · v3.1.6 §0.8 / §1.7.11–13 */
  namespace Subscription {
    type Status = 'trial' | 'active' | 'expired'
    type PlanType = 'trial' | 'basic' | 'professional'
    type PaymentMethod = 'wechat' | 'alipay'
    type ProductType = 'subscription' | 'renewal' | 'person_expand' | 'storage_expand'
    /** 0待支付 1已支付 2已取消 3已退款 4超时 */
    type PaymentStatus = 0 | 1 | 2 | 3 | 4
    type QuotaType = 'person' | 'storage'
    type ChangeType =
      | 'gift'
      | 'purchase'
      | 'expand'
      | 'consume'
      | 'auto_purge'
      | 'manual_purge'
      | 'manual'
    type SimulateScenario = 'expire' | 'restore_trial' | 'exhaust_person' | 'active_basic'

    interface Summary {
      status: Status
      planType: PlanType
      planName: string
      startAt?: string
      expireAt?: string
      autoRenew: boolean
      personUsed: number
      personLimit: number
      storageUsedMb: number
      storageLimitMb: number
      /** MVP 硬限制默认 1 */
      maxGenealogyCount: number
      maxCollaborators: number
      maxContinuationCount: number
      continuationUsed: number
      ocrRemaining: number
      allowPdfExport: boolean
      allowBatchExport: boolean
    }

    interface PlanOption {
      planType: PlanType
      name: string
      price: number
      durationDays: number
      personQuota: number
      storageQuotaMb: number
      maxCollaborators: number
      maxContinuationCount: number
      maxGenealogyCount: number
      allowPdfExport: boolean
      allowBatchExport: boolean
      ocrMonthly: number
      features: string[]
    }

    interface ExpandPack {
      id: string
      productType: 'person_expand' | 'storage_expand'
      name: string
      amount: number
      personAdd: number
      storageAddMb: number
    }

    interface OrderItem {
      id: number
      orderNo: string
      productType: ProductType
      productName: string
      amount: number
      paymentMethod?: PaymentMethod
      paymentStatus: PaymentStatus
      paidAt?: string
      createdAt: string
      grantedQuota?: { person?: number; storageMb?: number }
    }

    interface QuotaTransactionItem {
      id: number
      quotaType: QuotaType
      changeType: ChangeType
      changeAmount: number
      balanceAfter: number
      genealogyName?: string
      operatorName: string
      remark?: string
      orderId?: number
      createdAt: string
    }

    interface PurchasePlanParams {
      planType: Exclude<PlanType, 'trial'>
      paymentMethod: PaymentMethod
      autoRenew?: boolean
    }

    interface PurchaseExpandParams {
      packId: string
      paymentMethod: PaymentMethod
    }

    type QuotaListParams = Partial<{
      current: number
      size: number
      quotaType: QuotaType
      changeType: ChangeType
    }>

    type OrderListParams = Partial<{
      current: number
      size: number
      paymentStatus: PaymentStatus
    }>
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams
    >
  }
}
