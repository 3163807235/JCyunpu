/** 官网首页文案 —— 对齐《家传云谱·官网首页预览.html》 */

export const brand = {
  name: '家传云谱',
  tagline: '专业的数字化修谱 SaaS 平台\n让修谱从此简单，让家族记忆永续传承'
}

export const nav = {
  links: [
    { label: '产品功能', to: '/features' },
    { label: '版式展示', href: '/#layouts' },
    { label: '定价方案', to: '/pricing' },
    { label: '客户案例', href: '/#testimonials' },
    { label: '帮助中心', href: '/#faq' },
    { label: '关于我们', to: '/about' }
  ],
  login: '登录',
  trial: '免费试用'
}

export const hero = {
  titleLine1: '让修谱从此简单',
  titleAccent: '让家族记忆永续传承',
  subtitle:
    '家传云谱是专业的数字化修谱 SaaS 平台，无需专业排版技能，结构化录入即可生成符合传统规范的谱书。支持多人协作、智能排版、多期续修，让族谱代代相传。',
  primaryCta: '免费开始修谱',
  secondaryCta: '了解产品功能',
  trusts: ['30天免费试用', '无需信用卡', '500+ 家族的选择']
}

export const valuesSection = {
  tag: '核心价值',
  title: '为什么选择家传云谱',
  desc: '我们将传统修谱工艺与现代技术结合，让每一个家族都能轻松修好自己的家谱',
  items: [
    {
      icon: 'ri:file-edit-line',
      title: '降低修谱门槛',
      desc: '无需专业排版技能，结构化录入即可生成符合传统规范的谱书。支持手动录入与 Excel 批量导入，老少皆宜，让修谱不再是少数人的专利。'
    },
    {
      icon: 'ri:checkbox-circle-line',
      title: '保障修谱质量',
      desc: '五步标准化流程 + 多人协作 + 校对机制，兼顾效率与严谨。校勘批注、疑点复核、版本对比，确保族谱内容准确可靠。'
    },
    {
      icon: 'ri:refresh-line',
      title: '实现永续传承',
      desc: '版本封存 + 多期续修 + 增量编辑，让族谱代代延续。历史版本永久留存只读，新增内容不篡改史料，家族记忆永不褪色。'
    }
  ]
} as const

export const processSection = {
  tag: '修谱流程',
  title: '五步成谱，专业严谨',
  desc: '日常人丁管理与修谱流程双区融合；标准化五步闭环，确保每一部族谱都专业规范',
  steps: [
    { no: '壹', title: '项目启动', desc: '创建族谱，设置堂号始祖，配置项目与团队' },
    { no: '贰', title: '内容编排', desc: '规整世系，撰写谱文，完善章节内容' },
    { no: '叁', title: '校对', desc: '校勘批注，疑点复核，整改验收' },
    { no: '肆', title: '智能排版', desc: '选择版式，调整参数，生成定稿谱稿' },
    { no: '伍', title: '发布归档', desc: '版本封存，永久只读，可发起续修' }
  ],
  modes: [
    { strong: '五步成谱 · 标准模式', text: '— 适合专业修谱团队，仪式感拉满' },
    { strong: '快捷成谱 · 简易模式', text: '— 适合个人小家族，跳过会审更高效' }
  ]
}

export const featuresSection = {
  tag: '核心功能',
  title: '六大核心能力，助力家族修谱',
  desc: '从信息管理到排版输出，从单人修谱到多人协作，全方位满足修谱需求',
  items: [
    {
      icon: 'ri:group-line',
      title: '人物与世系管理',
      desc: '结构化录入人物信息，讳字号、生卒、籍贯、事迹完整记录。自动生成世系图，支持父子、配偶、出继、嗣子等多种亲属关系。'
    },
    {
      icon: 'ri:user-shared-line',
      title: '多人协作修谱',
      desc: '邀请房头采编分工录入，校勘员专项审核，角色权限清晰。编辑锁机制防止数据冲突，协作高效有序。'
    },
    {
      icon: 'ri:book-open-line',
      title: '智能排版输出',
      desc: '支持牒记式、苏式垂丝等多种传统版式，排版参数可调，所见即所得预览，一键生成印刷级 PDF。'
    },
    {
      icon: 'ri:archive-line',
      title: '版本快照归档',
      desc: '发布即封存，历史版本只读不可篡改。支持多期续修，基于上一版增量增补，不篡改历史史料。'
    },
    {
      icon: 'ri:ancient-pavilion-line',
      title: '家族文化记录',
      desc: '家规家训、家族大事记、姓氏源流、堂号起源、家族相册，完整记录家族文化传承。'
    },
    {
      icon: 'ri:shield-check-line',
      title: '数据安全保障',
      desc: '回收站 + 软删除二级机制，用户数据自主权，平台永不主动删除。全链路加密，多重备份。'
    }
  ]
} as const

export const layoutsSection = {
  tag: '版式展示',
  title: '多种传统版式，专业规范',
  desc: '传承千年谱牒文化，支持多种经典传统版式，满足不同家族的修谱需求',
  items: [
    {
      badge: 'MVP 已上线',
      badgeClass: '',
      title: '牒记式',
      desc: '以人物传记为主体，按世系排列，清晰易读',
      preview: 'dieji'
    },
    {
      badge: '即将上线',
      badgeClass: '',
      title: '苏式垂丝',
      desc: '苏洵创立，世代为经，父子为纬',
      preview: 'sushi'
    },
    {
      badge: 'V1.5',
      badgeClass: 'coming',
      title: '欧式分栏',
      desc: '五世一提，分栏排列，便于查阅',
      preview: 'oushi'
    },
    {
      badge: 'V1.5',
      badgeClass: 'coming',
      title: '宝塔式',
      desc: '自上而下宝塔形，直观展现分支',
      preview: 'baota'
    }
  ]
}

export const casesSection = {
  tag: '客户案例',
  title: '500+ 家族的共同选择',
  desc: '来自全国各地的家族正在使用家传云谱，记录属于他们的家族故事',
  items: [
    {
      avatar: '李',
      name: '李先生',
      meta: '陇西李氏 · 族谱主编 · 800余人',
      quote:
        '我们家族修谱折腾了三年都没搞定，用了家传云谱后，几个房头的叔叔各自负责录入，三个月就完成了初稿。排版出来的谱书非常专业，老人们都很满意。'
    },
    {
      avatar: '王',
      name: '王老师',
      meta: '三槐堂王氏 · 校勘员 · 300余人',
      quote:
        '作为一名退休教师，我对排版质量要求很高。家传云谱的牒记式排版非常规范，字体、行距、页码都很专业，生成的 PDF 直接送印刷厂就能印，省了一大笔排版费。'
    },
    {
      avatar: '张',
      name: '张先生',
      meta: '百忍堂张氏 · 发起人 · 500余人',
      quote:
        '最让我放心的是数据安全。之前存在电脑里的老谱资料差点丢了，现在用家传云谱，版本封存、回收站、多重备份，再也不怕数据出问题了。而且还能续修，后代可以接着增补。'
    }
  ]
}

export const pricingSection = {
  tag: '定价方案',
  title: '透明定价，按需选择',
  desc: '从个人小家族到大宗族，总有一款适合你。7 天无理由退款保障',
  note: '所有套餐均支持 7 天无理由退款 · 可随时升级套餐 · 数据永久留存',
  plans: [
    {
      id: 'trial',
      name: '试用套餐',
      desc: '想先体验的用户',
      amount: '免费',
      unit: '',
      period: '30 天体验期',
      featured: false,
      cta: '免费开始',
      ctaClass: 'btn-secondary',
      features: [
        { text: '1 个族谱', disabled: false },
        { text: '50 人额度', disabled: false },
        { text: '100MB 存储', disabled: false },
        { text: '仅自己使用', disabled: false },
        { text: '牒记式预览（水印）', disabled: false },
        { text: 'PDF 印刷版导出', disabled: true },
        { text: 'Excel 批量导入', disabled: true }
      ]
    },
    {
      id: 'basic',
      name: '基础年付',
      desc: '中小家族首选',
      amount: '¥299',
      unit: '/年',
      period: '约 ¥25 / 月',
      featured: true,
      badge: '最受欢迎',
      cta: '立即购买',
      ctaClass: 'btn-primary',
      features: [
        { text: '1 个族谱', disabled: false },
        { text: '500 人额度', disabled: false },
        { text: '2GB 存储空间', disabled: false },
        { text: '5 人协作', disabled: false },
        { text: '3 次续修', disabled: false },
        { text: '牒记式排版', disabled: false },
        { text: '印刷版 PDF 导出', disabled: false },
        { text: 'Excel 批量导入', disabled: false },
        { text: '工单客服支持', disabled: false }
      ]
    },
    {
      id: 'pro',
      name: '专业年付',
      desc: '大家族 / 专业团队',
      amount: '¥899',
      unit: '/年',
      period: '约 ¥75 / 月',
      featured: false,
      cta: '立即购买',
      ctaClass: 'btn-secondary',
      features: [
        { text: '5 个族谱', disabled: false },
        { text: '3000 人额度', disabled: false },
        { text: '10GB 存储空间', disabled: false },
        { text: '20 人协作', disabled: false },
        { text: '无限次续修', disabled: false },
        { text: '全部版式支持', disabled: false },
        { text: '印刷版 PDF + 批量导出', disabled: false },
        { text: 'Excel 批量导入', disabled: false },
        { text: '家族文化全量模块', disabled: false },
        { text: '工单 + 1对1 专属客服', disabled: false }
      ]
    }
  ]
}

export const faqSection = {
  tag: '常见问题',
  title: '你可能想知道的',
  desc: '还有其他问题？随时联系我们的客服团队',
  items: [
    {
      q: '我不会用电脑，能修好谱吗？',
      a: '完全可以。家传云谱的设计初衷就是降低修谱门槛，界面简洁直观，只需填写表单即可录入人物信息。我们还提供了详细的图文教程和视频教程，客服也可以一对一指导。很多 60 多岁的长辈都在用我们的产品修谱呢。'
    },
    {
      q: '老谱是纸质的，能导入进去吗？',
      a: '可以的。您可以将老谱扫描成电子版，作为附件上传到系统中作为参考。对于人物数据，我们提供了 Excel 模板，您可以按照模板整理后批量导入。如果老谱数据量大，我们还可以提供数据录入服务（增值服务）。'
    },
    {
      q: '数据存在你们平台，安全吗？',
      a: '非常安全。我们采用银行级别的数据加密标准，全链路 HTTPS 加密传输，数据多重备份。更重要的是，用户数据完全归用户所有，我们承诺永不主动删除用户数据。删除操作采用“回收站 30 天可恢复 + 软删除永久保留”的二级机制，确保数据不会误删丢失。'
    },
    {
      q: '订阅到期后，我的族谱数据会被删除吗？',
      a: '绝对不会。订阅到期后，您的族谱数据会完整保留，只是进入只读模式——您仍然可以浏览和查看所有内容，只是不能新增和编辑。只要您不主动删除，数据会一直保留。续费后立即恢复全部操作权限。'
    },
    {
      q: '可以多人一起修谱吗？怎么协作？',
      a: '可以的。您可以邀请家族成员加入协作，不同角色有不同权限：拥有者管理全局，主编负责统筹，采编负责录入数据，校勘负责审核校对。每个房头可以安排专人录入本房信息，进度一目了然，效率大大提升。'
    },
    {
      q: '生成的 PDF 可以直接印刷吗？',
      a: '完全可以。我们生成的是印刷级高清 PDF，分辨率 300DPI，支持 CMYK 色彩模式，可直接交付印刷厂印刷。我们还提供版式参数调整功能，您可以根据印刷厂的要求调整页边距、出血位等参数。'
    },
    {
      q: '支持苏式垂丝图吗？效果怎么样？',
      a: '苏式垂丝图正在紧张开发中，预计 V1.5 版本正式上线。我们采用了先进的自动布局算法，可以根据人物数量智能调整排版，确保垂丝图美观规范。MVP 版本先上牒记式，您可以先用起来，苏式上线后可直接切换。'
    },
    {
      q: '修到一半可以暂停吗？下次可以继续吗？',
      a: '当然可以。修谱是一个长期工程，您随时可以暂停，数据会自动保存在云端。下次登录后从断点继续，完全不受影响。我们的版本快照机制还能记录每个阶段的状态，让您的修谱历程有迹可循。'
    }
  ]
}

export const ctaSection = {
  title: '开始你的家族修谱之旅',
  desc: '30 天免费试用，无需信用卡，随时可取消。\n让家族的故事，从这里开始传承。',
  button: '立即免费注册',
  trust: '已有 500+ 家族选择家传云谱 · 7 天无理由退款保障'
}

export const footer = {
  about: '专业的数字化修谱 SaaS 平台<br>让修谱从此简单，让家族记忆永续传承',
  columns: [
    {
      title: '产品',
      links: [
        { label: '功能介绍', to: '/features' },
        { label: '定价方案', to: '/pricing' },
        { label: '版式展示', href: '/#layouts' },
        { label: '更新日志', href: '#', badge: 'V1.5' },
        { label: '路线图', href: '#', badge: 'V1.5' }
      ]
    },
    {
      title: '资源',
      links: [
        { label: '帮助中心', href: '/#faq' },
        { label: '使用教程', href: '/#faq' },
        { label: '常见问题', href: '/#faq' },
        { label: '修谱指南', href: '#', badge: 'V1.5' },
        { label: '博客', href: '#', badge: 'V1.5' }
      ]
    },
    {
      title: '公司',
      links: [
        { label: '关于我们', to: '/about' },
        { label: '品牌故事', to: '/about' },
        { label: '联系我们', href: 'mailto:support@jcyunpu.com' },
        { label: '合作伙伴', href: '#', badge: 'V1.5' },
        { label: '加入我们', href: '#', badge: 'V1.5' }
      ]
    },
    {
      title: '联系方式',
      links: [
        { label: '客服邮箱：support@jcyunpu.com', href: 'mailto:support@jcyunpu.com' },
        { label: '商务合作：bd@jcyunpu.com', href: 'mailto:bd@jcyunpu.com' },
        { label: '微信公众号', href: '#' },
        { label: '工作时间：9:00-18:00', href: '#' }
      ]
    }
  ],
  copyright: '© 2026 家传云谱. 保留所有权利.',
  legal: [
    { label: '用户协议', href: '#' },
    { label: '隐私政策', href: '#' },
    { label: '服务条款', href: '#' }
  ],
  /** 备案号请替换为实际核准编号；链接保持工信部 / 公安部查询入口 */
  filings: [
    {
      label: '京ICP备XXXXXXXX号',
      href: 'https://beian.miit.gov.cn/'
    },
    {
      label: '京公网安备 XXXXXXXXXXXX号',
      href: 'https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=XXXXXXXXXXXX',
      icon: 'ri:shield-check-line'
    }
  ]
}

/** 产品功能页 · 官网设计文档 §四（简化 6 模块） */
export const featuresPage = {
  hero: {
    title: '六大核心能力，覆盖修谱全流程',
    desc: '从人丁录入到印刷定稿，从单人修谱到多人协作，家传云谱把专业修谱能力做成可落地的产品能力。'
  },
  modules: [
    {
      id: 'collect',
      icon: 'ri:group-line',
      title: '人物与世系管理',
      value: '结构化录入人丁与关系，世系清晰可查，为排版与校对打好数据底座。',
      points: [
        '讳、字、号、世代、生卒、籍贯、事迹等完整字段',
        'Excel 批量导入：模板填写 → 校验 → 一键入库',
        '父子、配偶、出继、嗣子等核心亲属关系',
        '人物照片与老谱扫描件等附件归档'
      ]
    },
    {
      id: 'collab',
      icon: 'ri:user-shared-line',
      title: '协作修谱',
      value: '按角色分工采编与校对，编辑锁防冲突，进度一目了然。',
      points: [
        'MVP 支持拥有者 + 采编；主编/校勘等角色 V1.5 扩展',
        '邀请协作、席位按套餐管控',
        '编辑锁机制，降低多人同时改写风险',
        '操作日志可追溯关键协作动作'
      ]
    },
    {
      id: 'layout',
      icon: 'ri:book-open-line',
      title: '智能排版',
      value: '传统版式参数可调，预览所见即所得，输出印刷级 PDF。',
      points: [
        'MVP 上线牒记式；苏式等版式按路线图扩展',
        '版式参数可调，锁定后可导出',
        '实时预览，调整后即时反馈',
        '印刷级 PDF 任务（套餐权限控制）'
      ]
    },
    {
      id: 'version',
      icon: 'ri:archive-line',
      title: '版本管理',
      value: '发布即封存，历史只读；续修增量增补，不篡改史料。',
      points: [
        '归档时全量快照封存',
        '历史版本只读不可篡改',
        '多期续修能力按套餐与版本节奏开放',
        '版本对比入口标注 V1.5'
      ]
    },
    {
      id: 'culture',
      icon: 'ri:ancient-pavilion-line',
      title: '家族文化',
      value: '家规家训与大事记结构化沉淀，让族谱不止名录。',
      points: [
        '家规家训：分类、排序、富文本条目',
        '家族大事记：时间轴 + 列表双视图',
        '姓氏源流 / 堂号 / 相册：V1.5 开放',
        '文化内容可纳入谱书相应篇章'
      ]
    },
    {
      id: 'security',
      icon: 'ri:shield-check-line',
      title: '数据安全',
      value: '回收站与软删除兜底，平台不主动删用户数据，传输加密。',
      points: [
        '删除进回收站，30 天可恢复',
        '额度占用规则清晰，彻底删除后释放',
        '用户数据自主权：平台不因欠费主动删库',
        'HTTPS 传输；关键操作审计留存'
      ]
    }
  ],
  cta: {
    title: '立刻体验完整修谱能力',
    button: '免费开始修谱'
  }
} as const

/** 定价页 · 官网设计文档 §五 */
export const pricingPage = {
  hero: {
    title: '透明定价，按需选择',
    desc: '试用即可建谱体验；年付套餐覆盖协作、额度与印刷导出。可随时升级，数据永久留存。'
  },
  compareTitle: '详细权益对比',
  compareRows: [
    { name: '价格', trial: '免费', basic: '¥299/年', pro: '¥899/年' },
    { name: '有效期', trial: '30天', basic: '365天', pro: '365天' },
    { name: '族谱数量', trial: '1个', basic: '1个', pro: '5个' },
    { name: '人物额度', trial: '50人', basic: '500人', pro: '3000人' },
    { name: '存储额度', trial: '100MB', basic: '2GB', pro: '10GB' },
    { name: '协作人数', trial: '1人', basic: '5人', pro: '20人' },
    { name: '续修次数', trial: '0次', basic: '3次', pro: '无限' },
    { name: '版式支持', trial: '牒记式预览', basic: '牒记式', pro: '牒记式 + 苏式' },
    { name: 'PDF导出', trial: '预览水印版', basic: '印刷版无水印', pro: '印刷版 + 批量' },
    { name: '批量导入', trial: '—', basic: '✓', pro: '✓' },
    { name: '家族文化', trial: '家规+大事记', basic: '家规+大事记', pro: '全量' },
    { name: '扩容包', trial: '—', basic: '✓', pro: '✓' },
    { name: '客服支持', trial: '帮助中心', basic: '工单', pro: '工单 + 1对1' }
  ],
  enterprise: {
    title: '企业 / 文化机构定制',
    desc: '面向姓氏研究会、大型宗族与文化机构：专属客户经理、培训实施、按需扩展协作与额度。',
    points: ['定制化协作与权限', '数据与合规咨询', '培训与实施服务', '商务一对一对接'],
    cta: '联系商务咨询',
    mailto: 'mailto:bd@jcyunpu.com'
  },
  faqs: [
    {
      q: '试用结束后数据会丢吗？',
      a: '不会。到期仅进入只读，续费后恢复编辑；平台不因欠费主动删除用户族谱数据。'
    },
    {
      q: '可以中途升级套餐吗？',
      a: '可以。升级后额度与协作人数按新套餐生效，历史数据完整保留。'
    },
    {
      q: '支持退款吗？',
      a: '支持 7 天无理由退款（以订单与协议约定为准）。'
    }
  ]
} as const

/** 关于我们 · 官网设计文档 §八（简化） */
export const aboutPage = {
  hero: {
    title: '我们为什么做家传云谱',
    desc: '修谱是中国人的文化传统，但传统方式门槛高、效率低、难以永续。我们希望用现代产品能力，让更多家族轻松修好谱、留住记忆。'
  },
  story: {
    title: '品牌故事',
    paragraphs: [
      '家谱不仅是名录，更是家族精神与历史脉络的载体。纸质修谱依赖专业班底，成本高、协作难、续修更难。',
      '家传云谱把「日常人丁管理」与「五步修谱流程」做成一体：平时可广录族人，需要时走标准或简易成谱路径，归档后版本可续修继承。',
      '我们坚持文档驱动的产品边界：先跑通最短可用路径，再按版本节奏扩展角色、版式与文化全量能力。'
    ]
  },
  principles: [
    {
      icon: 'ri:book-read-line',
      title: '文化优先',
      desc: '版式与流程尊重传统修谱习惯，而不是套用通用表格工具。'
    },
    {
      icon: 'ri:shield-check-line',
      title: '数据自主',
      desc: '用户数据归用户；回收站与审计兜底，平台不主动删库。'
    },
    {
      icon: 'ri:route-line',
      title: '节奏清晰',
      desc: 'MVP / V1.5 边界写进产品文档，避免把未上线能力卖成已交付。'
    }
  ],
  contact: {
    title: '联系我们',
    items: [
      { label: '客服邮箱', value: 'support@jcyunpu.com', href: 'mailto:support@jcyunpu.com' },
      { label: '商务合作', value: 'bd@jcyunpu.com', href: 'mailto:bd@jcyunpu.com' },
      { label: '工作时间', value: '工作日 9:00–18:00', href: '#' }
    ]
  },
  cta: {
    title: '一起把家族记忆交给时间',
    button: '免费开始修谱'
  }
} as const
