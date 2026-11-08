/* Guca CRM v2.0.0 — frontend (vanilla JS, zero dependencies).
   DOM contract: public/index.html (see task). Every lookup is guarded:
   if an element is missing the feature is skipped, never throws.
   Backend contract: generic REST /api/<collection> + special endpoints
   listed in the task. All fetches go through api(). */
'use strict';

/* ================= 0. Helpers ================= */
const $ = id => document.getElementById(id);
const qs = (s, r) => (r || document).querySelector(s);
const qsa = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const on = (id, ev, fn) => { const el = typeof id === 'string' ? $(id) : id; if (el) el.addEventListener(ev, fn); return el; };
const fmtMoney = n => (state.settings.role === 'sales' ? '***' : '$' + (Number(n) || 0).toLocaleString());
const fmtDate = d => (d || '').slice(0, 10);
const fmtTime = t => (t || '').slice(11, 16) || (t || '').slice(0, 5);
const todayStr = () => new Date().toISOString().slice(0, 10);
const isOverdue = d => !!d && String(d).slice(0, 10) < todayStr();
const uid = p => (p || 'x') + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
const emptyState = key => `<div class="empty">${esc(t(key || 'emptyDefault'))}</div>`;
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };

/* ================= 1. I18N ================= */
window.I18N = {
  zh: {
    navDashboard: '工作台', navLeads: '线索', navDeals: '商机', navCustomers: '客户', navActivities: '跟进',
    navProducts: '产品', navQuotes: '报价', navOrders: '订单', navShipments: '发货', navInvoices: '发票',
    navFinance: '财务', navInventory: '库存', navInbox: '收件箱', navChat: '聊天', navProspects: '客户挖掘',
    navMarketing: '营销', navSegments: '分组', navCases: '售后', navKnowledge: '知识库', navReports: '报表',
    navCalendar: '日历', navCustomfields: '自定义字段', navCustomobjects: '自定义对象', navWorkflows: '自动化',
    navRoles: '角色权限', navIntegration: '集成', navSettings: '设置',
    searchPh: '全局搜索：公司 / 姓名 / 产品…', quickCreate: '快速新建', theme: '主题',
    pageDashboard: '工作台', pageLeads: '线索', pageDeals: '商机', pageCustomers: '客户', pageActivities: '跟进提醒',
    pageProducts: '产品', pageQuotes: '报价单', pageOrders: '订单', pageShipments: '发货', pageInvoices: '发票',
    pageFinance: '财务', pageInventory: '库存', pageInbox: '收件箱', pageChat: '聊天', pageProspects: 'AI 客户挖掘',
    pageMarketing: '营销', pageSegments: '客户分组', pageCases: '售后工单', pageKnowledge: '知识库',
    pageReports: '报表', pageCalendar: '日历', pageCustomfields: '自定义字段', pageCustomobjects: '自定义对象',
    pageWorkflows: '自动化流程', pageRoles: '角色权限', pageIntegration: '网站集成', pageSettings: '设置',
    kpiLeads: '线索总数', kpiDeals: '进行中商机', kpiReceivable: '应收账款', kpiReceived: '已收款',
    aiBrief: 'AI 简报', funnel: '销售漏斗', country: '线索国家分布', sla: 'SLA 提醒', todayTasks: '今日待办',
    recentOrders: '最近订单', unreadChat: '未读消息', editDesktop: '编辑桌面', widgetDrawer: '组件',
    newLead: '新增线索', importLeads: '导入 CSV', exportLeads: '导出 CSV', saveView: '保存视图',
    leadSearchPh: '搜索公司 / 姓名 / 国家 / 产品', allStatus: '全部状态', allOwners: '全部负责人',
    bulkDelete: '批量删除', bulkAssign: '批量分配', bulkConvert: '批量转客户',
    grade: '等级', score: '评分', status: '状态', owner: '负责人', nextFollow: '下次跟进', amount: '金额',
    company: '公司', name: '姓名', country: '国家', product: '产品', email: '邮箱', phone: '电话',
    edit: '编辑', del: '删除', save: '保存', cancel: '取消', close: '关闭', confirm: '确认', send: '发送',
    convertCustomer: '转客户', convertDeal: '转商机', convertOrder: '转订单', revise: '修订新版',
    emptyDefault: '暂无数据', emptyLeads: '暂无线索，点击「新增线索」开始', emptyDeals: '暂无商机',
    emptyCustomers: '暂无客户', emptyTasks: '暂无待办', emptyProducts: '暂无产品', emptyQuotes: '暂无报价单',
    emptyOrders: '暂无订单', emptyMessages: '暂无消息', emptyThreads: '暂无会话', emptyInventory: '暂无库存记录',
    emptyCases: '暂无工单', emptyDocs: '暂无文档', emptyCampaigns: '暂无营销活动', emptySegments: '暂无分组',
    emptyProspects: '暂未挖掘到客户', emptyLog: '暂无记录', emptyCalendar: '本月暂无事项',
    overdue: '逾期', done: '完成', markDone: '标记完成', newTask: '新建跟进', followUp: '写跟进',
    addProduct: '新增产品', addQuote: '新建报价', addOrder: '新建订单', addCustomer: '新增客户',
    quoteLines: '报价明细', total: '合计', version: '版本', sku: 'SKU', price: '价格', stock: '库存',
    inTransit: '在途', safeStock: '安全库存', shortage: '缺货', stockIn: '入库', stockOut: '出库',
    stockLog: '出入库记录', tierPrices: '阶梯价', orderWarnings: '库存提醒',
    receivable: '应收', received: '已收', overdueAmount: '逾期未收', monthlyTrend: '月度趋势',
    inboxAll: '全部', channelWhatsApp: 'WhatsApp', channelWeChat: '企业微信', channelEmail: '邮件',
    channelSite: '网站', channelInstagram: 'Instagram', channelFacebook: 'Facebook',
    translateHint: '将翻译成 {lang} 发送', draftSaved: '草稿已保存 {time}', aiSuggest: 'AI 建议回复',
    aiOnlyYou: '仅你可见', useDraft: '用作草稿', sendDirect: '直接发送', replyZh: '中文回复', reasoning: '理由',
    evidence: '依据', translatedAs: '译：', originalZh: '中文原文：',
    prospectRun: '开始挖掘', prospectSources: '挖掘来源', prospectImport: '批量导入', dedupe: '去重',
    demoBanner: '演示模式：未配置 AI 密钥，结果为示例数据', provider: 'AI 服务商', apiKey: 'API Key',
    baseUrl: 'Base URL', model: '模型', saveSettings: '保存设置',
    segmentNew: '新建分组', campaignNew: '新建活动', campaignSend: '发送', openRate: '打开率', clickRate: '点击率',
    schedule: '内容排期', caseNew: '新建工单', caseStatus: '工单状态', docNew: '新建文档', docHistory: '版本历史',
    apiKeyTitle: 'API 密钥', regenerate: '重新生成', disable: '停用', embedForm: '嵌入表单代码',
    copy: '复制', apiDocs: '接口文档', inquiryLog: '询盘日志', testSend: '测试发送',
    themePalettes: '主题配色', customColor: '自定义颜色', radius: '圆角', density: '密度', fontSize: '字号',
    exportLayout: '导出布局', importLayout: '导入布局', customFieldTypes: '字段类型',
    dealStages: '商机阶段', roles: '角色', myName: '我的名字', bubbleColor: '气泡颜色',
    workflows: '自动化规则', masterSwitch: '总开关', runNow: '立即执行', runLog: '执行日志', auditLog: '审计日志',
    progress: '进度', stocking: '备货', qc: '质检', inspection: '验货', packing: '打包',
    shipments: '发货记录', payments: '分期付款', documents: '单据', pi: '形式发票 PI', ci: '商业发票 CI',
    packingList: '装箱单', viewDoc: '查看单据', timeline: '时间线', detail: '详情',
    saved: '已保存', deleted: '已删除', sent: '已发送', failed: '失败', copied: '已复制',
    confirmDelete: '确定删除吗？', loadFailed: '加载失败', networkError: '网络错误，请稍后重试',
    selectAll: '全选', search: '搜索', filter: '筛选', refresh: '刷新',
    langZh: '中文', langEn: 'English', favorites: '收藏', collapse: '收起', expand: '展开',
    moveToGroup: '移到分组', pinFavorite: '收藏', unpinFavorite: '取消收藏',
    noKeySaved: '已保存的密钥不会在此显示', keySaved: '密钥已保存', runStarted: '挖掘已开始',
    importedOk: '已导入 {n} 条，跳过重复 {d} 条', month: '月', week: '周', day: '日',
    inbound: '收到的询盘', outbound: '发出的消息', unread: '未读', read: '已读',
    stageInquiry: '询盘', stageConfirm: '确认', stageQuote: '报价', stageNegotiate: '谈判',
    stageSample: '样品', stageWon: '成交', stageLost: '丢单',
    leadNew: '新线索', leadContacted: '已联系', leadQuoted: '已报价', leadNegotiating: '谈判中', leadWon: '已成交', leadLost: '已丢单',
    caseOpen: '待处理', caseProgress: '处理中', caseResolved: '已解决', caseClosed: '已关闭',
    campaignDraft: '草稿', campaignSent: '已发送', campaignScheduled: '已排期',
    settingsSaved: '设置已保存', layoutExported: '布局已导出', layoutImported: '布局已导入',
    dashboardPages: '桌面页', addPage: '新增一页', removePage: '删除本页',
    customObjects: '自定义对象', customRecords: '记录', addRecord: '新增记录',
    fieldText: '单行文本', fieldNumber: '数字', fieldSelect: '下拉单选', fieldMulti: '下拉多选',
    fieldDate: '日期', fieldDatetime: '日期时间', fieldCheckbox: '复选框', fieldEmail: '邮箱',
    fieldPhone: '电话', fieldUrl: '链接', fieldTextarea: '多行文本', fieldRich: '富文本',
    fieldRating: '评分', fieldColor: '颜色', fieldSlider: '滑块', fieldAddress: '地址',
    fieldFile: '文件', fieldUser: '用户', fieldCurrency: '货币', fieldFormula: '公式',
    sourceGoogle: 'Google 搜索', sourceMaps: 'Google 地图', sourceLinkedIn: 'LinkedIn', sourceAlibaba: '阿里巴巴',
    sourceMadeInChina: '中国制造网', sourceGlobalSources: '环球资源', sourceTradeShows: '展会名录',
    sourceInstagram: 'Instagram', sourceFacebook: 'Facebook', sourceX: 'X / Twitter',
    sourceDirectories: '行业黄页', sourceImportData: '海关数据', sourceWebsite: '独立站访客', sourceReferral: '转介绍',
    dashboard: '工作台', chat: '聊天', inbox: '收件箱', reports: '报表', settings: '设置',
      activitiesAddTitle: '快速记录跟进',
    activityTypeCall: '电话',
    activityTypeWechat: '企微',
    activityTypeWhatsapp: 'WhatsApp',
    btnAdd: '添加',
    btnAdjustStock: '出入库',
    btnExport: '导出',
    btnImport: '导入',
    btnMarkAllRead: '全部标为已读',
    btnNew: '＋ 新建',
    btnResetLayout: '恢复默认',
    btnRunProspecting: '开始获客',
    btnSendOriginal: '发送原文',
    btnSendTranslated: '发送译文',
    btnTestConnection: '测试连接',
    btnTranslate: '翻译',
    btnTranslateAll: '全部翻译',
    btnUseReply: '采用此回复',
    bulkClear: '取消选择',
    bulkSelected: '条已选',
    calendarTodayTitle: '今日日程',
    caseStatusClosed: '已关闭',
    caseStatusOpen: '待处理',
    caseStatusResolved: '已解决',
    channelAll: '全部',
    channelWeb: '独立站',
    channelWechat: '微信',
    chatAiSuggestTitle: 'AI 建议回复',
    chatNoThread: '未选择会话',
    chatTranslatePreview: '翻译预览',
    colActions: '操作',
    colBy: '跟进人',
    colCarrier: '物流商',
    colCaseNo: '工单号',
    colCategory: '分类',
    colContact: '联系人',
    colContent: '内容',
    colCost: '成本价',
    colDate: '日期',
    colDueDate: '到期日',
    colEntity: '所属对象',
    colFieldLabel: '字段名',
    colFieldName: '内部名',
    colFieldOptions: '下拉选项',
    colFieldType: '类型',
    colInvoiceNo: '发票号',
    colLead: '关联线索',
    colLevel: '等级',
    colOrderNo: '订单号',
    colPaid: '已收',
    colPriceTiers: '价格阶梯',
    colPriority: '优先级',
    colQuoteNo: '报价单号',
    colRoleDesc: '说明',
    colRoleMembers: '成员',
    colRoleName: '角色',
    colRolePerms: '权限',
    colShipNo: '运单号',
    colSource: '来源',
    colSubject: '主题',
    colTracking: '追踪号',
    colType: '类型',
    colValidUntil: '有效期至',
    colValue: '金额',
    commonOff: '关闭',
    commonOn: '开启',
    customersDetailTitle: '客户详情',
    customfieldsAddHint: '添加后，新增线索表单里会出现这个字段，数据存在线索的 custom 对象里。',
    customfieldsAddTitle: '快速添加字段到线索',
    densityComfortable: '舒适',
    densityCompact: '紧凑',
    densityRoomy: '宽松',
    drawerWidgetsHint: '点击添加，把组件拖到工作台任意位置。',
    drawerWidgetsTitle: '添加组件',
    emptyActivities: '暂无跟进记录',
    emptyCustomFields: '暂无自定义字段',
    emptyFinanceTrend: '暂无财务数据',
    emptyIntegration: '暂无导入记录',
    emptyInvoices: '暂无发票',
    emptyKnowledge: '暂无资料',
    entityCustomer: '客户',
    entityDeal: '商机',
    entityLead: '线索',
    entityOrder: '订单',
    filterAllCountries: '全部国家',
    filterAllViews: '全部视图',
    financeMonthRevenue: '本月营收',
    financeRange12m: '近 12 个月',
    financeRange30: '近 30 天',
    financeRange90: '近 90 天',
    financeTrendTitle: '收支趋势',
    fontSizeLarge: '大',
    fontSizeMedium: '中',
    fontSizeSmall: '小',
    groupData: '数据',
    groupMarketing: '营销',
    groupOrders: '订单',
    groupSales: '销售',
    groupService: '客服',
    integrationAutoImport: '询盘自动导入',
    integrationHint: '独立站的询盘提交后会自动进入线索列表，并按规则分配负责人与 SLA 提醒。',
    integrationInquiryForm: '询盘表单字段映射',
    integrationNotConnected: '未连接',
    integrationRecentTitle: '最近导入的询盘',
    integrationSiteUrl: '独立站地址',
    inventoryLogTitle: '出入库记录',
    leadStatusContacted: '已联系',
    leadStatusLost: '已丢单',
    leadStatusNegotiating: '谈判中',
    leadStatusNew: '新线索',
    leadStatusQuoted: '已报价',
    leadStatusWon: '已成交',
    leadsImportHint: '表头：name,company,country,product,status,value,owner,email,phone',
    leadsImportTitle: 'CSV 导入',
    notifyDaily: '每日简报推送',
    notifyOrder: '订单状态提醒',
    orderStatusPaid: '已收款',
    orderStatusProduction: '生产中',
    orderStatusShipped: '已发货',
    paletteAmber: '琥珀',
    paletteCyan: '青蓝',
    paletteGreen: '绿色',
    paletteIndigo: '靛蓝',
    paletteOrange: '橙色',
    palettePink: '粉色',
    palettePurple: '紫色',
    paletteRose: '玫红',
    paletteRoyal: '宝蓝',
    paletteSky: '天蓝',
    paletteSlate: '石板',
    paletteTeal: '青色',
    prospectsCustomProvider: '自定义兼容接口',
    quickCustomer: '新建客户',
    quickDeal: '新建商机',
    quickLead: '新建线索',
    quickOrder: '新建订单',
    quickTask: '新建待办',
    radiusLarge: '大',
    radiusMedium: '中',
    radiusSmall: '小',
    reportsByCountry: '线索按国家',
    reportsByOwner: '商机金额按负责人',
    reportsMonthly: '月度趋势',
    settingsBubbleHint: '为各页面的计数气泡选择颜色，JS 通过 --bubble 变量应用。',
    settingsBubbleTitle: '计数气泡颜色',
    settingsDisplayTitle: '显示与密度',
    settingsLanguage: '界面语言',
    settingsLanguageTitle: '语言',
    settingsLayoutHint: '导出当前桌面布局与定制，或导入之前保存的布局文件。',
    settingsLayoutTitle: '布局管理',
    settingsNotifyTitle: '通知提醒',
    settingsThemeTitle: '主题配色',
    sidebarFooter: 'Guca CRM · 轻量外贸 CRM',
    userAdmin: '管理员',
    viewGradeA: 'A 级客户',
    widgetCountryChart: '线索国家分布',
    widgetSlaList: 'SLA 逾期提醒',
    workflowsPresetTitle: '预设自动化规则',
    newStage: '新阶段',
    segments: '分组',
  },
  en: {
    navDashboard: 'Dashboard', navLeads: 'Leads', navDeals: 'Deals', navCustomers: 'Customers', navActivities: 'Activities',
    navProducts: 'Products', navQuotes: 'Quotes', navOrders: 'Orders', navShipments: 'Shipments', navInvoices: 'Invoices',
    navFinance: 'Finance', navInventory: 'Inventory', navInbox: 'Inbox', navChat: 'Chat', navProspects: 'Prospecting',
    navMarketing: 'Marketing', navSegments: 'Segments', navCases: 'Cases', navKnowledge: 'Knowledge', navReports: 'Reports',
    navCalendar: 'Calendar', navCustomfields: 'Custom Fields', navCustomobjects: 'Custom Objects', navWorkflows: 'Workflows',
    navRoles: 'Roles', navIntegration: 'Integration', navSettings: 'Settings',
    searchPh: 'Search company / name / product…', quickCreate: 'Quick Create', theme: 'Theme',
    pageDashboard: 'Dashboard', pageLeads: 'Leads', pageDeals: 'Deals', pageCustomers: 'Customers', pageActivities: 'Activities',
    pageProducts: 'Products', pageQuotes: 'Quotes', pageOrders: 'Orders', pageShipments: 'Shipments', pageInvoices: 'Invoices',
    pageFinance: 'Finance', pageInventory: 'Inventory', pageInbox: 'Inbox', pageChat: 'Chat', pageProspects: 'AI Prospecting',
    pageMarketing: 'Marketing', pageSegments: 'Segments', pageCases: 'Cases', pageKnowledge: 'Knowledge Base',
    pageReports: 'Reports', pageCalendar: 'Calendar', pageCustomfields: 'Custom Fields', pageCustomobjects: 'Custom Objects',
    pageWorkflows: 'Workflows', pageRoles: 'Roles & Permissions', pageIntegration: 'Website Integration', pageSettings: 'Settings',
    kpiLeads: 'Total Leads', kpiDeals: 'Open Deals', kpiReceivable: 'Receivable', kpiReceived: 'Received',
    aiBrief: 'AI Brief', funnel: 'Sales Funnel', country: 'Leads by Country', sla: 'SLA Alerts', todayTasks: "Today's Tasks",
    recentOrders: 'Recent Orders', unreadChat: 'Unread Messages', editDesktop: 'Edit Desktop', widgetDrawer: 'Widgets',
    newLead: 'New Lead', importLeads: 'Import CSV', exportLeads: 'Export CSV', saveView: 'Save View',
    leadSearchPh: 'Search company / name / country / product', allStatus: 'All Statuses', allOwners: 'All Owners',
    bulkDelete: 'Delete Selected', bulkAssign: 'Assign Selected', bulkConvert: 'Convert to Customers',
    grade: 'Grade', score: 'Score', status: 'Status', owner: 'Owner', nextFollow: 'Next Follow-up', amount: 'Amount',
    company: 'Company', name: 'Name', country: 'Country', product: 'Product', email: 'Email', phone: 'Phone',
    edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel', close: 'Close', confirm: 'Confirm', send: 'Send',
    convertCustomer: 'Convert to Customer', convertDeal: 'Convert to Deal', convertOrder: 'Convert to Order', revise: 'Revise (New Version)',
    emptyDefault: 'No data yet', emptyLeads: 'No leads yet — click “New Lead” to start', emptyDeals: 'No deals yet',
    emptyCustomers: 'No customers yet', emptyTasks: 'No tasks', emptyProducts: 'No products yet', emptyQuotes: 'No quotes yet',
    emptyOrders: 'No orders yet', emptyMessages: 'No messages', emptyThreads: 'No conversations', emptyInventory: 'No inventory records',
    emptyCases: 'No cases', emptyDocs: 'No documents', emptyCampaigns: 'No campaigns', emptySegments: 'No segments',
    emptyProspects: 'No prospects mined yet', emptyLog: 'No records', emptyCalendar: 'Nothing this month',
    overdue: 'Overdue', done: 'Done', markDone: 'Mark Done', newTask: 'New Follow-up', followUp: 'Add Follow-up',
    addProduct: 'New Product', addQuote: 'New Quote', addOrder: 'New Order', addCustomer: 'New Customer',
    quoteLines: 'Line Items', total: 'Total', version: 'Version', sku: 'SKU', price: 'Price', stock: 'Stock',
    inTransit: 'In Transit', safeStock: 'Safety Stock', shortage: 'Shortage', stockIn: 'Stock In', stockOut: 'Stock Out',
    stockLog: 'Stock Movements', tierPrices: 'Tier Prices', orderWarnings: 'Stock Warnings',
    receivable: 'Receivable', received: 'Received', overdueAmount: 'Overdue', monthlyTrend: 'Monthly Trend',
    inboxAll: 'All', channelWhatsApp: 'WhatsApp', channelWeChat: 'WeChat Work', channelEmail: 'Email',
    channelSite: 'Website', channelInstagram: 'Instagram', channelFacebook: 'Facebook',
    translateHint: 'Will be sent translated into {lang}', draftSaved: 'Draft saved {time}', aiSuggest: 'AI Suggested Reply',
    aiOnlyYou: 'Only visible to you', useDraft: 'Use as Draft', sendDirect: 'Send Directly', replyZh: 'Reply (Chinese)', reasoning: 'Reasoning',
    evidence: 'Evidence', translatedAs: 'Translation: ', originalZh: 'Original (Chinese): ',
    prospectRun: 'Start Mining', prospectSources: 'Sources', prospectImport: 'Bulk Import', dedupe: 'Dedupe',
    demoBanner: 'Demo mode: no AI key configured — results are sample data', provider: 'AI Provider', apiKey: 'API Key',
    baseUrl: 'Base URL', model: 'Model', saveSettings: 'Save Settings',
    segmentNew: 'New Segment', campaignNew: 'New Campaign', campaignSend: 'Send', openRate: 'Open Rate', clickRate: 'Click Rate',
    schedule: 'Content Schedule', caseNew: 'New Case', caseStatus: 'Case Status', docNew: 'New Document', docHistory: 'Version History',
    apiKeyTitle: 'API Key', regenerate: 'Regenerate', disable: 'Disable', embedForm: 'Embed Form Code',
    copy: 'Copy', apiDocs: 'API Docs', inquiryLog: 'Inquiry Log', testSend: 'Send Test Inquiry',
    themePalettes: 'Theme Palettes', customColor: 'Custom Color', radius: 'Corner Radius', density: 'Density', fontSize: 'Font Size',
    exportLayout: 'Export Layout', importLayout: 'Import Layout', customFieldTypes: 'Field Type',
    dealStages: 'Deal Stages', roles: 'Roles', myName: 'My Name', bubbleColor: 'Bubble Color',
    workflows: 'Automation Rules', masterSwitch: 'Master Switch', runNow: 'Run Now', runLog: 'Run Log', auditLog: 'Audit Log',
    progress: 'Progress', stocking: 'Stocking', qc: 'QC', inspection: 'Inspection', packing: 'Packing',
    shipments: 'Shipments', payments: 'Staged Payments', documents: 'Documents', pi: 'Proforma Invoice (PI)', ci: 'Commercial Invoice (CI)',
    packingList: 'Packing List', viewDoc: 'View Document', timeline: 'Timeline', detail: 'Details',
    saved: 'Saved', deleted: 'Deleted', sent: 'Sent', failed: 'Failed', copied: 'Copied',
    confirmDelete: 'Are you sure you want to delete this?', loadFailed: 'Failed to load', networkError: 'Network error, please try again',
    selectAll: 'Select All', search: 'Search', filter: 'Filter', refresh: 'Refresh',
    langZh: '中文', langEn: 'English', favorites: 'Favorites', collapse: 'Collapse', expand: 'Expand',
    moveToGroup: 'Move to Group', pinFavorite: 'Pin', unpinFavorite: 'Unpin',
    noKeySaved: 'A saved key is never shown here', keySaved: 'Key saved', runStarted: 'Mining started',
    importedOk: 'Imported {n}, skipped {d} duplicates', month: 'Month', week: 'Week', day: 'Day',
    inbound: 'Inbound inquiries', outbound: 'Outbound messages', unread: 'Unread', read: 'Read',
    stageInquiry: 'Inquiry', stageConfirm: 'Confirmed', stageQuote: 'Quoted', stageNegotiate: 'Negotiating',
    stageSample: 'Sample', stageWon: 'Won', stageLost: 'Lost',
    leadNew: 'New Lead', leadContacted: 'Contacted', leadQuoted: 'Quoted', leadNegotiating: 'Negotiating', leadWon: 'Won', leadLost: 'Lost',
    caseOpen: 'Open', caseProgress: 'In Progress', caseResolved: 'Resolved', caseClosed: 'Closed',
    campaignDraft: 'Draft', campaignSent: 'Sent', campaignScheduled: 'Scheduled',
    settingsSaved: 'Settings saved', layoutExported: 'Layout exported', layoutImported: 'Layout imported',
    dashboardPages: 'Desktop Pages', addPage: 'Add Page', removePage: 'Remove This Page',
    customObjects: 'Custom Objects', customRecords: 'Records', addRecord: 'New Record',
    fieldText: 'Single-line Text', fieldNumber: 'Number', fieldSelect: 'Dropdown', fieldMulti: 'Multi-select',
    fieldDate: 'Date', fieldDatetime: 'Date & Time', fieldCheckbox: 'Checkbox', fieldEmail: 'Email',
    fieldPhone: 'Phone', fieldUrl: 'URL', fieldTextarea: 'Multi-line Text', fieldRich: 'Rich Text',
    fieldRating: 'Rating', fieldColor: 'Color', fieldSlider: 'Slider', fieldAddress: 'Address',
    fieldFile: 'File', fieldUser: 'User', fieldCurrency: 'Currency', fieldFormula: 'Formula',
    sourceGoogle: 'Google Search', sourceMaps: 'Google Maps', sourceLinkedIn: 'LinkedIn', sourceAlibaba: 'Alibaba',
    sourceMadeInChina: 'Made-in-China', sourceGlobalSources: 'Global Sources', sourceTradeShows: 'Trade Show Lists',
    sourceInstagram: 'Instagram', sourceFacebook: 'Facebook', sourceX: 'X / Twitter',
    sourceDirectories: 'Industry Directories', sourceImportData: 'Customs Data', sourceWebsite: 'Website Visitors', sourceReferral: 'Referrals',
    dashboard: 'Dashboard', chat: 'Chat', inbox: 'Inbox', reports: 'Reports', settings: 'Settings',
    activitiesAddTitle: 'Quick follow-up',
    activityTypeCall: 'Call',
    activityTypeWechat: 'WeCom',
    activityTypeWhatsapp: 'WhatsApp',
    btnAdd: 'Add',
    btnAdjustStock: 'Stock in/out',
    btnExport: 'Export',
    btnImport: 'Import',
    btnMarkAllRead: 'Mark all read',
    btnNew: '+ New',
    btnResetLayout: 'Reset to default',
    btnRunProspecting: 'Start prospecting',
    btnSendOriginal: 'Send original',
    btnSendTranslated: 'Send translation',
    btnTestConnection: 'Test connection',
    btnTranslate: 'Translate',
    btnTranslateAll: 'Translate all',
    btnUseReply: 'Use this reply',
    bulkClear: 'Clear selection',
    bulkSelected: ' selected',
    calendarTodayTitle: 'Today\'s agenda',
    caseStatusClosed: 'Closed',
    caseStatusOpen: 'Open',
    caseStatusResolved: 'Resolved',
    channelAll: 'All',
    channelWeb: 'Website',
    channelWechat: 'WeChat',
    chatAiSuggestTitle: 'AI suggested reply',
    chatNoThread: 'No conversation selected',
    chatTranslatePreview: 'Translation preview',
    colActions: 'Actions',
    colBy: 'Followed by',
    colCarrier: 'Carrier',
    colCaseNo: 'Case No.',
    colCategory: 'Category',
    colContact: 'Contact',
    colContent: 'Content',
    colCost: 'Cost',
    colDate: 'Date',
    colDueDate: 'Due date',
    colEntity: 'Linked to',
    colFieldLabel: 'Field name',
    colFieldName: 'Internal name',
    colFieldOptions: 'Options',
    colFieldType: 'Type',
    colInvoiceNo: 'Invoice No.',
    colLead: 'Related lead',
    colLevel: 'Level',
    colOrderNo: 'Order No.',
    colPaid: 'Received',
    colPriceTiers: 'Price tiers',
    colPriority: 'Priority',
    colQuoteNo: 'Quote No.',
    colRoleDesc: 'Description',
    colRoleMembers: 'Members',
    colRoleName: 'Role',
    colRolePerms: 'Permissions',
    colShipNo: 'Shipment No.',
    colSource: 'Source',
    colSubject: 'Subject',
    colTracking: 'Tracking No.',
    colType: 'Type',
    colValidUntil: 'Valid until',
    colValue: 'Amount',
    commonOff: 'Off',
    commonOn: 'On',
    customersDetailTitle: 'Customer details',
    customfieldsAddHint: 'After adding, this field appears on the new-lead form; values are stored in the lead custom object.',
    customfieldsAddTitle: 'Quick-add field to leads',
    densityComfortable: 'Comfortable',
    densityCompact: 'Compact',
    densityRoomy: 'Roomy',
    drawerWidgetsHint: 'Click to add; drag widgets anywhere on the dashboard.',
    drawerWidgetsTitle: 'Add widget',
    emptyActivities: 'No follow-ups yet',
    emptyCustomFields: 'No custom fields yet',
    emptyFinanceTrend: 'No finance data yet',
    emptyIntegration: 'No imported inquiries yet',
    emptyInvoices: 'No invoices yet',
    emptyKnowledge: 'No documents yet',
    entityCustomer: 'Customer',
    entityDeal: 'Deal',
    entityLead: 'Lead',
    entityOrder: 'Order',
    filterAllCountries: 'All countries',
    filterAllViews: 'All views',
    financeMonthRevenue: 'Revenue this month',
    financeRange12m: 'Last 12 months',
    financeRange30: 'Last 30 days',
    financeRange90: 'Last 90 days',
    financeTrendTitle: 'Income trend',
    fontSizeLarge: 'Large',
    fontSizeMedium: 'Medium',
    fontSizeSmall: 'Small',
    groupData: 'Data',
    groupMarketing: 'Marketing',
    groupOrders: 'Orders',
    groupSales: 'Sales',
    groupService: 'Support',
    integrationAutoImport: 'Auto-import inquiries',
    integrationHint: 'Inquiries from your website flow into the lead list automatically, with owner assignment and SLA reminders.',
    integrationInquiryForm: 'Inquiry form field mapping',
    integrationNotConnected: 'Not connected',
    integrationRecentTitle: 'Recently imported inquiries',
    integrationSiteUrl: 'Website URL',
    inventoryLogTitle: 'Stock movements',
    leadStatusContacted: 'Contacted',
    leadStatusLost: 'Lost',
    leadStatusNegotiating: 'Negotiating',
    leadStatusNew: 'New lead',
    leadStatusQuoted: 'Quoted',
    leadStatusWon: 'Won',
    leadsImportHint: 'Headers: name,company,country,product,status,value,owner,email,phone',
    leadsImportTitle: 'CSV import',
    notifyDaily: 'Daily brief push',
    notifyOrder: 'Order status alerts',
    orderStatusPaid: 'Paid',
    orderStatusProduction: 'In production',
    orderStatusShipped: 'Shipped',
    paletteAmber: 'Amber',
    paletteCyan: 'Cyan',
    paletteGreen: 'Green',
    paletteIndigo: 'Indigo',
    paletteOrange: 'Orange',
    palettePink: 'Pink',
    palettePurple: 'Purple',
    paletteRose: 'Rose',
    paletteRoyal: 'Royal blue',
    paletteSky: 'Sky',
    paletteSlate: 'Slate',
    paletteTeal: 'Teal',
    prospectsCustomProvider: 'Custom compatible endpoint',
    quickCustomer: 'New customer',
    quickDeal: 'New deal',
    quickLead: 'New lead',
    quickOrder: 'New order',
    quickTask: 'New task',
    radiusLarge: 'Large',
    radiusMedium: 'Medium',
    radiusSmall: 'Small',
    reportsByCountry: 'Leads by country',
    reportsByOwner: 'Deal value by owner',
    reportsMonthly: 'Monthly trend',
    settingsBubbleHint: 'Pick a color for each page count bubble; applied via the --bubble variable.',
    settingsBubbleTitle: 'Count bubble colors',
    settingsDisplayTitle: 'Display & density',
    settingsLanguage: 'Language',
    settingsLanguageTitle: 'Language',
    settingsLayoutHint: 'Export the current desktop layout and customization, or import a saved layout file.',
    settingsLayoutTitle: 'Layout',
    settingsNotifyTitle: 'Notifications',
    settingsThemeTitle: 'Theme colors',
    sidebarFooter: 'Guca CRM · Lightweight foreign-trade CRM',
    userAdmin: 'Admin',
    viewGradeA: 'Grade-A clients',
    widgetCountryChart: 'Leads by country',
    widgetSlaList: 'SLA overdue alerts',
    workflowsPresetTitle: 'Preset automation rules',
    newStage: 'New stage',
    segments: 'Segment',
  }
};
// Dotted data-i18n keys used in index.html mapped to camelCase table keys.
const I18N_ALIAS = {
  'activity.type.email': 'email',
  'btn.aiSuggest': 'aiSuggest',
  'btn.editDesktop': 'editDesktop',
  'btn.exportLayout': 'exportLayout',
  'btn.importLayout': 'importLayout',
  'btn.quickCreate': 'quickCreate',
  'btn.regenerate': 'regenerate',
  'btn.save': 'save',
  'btn.saveView': 'saveView',
  'btn.send': 'send',
  'btn.theme': 'theme',
  'bulk.status': 'status',
  'case.status.progress': 'progress',
  'channel.phone': 'phone',
  'chat.evidence': 'evidence',
  'chat.reasoning': 'reasoning',
  'chat.replyZh': 'replyZh',
  'col.amount': 'amount',
  'col.company': 'company',
  'col.country': 'country',
  'col.email': 'email',
  'col.grade': 'grade',
  'col.name': 'name',
  'col.owner': 'owner',
  'col.phone': 'phone',
  'col.price': 'price',
  'col.product': 'product',
  'col.score': 'score',
  'col.sku': 'sku',
  'col.sla': 'sla',
  'col.status': 'status',
  'col.stock': 'stock',
  'customers.timeline': 'timeline',
  'empty.chat': 'chat',
  'empty.customObjects': 'customObjects',
  'empty.dashboard': 'dashboard',
  'empty.favorites': 'favorites',
  'empty.inbox': 'inbox',
  'empty.reports': 'reports',
  'empty.roles': 'roles',
  'empty.shipments': 'shipments',
  'empty.stockLog': 'stockLog',
  'empty.timeline': 'timeline',
  'empty.workflows': 'workflows',
  'entity.product': 'product',
  'filter.allOwners': 'allOwners',
  'filter.allStatus': 'allStatus',
  'finance.overdue': 'overdue',
  'finance.receivable': 'receivable',
  'finance.received': 'received',
  'group.settings': 'settings',
  'integration.apiKey': 'apiKey',
  'notify.chat': 'chat',
  'notify.newLead': 'newLead',
  'notify.sla': 'sla',
  'order.status.done': 'done',
  'order.status.packing': 'packing',
  'order.status.qc': 'qc',
  'page.activities.title': 'pageActivities',
  'page.calendar.title': 'pageCalendar',
  'page.cases.title': 'pageCases',
  'page.chat.title': 'pageChat',
  'page.customers.title': 'pageCustomers',
  'page.customfields.title': 'pageCustomfields',
  'page.customobjects.title': 'pageCustomobjects',
  'page.dashboard.title': 'pageDashboard',
  'page.deals.title': 'pageDeals',
  'page.finance.title': 'pageFinance',
  'page.inbox.title': 'pageInbox',
  'page.integration.title': 'pageIntegration',
  'page.inventory.title': 'pageInventory',
  'page.invoices.title': 'pageInvoices',
  'page.knowledge.title': 'pageKnowledge',
  'page.leads.title': 'pageLeads',
  'page.marketing.title': 'pageMarketing',
  'page.orders.title': 'pageOrders',
  'page.products.title': 'pageProducts',
  'page.prospects.title': 'pageProspects',
  'page.quotes.title': 'pageQuotes',
  'page.reports.title': 'pageReports',
  'page.roles.title': 'pageRoles',
  'page.segments.title': 'pageSegments',
  'page.settings.title': 'pageSettings',
  'page.shipments.title': 'pageShipments',
  'page.workflows.title': 'pageWorkflows',
  'reports.funnel': 'funnel',
  'settings.customColor': 'customColor',
  'settings.density': 'density',
  'settings.fontSize': 'fontSize',
  'settings.radius': 'radius',
  'sidebar.favorites': 'favorites',
  'view.overdue': 'overdue',
  'widget.aiBrief': 'aiBrief',
  'widget.funnel': 'funnel',
  'widget.kpiDeals': 'kpiDeals',
  'widget.kpiLeads': 'kpiLeads',
  'widget.kpiReceivable': 'kpiReceivable',
  'widget.kpiReceived': 'kpiReceived',
  'widget.recentOrders': 'recentOrders',
  'widget.todayTasks': 'todayTasks',
  'widget.unreadChat': 'unreadChat',
};
function i18nCamelKey(key) { const p = String(key).split("."); return p[0] + p.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(""); }
function i18nLookup(lang, key) { const tbl = window.I18N[lang] || {}; if (tbl[key] != null) return tbl[key]; const c = i18nCamelKey(key); if (tbl[c] != null) return tbl[c]; const a = I18N_ALIAS[key]; if (a && tbl[a] != null) return tbl[a]; return null; }

const t = (key, vars) => {
  const lang = state.lang || 'zh';
  let s = (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.zh[key] || key;
  if (vars) Object.keys(vars).forEach(k => { s = String(s).split('{' + k + '}').join(vars[k]); });
  return s;
};

/* ================= 2. State ================= */
const state = {
  lang: 'zh', settings: {}, DB: {}, currentPage: 'dashboard',
  currentCustomerId: null, currentThread: null, chatChannel: '',
  leadSelection: new Set(), dragDealId: null, dragWidgetId: null,
  dashPage: 0, calendarMonth: new Date()
};
const COLLECTIONS = ['leads', 'deals', 'customers', 'contacts', 'activities', 'tasks', 'products', 'quotes',
  'orders', 'shipments', 'payments', 'invoices', 'inventory', 'stockMoves', 'messages', 'prospects',
  'miningRuns', 'segments', 'campaigns', 'campaignRecipients', 'scheduledPosts', 'cases', 'documents',
  'customFields', 'customObjects', 'customRecords', 'workflows', 'workflowLogs', 'auditLogs',
  'inquiryLogs', 'savedViews', 'quickReplies', 'emailTemplates', 'drafts'];
const PAGES = ['dashboard', 'leads', 'deals', 'customers', 'activities', 'products', 'quotes', 'orders',
  'shipments', 'invoices', 'finance', 'inventory', 'inbox', 'chat', 'prospects', 'marketing', 'segments',
  'cases', 'knowledge', 'reports', 'calendar', 'customfields', 'customobjects', 'workflows', 'roles',
  'integration', 'settings'];

/* ================= 3. API + toast + modal ================= */
async function api(method, path, body) {
  try {
    const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast((data && data.error) || ('HTTP ' + r.status)); throw new Error('api:' + r.status); }
    return data;
  } catch (e) {
    if (e.message && e.message.indexOf('api:') === 0) throw e;
    toast(t('networkError')); throw e;
  }
}
const apiGet = p => api('GET', p);
async function loadColl(name) {
  try { const d = await apiGet('/api/' + name); const arr = Array.isArray(d) ? d : (d && Array.isArray(d.items) ? d.items : []); state.DB[name] = arr; return arr; }
  catch (e) { state.DB[name] = state.DB[name] || []; return state.DB[name]; }
}
const coll = name => state.DB[name] || [];

function toast(msg) {
  const box = $('toasts'); if (!box) return;
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; box.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}
function openModal(title, bodyHtml) {
  const m = $('modal'); if (!m) return;
  const tt = $('modalTitle'), bb = $('modalBody');
  if (tt) tt.textContent = title; if (bb) bb.innerHTML = bodyHtml;
  m.classList.add('open'); m.style.display = 'block';
}
function closeModal() {
  const m = $('modal'); if (!m) return;
  m.classList.remove('open'); m.style.display = 'none';
  const bb = $('modalBody'); if (bb) bb.innerHTML = '';
}
window.closeModal = closeModal;
function field(label, id, value, type) {
  return `<label class="f">${esc(label)}<input id="${id}" type="${type || 'text'}" value="${esc(value == null ? '' : value)}"></label>`;
}
function modalForm(fieldsHtml, saveLabel) {
  return `<form id="modalForm" onsubmit="return false">${fieldsHtml}<div class="modal-actions"><button type="button" class="ghost" onclick="closeModal()">${esc(t('cancel'))}</button><button type="submit" id="modalSave">${esc(saveLabel || t('save'))}</button></div></form>`;
}
function confirmDlg(msg, fn) { if (window.confirm(msg)) fn(); }

/* ================= 4. Settings ================= */
function normalizeSettings(d) {
  if (!d) return {};
  if (Array.isArray(d)) { const o = {}; d.forEach(r => { if (r && r.key) o[r.key] = r.value; }); return o.appSettings || o; }
  return d.appSettings || d.settings || d;
}
async function loadSettings() {
  let raw = {};
  try { raw = await apiGet('/api/settings') || {}; state.settings = normalizeSettings(raw) || {}; }
  catch (e) { state.settings = {}; }
  if (state.settings.lang) state.lang = state.settings.lang;
  if (!state.settings.dashboardLayout) state.settings.dashboardLayout = defaultDashboardLayout();
  if (!Array.isArray(state.settings.dealStages) || !state.settings.dealStages.length) state.settings.dealStages = ['inquiry', 'confirm', 'quote', 'negotiate', 'sample', 'won', 'lost'];
  // Normalize backend shapes: dealStages may be [{key,label,winRate}], theme may be an object, roles may be an object
  state.settings.dealStages = state.settings.dealStages.map(s => typeof s === 'string' ? { key: s, label: dealStageLabel(s), winRate: 0 } : { key: s.key || s.label || 'stage', label: s.label || s.key || 'stage', winRate: s.winRate || 0 });
  if (state.settings.roles && typeof state.settings.roles === 'object') { state.settings.role = state.settings.roles.current || state.settings.role || 'admin'; state.settings.myName = state.settings.roles.myName || state.settings.myName || ''; }
  if (state.settings.theme && typeof state.settings.theme === 'object') { const th = state.settings.theme; state.settings.themeCustom = Object.assign({}, state.settings.themeCustom, { primary: th.primary || '#1A56DB' }); if (th.radius) state.settings.themeRadius = th.radius; if (th.density) state.settings.themeDensity = th.density; if (th.fontSize) state.settings.themeFontSize = th.fontSize; state.settings.theme = 'default'; }
  const ai = raw.aiSettings || {};
  state.settings.aiProvider = Object.assign({}, state.settings.aiProvider, { provider: ai.provider || (state.settings.aiProvider || {}).provider || 'OpenAI', baseUrl: ai.baseUrl || (state.settings.aiProvider || {}).baseUrl || '', model: ai.model || (state.settings.aiProvider || {}).model || '', hasKey: !!ai.hasKey });
  if (!state.settings.bubbleColors) state.settings.bubbleColors = {};
  if (!state.settings.theme) state.settings.theme = 'default';
  return state.settings;
}
function stageKey(s) { return (s && typeof s === 'object') ? (s.key || s.label) : s; }
function stageLabel(s) { const k = stageKey(s); const v = dealStageLabel(k); if (v !== k) return v; return (s && typeof s === 'object' && s.label) ? s.label : k; }
async function saveSettings() {
  try {
    const s = Object.assign({}, state.settings);
    delete s.aiProvider; delete s.siteKey; // sent separately / kept server-side; never persist secrets inside appSettings
    if (Array.isArray(s.dealStages)) s.dealStages = s.dealStages.map(x => typeof x === 'string' ? { key: x, label: dealStageLabel(x), winRate: 0 } : x);
    s.roles = { current: s.role || 'admin', myName: s.myName || '', hideAmount: s.role === 'sales' };
    const payload = { appSettings: s };
    const ap = state.settings.aiProvider;
    if (ap) { payload.aiSettings = { provider: ap.provider, baseUrl: ap.baseUrl, model: ap.model }; if (ap.apiKey) payload.aiSettings.apiKey = ap.apiKey; }
    await api('POST', '/api/settings', payload);
  }
  catch (e) { /* backend may store settings differently; keep local state */ }
}
async function saveSetting(key, value) { state.settings[key] = value; await saveSettings(); }
function defaultDashboardLayout() {
  const widgets = ['kpiLeads', 'kpiDeals', 'kpiReceivable', 'kpiReceived', 'aiBrief', 'funnel', 'country', 'sla', 'today', 'orders', 'chat'];
  return { pages: [{ name: 'main', widgets: widgets.map(id => ({ id, size: 'w-standard', hidden: false })) }], current: 0 };
}
function dashLayout() {
  const l = state.settings.dashboardLayout || defaultDashboardLayout();
  if (!Array.isArray(l.pages) || !l.pages.length) return defaultDashboardLayout();
  return l;
}

/* ================= 5. I18N apply ================= */
function applyLang(lang) {
  state.lang = (lang === 'en') ? 'en' : 'zh';
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-CN';
  qsa('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = i18nLookup(state.lang, key) ?? i18nLookup('zh', key);
    if (val != null) el.textContent = val;
  });
  qsa('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = i18nLookup(state.lang, key) ?? i18nLookup('zh', key);
    if (val != null) el.setAttribute('placeholder', val);
  });
  const zh = $('langZh'), en = $('langEn');
  if (zh) zh.classList.toggle('on', state.lang === 'zh');
  if (en) en.classList.toggle('on', state.lang === 'en');
  applyTheme();
  renderCurrentPage();
}
window.applyLang = applyLang;
async function setLang(lang) {
  applyLang(lang);
  state.settings.lang = state.lang;
  await saveSettings();
}

/* ================= 6. Theme ================= */
const THEMES = {
  default: { primary: '#2563eb', bg: '#f6f7f9', card: '#ffffff', text: '#1a1a1a' },
  ocean: { primary: '#0e7490', bg: '#ecfeff', card: '#ffffff', text: '#164e63' },
  forest: { primary: '#15803d', bg: '#f0fdf4', card: '#ffffff', text: '#14532d' },
  sunset: { primary: '#ea580c', bg: '#fff7ed', card: '#ffffff', text: '#431407' },
  grape: { primary: '#7c3aed', bg: '#faf5ff', card: '#ffffff', text: '#3b0764' },
  rose: { primary: '#e11d48', bg: '#fff1f2', card: '#ffffff', text: '#4c0519' },
  slate: { primary: '#475569', bg: '#f8fafc', card: '#ffffff', text: '#0f172a' },
  gold: { primary: '#b45309', bg: '#fffbeb', card: '#ffffff', text: '#451a03' },
  teal: { primary: '#0f766e', bg: '#f0fdfa', card: '#ffffff', text: '#134e4a' },
  midnight: { primary: '#6366f1', bg: '#111827', card: '#1f2937', text: '#f9fafb' },
  mint: { primary: '#059669', bg: '#ecfdf5', card: '#ffffff', text: '#064e3b' },
  coral: { primary: '#f43f5e', bg: '#fff1f2', card: '#ffffff', text: '#500724' }
};
function applyTheme() {
  const root = document.documentElement;
  const th = THEMES[state.settings.theme] || THEMES.default;
  const custom = state.settings.themeCustom || {};
  const vars = Object.assign({}, th, custom);
  Object.keys(vars).forEach(k => {
    const css = { primary: '--primary', bg: '--bg', card: '--card', text: '--text' }[k];
    if (css) root.style.setProperty(css, vars[k]);
  });
  if (state.settings.radius) root.style.setProperty('--radius', state.settings.radius + 'px');
  if (state.settings.fontSize) root.style.setProperty('--font-size', state.settings.fontSize + 'px');
  if (state.settings.density) document.body.dataset.density = state.settings.density;
}

/* ================= 7. Router ================= */
const PAGE_LOADERS = {
  dashboard: loadDashboard, leads: loadLeads, deals: loadDeals, customers: loadCustomers,
  activities: loadActivities, products: loadProducts, quotes: loadQuotes, orders: loadOrders,
  shipments: loadShipments, invoices: loadInvoices, finance: loadFinance, inventory: loadInventory,
  inbox: loadInbox, chat: loadChat, prospects: loadProspects, marketing: loadMarketing,
  segments: loadSegments, cases: loadCases, knowledge: loadKnowledge, reports: loadReports,
  calendar: loadCalendar, customfields: loadCustomFields, customobjects: loadCustomObjects,
  workflows: loadWorkflows, roles: loadRoles, integration: loadIntegration, settings: loadSettingsPage
};
function showPage(name) {
  if (!PAGES.includes(name)) name = 'dashboard';
  state.currentPage = name;
  qsa('.page').forEach(s => s.classList.toggle('on', s.id === 'page-' + name));
  // legacy v1 sections fallback
  qsa('main section').forEach(s => { if (s.id && s.id.indexOf('s-') === 0) s.classList.toggle('on', s.id === 's-' + name); });
  qsa('.nav-item[data-page]').forEach(n => n.classList.toggle('on', n.getAttribute('data-page') === name));
  qsa('#nav button[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === name));
  if (location.hash !== '#/' + name) { try { history.replaceState(null, '', '#/' + name); } catch (e) { /* ignore */ } }
  renderCurrentPage();
}
function renderCurrentPage() {
  const fn = PAGE_LOADERS[state.currentPage];
  if (fn) { try { const r = fn(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* guarded render */ } }
  renderCountBubbles();
}
window.showPage = showPage;
function pageFromHash() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  return PAGES.includes(h) ? h : 'dashboard';
}
function bindRouter() {
  const sb = $('sidebar');
  if (sb) sb.addEventListener('click', e => {
    const nav = e.target.closest('.nav-item[data-page]');
    if (nav) { showPage(nav.getAttribute('data-page')); return; }
    const grp = e.target.closest('[data-group]');
    if (grp && e.target.closest('.group-toggle')) { grp.classList.toggle('collapsed'); }
  });
  window.addEventListener('hashchange', () => showPage(pageFromHash()));
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault(); const s = $('globalSearch'); if (s) { showPage('leads'); s.focus(); s.select(); }
    } else if (e.key === 'Escape') { closeModal(); hideBubblePopover(); }
    else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openLeadForm(); }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); openDealForm(); }
    }
  });
}

/* ================= 8. Dashboard ================= */
const WIDGET_DEFS = [
  { id: 'kpiLeads', titleKey: 'kpiLeads' }, { id: 'kpiDeals', titleKey: 'kpiDeals' },
  { id: 'kpiReceivable', titleKey: 'kpiReceivable' }, { id: 'kpiReceived', titleKey: 'kpiReceived' },
  { id: 'aiBrief', titleKey: 'aiBrief' }, { id: 'funnel', titleKey: 'funnel' },
  { id: 'country', titleKey: 'country' }, { id: 'sla', titleKey: 'sla' },
  { id: 'today', titleKey: 'todayTasks' }, { id: 'orders', titleKey: 'recentOrders' },
  { id: 'chat', titleKey: 'unreadChat' }
];
async function loadDashboard() {
  let dash = null;
  try { dash = await apiGet('/api/dashboard'); } catch (e) { dash = null; }
  if (!dash) {
    try { const s = await apiGet('/api/stats'); dash = { stats: s, kpi: s }; } catch (e) { dash = {}; }
  }
  await Promise.all([loadColl('leads'), loadColl('deals'), loadColl('tasks'), loadColl('orders'), loadColl('messages'), loadColl('customers')].map(p => p.catch(() => [])));
  renderDashboard(dash || {});
}
function renderDashboard(dash) {
  const grid = $('dashGrid'); if (!grid) return;
  const layout = dashLayout();
  const page = layout.pages[Math.min(state.dashPage, layout.pages.length - 1)] || layout.pages[0];
  state.dashPage = Math.min(state.dashPage, layout.pages.length - 1);
  const visible = page.widgets.filter(w => !w.hidden);
  const stats = dash.stats || dash.kpi || dash || {};
  const leads = coll('leads'), deals = coll('deals'), tasks = coll('tasks'), orders = coll('orders'), messages = coll('messages');
  const receivable = coll('invoices').filter(i => i.status !== 'paid').reduce((s, i) => s + (+i.amount || 0), 0);
  const received = coll('payments').reduce((s, p) => s + (+p.amount || 0), 0);
  const kpi = {
    kpiLeads: leads.length || stats.leads || 0,
    kpiDeals: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length || stats.deals || 0,
    kpiReceivable: receivable || stats.receivable || 0,
    kpiReceived: received || stats.received || 0
  };
  const funnel = {}; deals.forEach(d => { funnel[d.stage] = (funnel[d.stage] || 0) + 1; });
  const byCountry = {}; leads.forEach(l => { if (l.country) byCountry[l.country] = (byCountry[l.country] || 0) + 1; });
  const sla = leads.filter(l => l.nextFollow && isOverdue(l.nextFollow));
  const todayTasks = tasks.filter(x => !x.done && fmtDate(x.due) === todayStr());
  const unread = messages.filter(m => m.dir === 'in' && !m.read);
  const brief = dash.aiBrief || dash.brief || '';
  const maxF = Math.max(1, ...Object.values(funnel));
  const maxC = Math.max(1, ...Object.values(byCountry));
  const bodies = {
    kpiLeads: `<div class="kpi-num">${kpi.kpiLeads}</div>`,
    kpiDeals: `<div class="kpi-num">${kpi.kpiDeals}</div>`,
    kpiReceivable: `<div class="kpi-num">${fmtMoney(kpi.kpiReceivable)}</div>`,
    kpiReceived: `<div class="kpi-num">${fmtMoney(kpi.kpiReceived)}</div>`,
    aiBrief: brief ? `<p>${esc(brief)}</p>` : emptyState('emptyDefault'),
    funnel: Object.keys(funnel).length ? Object.entries(funnel).map(([k, v]) => `<div class="bar-row"><span>${esc(t('stage' + k.charAt(0).toUpperCase() + k.slice(1)) === 'stage' + k.charAt(0).toUpperCase() + k.slice(1) ? k : t('stage' + k.charAt(0).toUpperCase() + k.slice(1)))}</span><div class="bar"><i style="width:${Math.round(v / maxF * 100)}%"></i></div><b>${v}</b></div>`).join('') : emptyState('emptyDeals'),
    country: Object.keys(byCountry).length ? Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><i style="width:${Math.round(v / maxC * 100)}%"></i></div><b>${v}</b></div>`).join('') : emptyState('emptyLeads'),
    sla: sla.length ? sla.map(l => `<div class="sla-row over">${esc(l.name || '')} · ${esc(l.company || '')} — ${esc(l.nextFollow || '')}</div>`).join('') : `<div>${esc(t('emptyDefault'))}</div>`,
    today: todayTasks.length ? todayTasks.map(x => `<div>☐ ${esc(x.title || '')} · ${esc(x.due || '')}</div>`).join('') : emptyState('emptyTasks'),
    orders: orders.length ? orders.slice(0, 5).map(o => `<div>${esc(o.number || o.id || '')} · ${esc(o.customer || o.company || '')} · ${fmtMoney(o.amount || o.total)}</div>`).join('') : emptyState('emptyOrders'),
    chat: unread.length ? unread.slice(0, 5).map(m => `<div onclick="openChatThread('${esc(m.customerId || '')}')">💬 ${esc((m.originalBody || m.body || '').slice(0, 60))}</div>`).join('') : emptyState('emptyMessages')
  };
  grid.innerHTML = visible.map(w => {
    const def = WIDGET_DEFS.find(d => d.id === w.id) || { id: w.id, titleKey: w.id };
    const bodyId = { kpiLeads: 'wKpiLeads', kpiDeals: 'wKpiDeals', kpiReceivable: 'wKpiReceivable', kpiReceived: 'wKpiReceived', aiBrief: 'wAiBrief', funnel: 'wFunnel', country: 'wCountry', sla: 'wSla', today: 'wToday', orders: 'wOrders', chat: 'wChat' }[w.id] || '';
    return `<div class="widget ${esc(w.size || 'w-standard')}" data-widget="${esc(w.id)}" draggable="true">
      <div class="widget-head"><span>${esc(t(def.titleKey))}</span><button class="ghost widget-size" data-widget-size="${esc(w.id)}" title="size">⤢</button></div>
      <div class="widget-body" ${bodyId ? `id="${bodyId}"` : ''}>${bodies[w.id] || ''}</div></div>`;
  }).join('') || emptyState('emptyDefault');
  grid.querySelectorAll('.widget').forEach(wEl => {
    wEl.addEventListener('dragstart', e => { state.dragWidgetId = wEl.dataset.widget; e.dataTransfer.setData('text/plain', state.dragWidgetId); });
    wEl.addEventListener('dragover', e => e.preventDefault());
    wEl.addEventListener('drop', e => { e.preventDefault(); reorderWidget(wEl.dataset.widget); });
  });
  grid.querySelectorAll('[data-widget-size]').forEach(b => b.addEventListener('click', () => cycleWidgetSize(b.getAttribute('data-widget-size'))));
  renderDashDots();
  renderWidgetDrawer();
}
function renderDashDots() {
  const dots = $('dashDots'); const layout = dashLayout();
  if (dots) dots.innerHTML = layout.pages.map((p, i) => `<button class="dot${i === state.dashPage ? ' on' : ''}" data-page="${i}">●</button>`).join('');
  if (dots) dots.querySelectorAll('.dot').forEach(d => d.addEventListener('click', () => { state.dashPage = +d.dataset.page; renderDashboard({}); loadDashboard(); }));
  const prev = $('dashPrev'), next = $('dashNext');
  if (prev) prev.onclick = () => { state.dashPage = (state.dashPage - 1 + layout.pages.length) % layout.pages.length; loadDashboard(); };
  if (next) next.onclick = () => { state.dashPage = (state.dashPage + 1) % layout.pages.length; loadDashboard(); };
}
function renderWidgetDrawer() {
  const dr = $('widgetDrawer'); if (!dr) return;
  const layout = dashLayout(); const page = layout.pages[state.dashPage] || layout.pages[0];
  const ids = new Set(page.widgets.map(w => w.id));
  dr.innerHTML = WIDGET_DEFS.map(d => {
    const w = page.widgets.find(x => x.id === d.id);
    return `<label><input type="checkbox" data-widget-toggle="${d.id}" ${w && !w.hidden ? 'checked' : ''}> ${esc(t(d.titleKey))}</label>`;
  }).join('');
  dr.querySelectorAll('[data-widget-toggle]').forEach(cb => cb.addEventListener('change', async () => {
    const id = cb.getAttribute('data-widget-toggle'); const layout2 = dashLayout();
    const pg = layout2.pages[state.dashPage]; let w = pg.widgets.find(x => x.id === id);
    if (w) w.hidden = !cb.checked; else pg.widgets.push({ id, size: 'w-standard', hidden: !cb.checked });
    state.settings.dashboardLayout = layout2; await saveSettings(); loadDashboard();
  }));
}
function reorderWidget(targetId) {
  const layout = dashLayout(); const pg = layout.pages[state.dashPage];
  const from = pg.widgets.findIndex(w => w.id === state.dragWidgetId);
  const to = pg.widgets.findIndex(w => w.id === targetId);
  if (from < 0 || to < 0 || from === to) return;
  const [w] = pg.widgets.splice(from, 1); pg.widgets.splice(to, 0, w);
  state.settings.dashboardLayout = layout; saveSettings(); loadDashboard();
}
async function cycleWidgetSize(id) {
  const sizes = ['w-small', 'w-standard', 'w-wide', 'w-large'];
  const layout = dashLayout(); const pg = layout.pages[state.dashPage];
  const w = pg.widgets.find(x => x.id === id); if (!w) return;
  w.size = sizes[(sizes.indexOf(w.size) + 1) % sizes.length];
  state.settings.dashboardLayout = layout; await saveSettings(); loadDashboard();
}
window.cycleWidgetSize = cycleWidgetSize;

/* ================= 9. Leads ================= */
function leadFilters() {
  return {
    q: (($('leadSearch') || {}).value || '').toLowerCase(),
    status: (($('leadStatusFilter') || {}).value || ''),
    owner: (($('leadOwnerFilter') || {}).value || '')
  };
}
async function loadLeads() {
  await Promise.all([loadColl('leads'), loadColl('savedViews'), loadColl('customFields')]);
  renderLeads();
  const os = $('leadOwnerFilter');
  if (os && !os.dataset.filled) {
    const owners = [...new Set(coll('leads').map(l => l.owner).filter(Boolean))];
    os.innerHTML = `<option value="">${esc(t('allOwners'))}</option>` + owners.map(o => `<option>${esc(o)}</option>`).join('');
    os.dataset.filled = '1';
  }
}
function filteredLeads() {
  const f = leadFilters(); let rows = coll('leads');
  if (state.settings.role === 'sales' && state.settings.myName) rows = rows.filter(l => !l.owner || l.owner === state.settings.myName);
  return rows.filter(l =>
    (!f.q || [l.name, l.company, l.country, l.product, l.email].join(' ').toLowerCase().includes(f.q)) &&
    (!f.status || l.status === f.status) &&
    (!f.owner || l.owner === f.owner));
}
function renderLeads() {
  const body = $('leadsBody'); if (!body) return;
  const rows = filteredLeads();
  const sel = state.leadSelection;
  body.innerHTML = rows.length ? rows.map(l => {
    const over = l.nextFollow && isOverdue(l.nextFollow);
    return `<tr>
      <td><input type="checkbox" data-lead-check="${esc(l.id)}" ${sel.has(l.id) ? 'checked' : ''}></td>
      <td>${esc(l.name || '')}</td><td>${esc(l.company || '')}</td><td>${esc(l.country || '')}</td>
      <td>${esc(l.product || '')}</td><td><span class="tag">${esc(l.status || '')}</span></td>
      <td>${esc(l.grade || '')} ${l.score != null ? '(' + l.score + ')' : ''}</td>
      <td>${fmtMoney(l.value)}</td><td>${esc(l.owner || '')}</td>
      <td class="${over ? 'over' : ''}">${esc(l.nextFollow || '')}${over ? ' ' + esc(t('overdue')) : ''}</td>
      <td><button class="ghost" data-lead-edit="${esc(l.id)}">${esc(t('edit'))}</button>
      <button class="ghost" data-lead-convert="${esc(l.id)}">${esc(t('convertCustomer'))}</button>
      <button class="ghost" data-lead-del="${esc(l.id)}">${esc(t('del'))}</button></td></tr>`;
  }).join('') : `<tr><td colspan="11">${emptyState('emptyLeads')}</td></tr>`;
  body.querySelectorAll('[data-lead-check]').forEach(cb => cb.addEventListener('change', () => {
    cb.checked ? sel.add(cb.getAttribute('data-lead-check')) : sel.delete(cb.getAttribute('data-lead-check'));
    renderBulkBar();
  }));
  body.querySelectorAll('[data-lead-edit]').forEach(b => b.addEventListener('click', () => openLeadForm(b.getAttribute('data-lead-edit'))));
  body.querySelectorAll('[data-lead-del]').forEach(b => b.addEventListener('click', () => deleteLead(b.getAttribute('data-lead-del'))));
  body.querySelectorAll('[data-lead-convert]').forEach(b => b.addEventListener('click', () => convertLead(b.getAttribute('data-lead-convert'))));
  renderBulkBar();
}
function renderBulkBar() {
  const bar = $('leadBulkBar'); if (!bar) return;
  const n = state.leadSelection.size;
  bar.style.display = n ? 'flex' : 'none';
  bar.innerHTML = n ? `<span>${n} ${esc(t('selectAll'))}</span>
    <button data-bulk="delete">${esc(t('bulkDelete'))}</button>
    <button data-bulk="assign">${esc(t('bulkAssign'))}</button>
    <button data-bulk="convert">${esc(t('bulkConvert'))}</button>` : '';
  bar.querySelectorAll('[data-bulk]').forEach(b => b.addEventListener('click', () => bulkLeadAction(b.getAttribute('data-bulk'))));
}
async function bulkLeadAction(kind) {
  const ids = [...state.leadSelection]; if (!ids.length) return;
  if (kind === 'delete') { confirmDlg(t('confirmDelete'), async () => { for (const id of ids) { try { await api('DELETE', '/api/leads/' + id); } catch (e) { /* continue */ } } state.leadSelection.clear(); await loadLeads(); toast(t('deleted')); }); }
  else if (kind === 'assign') { const owner = window.prompt(t('owner')); if (!owner) return; for (const id of ids) { try { await api('PUT', '/api/leads/' + id, { owner }); } catch (e) { /* continue */ } } state.leadSelection.clear(); await loadLeads(); toast(t('saved')); }
  else if (kind === 'convert') { for (const id of ids) { try { await convertLead(id, true); } catch (e) { /* continue */ } } state.leadSelection.clear(); await loadLeads(); }
}
function leadFormFields(l) {
  const cf = coll('customFields').filter(f => f.entity === 'lead');
  const cfHtml = cf.map(f => field(f.label, 'lf-' + f.name, (l && l.custom && l.custom[f.name]) || '', f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text')).join('');
  return field(t('name'), 'lf-name', l && l.name) + field(t('company'), 'lf-company', l && l.company) +
    field(t('country'), 'lf-country', l && l.country) + field(t('product'), 'lf-product', l && l.product) +
    field(t('status'), 'lf-status', (l && l.status) || 'new') + field(t('grade'), 'lf-grade', l && l.grade) +
    field(t('score'), 'lf-score', l && l.score, 'number') + field(t('amount'), 'lf-value', l && l.value, 'number') +
    field(t('owner'), 'lf-owner', l && l.owner) + field(t('email'), 'lf-email', l && l.email, 'email') +
    field(t('phone'), 'lf-phone', l && l.phone, 'tel') + field(t('nextFollow'), 'lf-nextFollow', l && l.nextFollow, 'date') + cfHtml;
}
function openLeadForm(id) {
  const l = id ? coll('leads').find(x => x.id === id) : null;
  openModal(l ? t('edit') : t('newLead'), modalForm(leadFormFields(l)));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const custom = {};
    coll('customFields').filter(f => f.entity === 'lead').forEach(f => { const el = $('lf-' + f.name); if (el) custom[f.name] = el.value; });
    const body = {
      name: $('lf-name').value, company: $('lf-company').value, country: $('lf-country').value,
      product: $('lf-product').value, status: $('lf-status').value, grade: $('lf-grade').value,
      score: +$('lf-score').value || 0, value: +$('lf-value').value || 0, owner: $('lf-owner').value,
      email: $('lf-email').value, phone: $('lf-phone').value, nextFollow: $('lf-nextFollow').value, custom
    };
    try {
      if (l) await api('PUT', '/api/leads/' + l.id, body); else await api('POST', '/api/leads', Object.assign({ source: 'manual' }, body));
      closeModal(); await loadLeads(); toast(t('saved'));
    } catch (e) { /* api() already toasted */ }
  });
}
window.openLeadForm = openLeadForm;
async function deleteLead(id) { confirmDlg(t('confirmDelete'), async () => { try { await api('DELETE', '/api/leads/' + id); await loadLeads(); toast(t('deleted')); } catch (e) { /* toasted */ } }); }
async function convertLead(id, silent) {
  try {
    let r; try { r = await api('POST', '/api/leads/' + id + '/convert', {}); } catch (e) { r = null; }
    if (!r) { // fallback: create customer from lead locally
      const l = coll('leads').find(x => x.id === id); if (!l) return;
      await api('POST', '/api/customers', { company: l.company, contact: l.name, country: l.country, email: l.email, phone: l.phone, level: l.grade || 'B', sourceLeadId: l.id });
      await api('PUT', '/api/leads/' + id, { status: 'won' });
    }
    if (!silent) { await loadLeads(); toast(t('saved')); }
  } catch (e) { /* toasted */ }
}
window.convertLead = convertLead;
function exportLeadsCsv() { window.open('/api/export?type=leads&format=csv', '_blank'); }
async function importLeadsCsv(file) {
  if (!file) return;
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/); if (lines.length < 2) { toast(t('emptyDefault')); return; }
  const cols = lines[0].split(',').map(s => s.trim());
  let imported = 0, dup = 0;
  const existing = new Set(coll('leads').map(l => (l.email || '') + '|' + (l.company || '')));
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const vals = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const row = {}; cols.forEach((c, i) => { row[c] = vals[i] || ''; });
    const key = (row.email || '') + '|' + (row.company || '');
    if (row.email && existing.has(key)) { dup++; continue; }
    existing.add(key); row.value = +row.value || 0; row.status = row.status || 'new'; row.custom = {};
    try { await api('POST', '/api/leads', row); imported++; } catch (e) { /* continue */ }
  }
  toast(t('importedOk', { n: imported, d: dup })); await loadLeads();
}
async function saveCurrentView() {
  const name = window.prompt(t('saveView')); if (!name) return;
  const f = leadFilters();
  try { await api('POST', '/api/savedViews', { name, entity: 'leads', filters: f }); toast(t('saved')); } catch (e) { /* toasted */ }
}

/* ================= 10. Deals (Kanban) ================= */
async function loadDeals() { await Promise.all([loadColl('deals'), loadColl('leads')]); renderDeals(); }
function dealStageLabel(stage) {
  const key = 'stage' + String(stage).charAt(0).toUpperCase() + String(stage).slice(1);
  const v = t(key); return v === key ? stage : v;
}
function renderDeals() {
  const kb = $('kanban'); if (!kb) return;
  const stages = state.settings.dealStages || ['inquiry', 'confirm', 'quote', 'negotiate', 'sample', 'won', 'lost'];
  let deals = coll('deals');
  if (state.settings.role === 'sales' && state.settings.myName) deals = deals.filter(d => !d.owner || d.owner === state.settings.myName);
  kb.innerHTML = stages.map(s => {
    const k = stageKey(s);
    const cards = deals.filter(d => d.stage === k);
    return `<div class="kanban-col" data-stage="${esc(k)}" ondragover="event.preventDefault()">
      <h3>${esc(stageLabel(s))} (${cards.length})</h3>
      ${cards.map(d => `<div class="deal-card" draggable="true" data-deal="${esc(d.id)}">
        <b>${esc(d.title || d.company || '')}</b><div>${esc(d.company || '')} · ${esc(d.country || '')}</div>
        <div>${fmtMoney(d.amount)} · ${esc(d.owner || '')}</div>
        <div class="card-actions"><button data-deal-prev="${esc(d.id)}">‹</button><button data-deal-edit="${esc(d.id)}">${esc(t('edit'))}</button><button data-deal-next="${esc(d.id)}">›</button></div>
      </div>`).join('') || emptyState('emptyDeals')}</div>`;
  }).join('');
  kb.querySelectorAll('.deal-card').forEach(c => {
    c.addEventListener('dragstart', e => { state.dragDealId = c.dataset.deal; e.dataTransfer.setData('text/plain', state.dragDealId); });
  });
  kb.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', e => e.preventDefault());
    col.addEventListener('drop', async e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || state.dragDealId; if (!id) return; await moveDeal(id, col.dataset.stage); });
  });
  kb.querySelectorAll('[data-deal-edit]').forEach(b => b.addEventListener('click', () => openDealForm(b.getAttribute('data-deal-edit'))));
  kb.querySelectorAll('[data-deal-prev]').forEach(b => b.addEventListener('click', () => nudgeDeal(b.getAttribute('data-deal-prev'), -1)));
  kb.querySelectorAll('[data-deal-next]').forEach(b => b.addEventListener('click', () => nudgeDeal(b.getAttribute('data-deal-next'), 1)));
}
async function moveDeal(id, stage) { try { await api('PUT', '/api/deals/' + id, { stage }); await loadDeals(); } catch (e) { /* toasted */ } }
async function nudgeDeal(id, dir) {
  const stages = (state.settings.dealStages || []).map(stageKey);
  const d = coll('deals').find(x => x.id === id); if (!d) return;
  const i = stages.indexOf(d.stage); const ni = Math.min(stages.length - 1, Math.max(0, i + dir));
  if (ni !== i) await moveDeal(id, stages[ni]);
}
function openDealForm(id) {
  const d = id ? coll('deals').find(x => x.id === id) : null;
  const stages = state.settings.dealStages || [];
  const opts = stages.map(s => `<option value="${esc(stageKey(s))}" ${d && d.stage === stageKey(s) ? 'selected' : ''}>${esc(stageLabel(s))}</option>`).join('');
  openModal(d ? t('edit') : t('pageDeals'), modalForm(
    field(t('pageDeals'), 'df-title', d && (d.title || d.company)) + field(t('company'), 'df-company', d && d.company) +
    field(t('country'), 'df-country', d && d.country) + field(t('amount'), 'df-amount', d && d.amount, 'number') +
    field(t('owner'), 'df-owner', d && d.owner) +
    `<label class="f">${esc(t('status'))}<select id="df-stage">${opts}</select></label>`));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = { title: $('df-title').value, company: $('df-company').value, country: $('df-country').value, amount: +$('df-amount').value || 0, owner: $('df-owner').value, stage: $('df-stage').value };
    try { if (d) await api('PUT', '/api/deals/' + d.id, body); else await api('POST', '/api/deals', body); closeModal(); await loadDeals(); toast(t('saved')); } catch (err) { /* toasted */ }
  });
}
window.openDealForm = openDealForm;

/* ================= 11. Customers ================= */
async function loadCustomers() {
  await Promise.all([loadColl('customers'), loadColl('activities'), loadColl('messages'), loadColl('contacts')]);
  renderCustomers();
}
function renderCustomers() {
  const body = $('customersBody'); const table = $('customersTable');
  if (!body && !table) return;
  const rows = coll('customers');
  const html = rows.length ? rows.map(c => `<tr data-cust="${esc(c.id)}">
    <td>${esc(c.company || '')}</td><td>${esc(c.contact || '')}</td><td>${esc(c.country || '')}</td>
    <td>${esc(c.level || '')}</td><td>${esc(c.email || '')}</td><td>${esc(c.phone || '')}</td>
    <td><button class="ghost" data-cust-open="${esc(c.id)}">${esc(t('detail'))}</button></td></tr>`).join('')
    : `<tr><td colspan="7">${emptyState('emptyCustomers')}</td></tr>`;
  if (body) body.innerHTML = html;
  else if (table) table.innerHTML = `<tbody>${html}</tbody>`;
  qsa('[data-cust-open]').forEach(b => b.addEventListener('click', () => openCustomerDetail(b.getAttribute('data-cust-open'))));
}
async function openCustomerDetail(id) {
  const c = coll('customers').find(x => x.id === id); if (!c) return;
  const acts = coll('activities').filter(a => a.customerId === id || a.leadId === id).map(a => ({ time: a.date || a.time || '', kind: a.type || 'activity', text: a.text || a.note || '', by: a.by || a.owner || '' }));
  const msgs = coll('messages').filter(m => m.customerId === id).map(m => ({ time: m.time || '', kind: m.channel || 'message', text: m.originalBody || m.body || '', by: m.dir === 'in' ? 'customer' : 'me' }));
  const items = acts.concat(msgs).sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const det = $('customerDetail');
  const html = `<h3>${esc(c.company || '')} — ${esc(c.contact || '')}</h3>
    <p>${esc(c.country || '')} · ${esc(c.email || '')} · ${esc(c.phone || '')} · ${esc(c.level || '')}</p>
    <h4>${esc(t('timeline'))}</h4>
    <div id="customerTimeline">${items.length ? items.map(i => `<div class="tl-row"><span>${esc(i.time || '')}</span> <b>${esc(i.kind)}</b> ${esc(i.text)} <i>${esc(i.by)}</i></div>`).join('') : emptyState('emptyDefault')}</div>
    <button class="ghost" onclick="openChatThread('${esc(c.id)}')">${esc(t('chat'))}</button>`;
  if (det) det.innerHTML = html;
  else openModal(c.company || c.contact || '', html);
  const tl = $('customerTimeline'); if (tl && !det) tl.innerHTML = items.length ? items.map(i => `<div class="tl-row"><span>${esc(i.time || '')}</span> <b>${esc(i.kind)}</b> ${esc(i.text)}</div>`).join('') : emptyState('emptyDefault');
}
window.openCustomerDetail = openCustomerDetail;

/* ================= 12. Activities / tasks ================= */
async function loadActivities() {
  await Promise.all([loadColl('tasks'), loadColl('activities'), loadColl('leads')]);
  renderActivities();
}
function renderActivities() {
  const root = qs('#page-activities') || document.body;
  let list = root.querySelector('.task-list');
  if (!list) { list = document.createElement('div'); list.className = 'task-list'; root.appendChild(list); }
  const tasks = coll('tasks');
  list.innerHTML = tasks.length ? tasks.map(x => {
    const over = !x.done && x.due && isOverdue(x.due);
    return `<div class="task-row${over ? ' over' : ''}"><input type="checkbox" data-task-done="${esc(x.id)}" ${x.done ? 'checked' : ''}>
      <span>${esc(x.title || '')}</span><span>${esc(x.due || '')}</span><span>${esc(x.owner || '')}</span>
      ${over ? `<b class="over">${esc(t('overdue'))}</b>` : ''}
      <button class="ghost" data-task-follow="${esc(x.id)}">${esc(t('followUp'))}</button></div>`;
  }).join('') : emptyState('emptyTasks');
  list.querySelectorAll('[data-task-done]').forEach(cb => cb.addEventListener('change', async () => {
    try { await api('PUT', '/api/tasks/' + cb.getAttribute('data-task-done'), { done: cb.checked }); await loadActivities(); } catch (e) { /* toasted */ }
  }));
  list.querySelectorAll('[data-task-follow]').forEach(b => b.addEventListener('click', () => openFollowUpForm(b.getAttribute('data-task-follow'))));
}
function openFollowUpForm(taskId) {
  const task = coll('tasks').find(x => x.id === taskId);
  openModal(t('followUp'), modalForm(field(t('followUp'), 'fu-text', '') + field(t('nextFollow'), 'fu-due', '', 'date')));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('POST', '/api/activities', { taskId, text: $('fu-text').value, date: todayStr(), by: state.settings.myName || 'me', type: 'follow-up' });
      if (task && $('fu-due').value) await api('PUT', '/api/tasks/' + task.id, { due: $('fu-due').value, done: true });
      closeModal(); await loadActivities(); toast(t('saved'));
    } catch (err) { /* toasted */ }
  });
}
window.openFollowUpForm = openFollowUpForm;

/* ================= 13. Products & quotes ================= */
async function loadProducts() { await loadColl('products'); renderProducts(); }
function renderProducts() {
  const body = $('productsTable') ? ($('productsTable').querySelector('tbody') || $('productsTable')) : null;
  const rows = coll('products');
  const html = rows.length ? rows.map(p => `<tr><td>${esc(p.sku || '')}</td><td>${esc(p.name || '')}</td>
    <td>${fmtMoney(p.price)}</td><td>${esc(p.stock != null ? p.stock : '')}</td><td>${esc(p.category || '')}</td>
    <td><button class="ghost" data-prod-edit="${esc(p.id)}">${esc(t('edit'))}</button>
    <button class="ghost" data-prod-del="${esc(p.id)}">${esc(t('del'))}</button></td></tr>`).join('')
    : `<tr><td colspan="6">${emptyState('emptyProducts')}</td></tr>`;
  if (body) body.innerHTML = html;
  else { const pg = $('page-products'); if (pg) { let d = pg.querySelector('.product-list'); if (!d) { d = document.createElement('div'); d.className = 'product-list'; pg.appendChild(d); } d.innerHTML = rows.length ? rows.map(p => `<div>${esc(p.name || '')} · ${fmtMoney(p.price)}</div>`).join('') : emptyState('emptyProducts'); } }
  qsa('[data-prod-edit]').forEach(b => b.addEventListener('click', () => openProductForm(b.getAttribute('data-prod-edit'))));
  qsa('[data-prod-del]').forEach(b => b.addEventListener('click', () => confirmDlg(t('confirmDelete'), async () => { try { await api('DELETE', '/api/products/' + b.getAttribute('data-prod-del')); await loadProducts(); } catch (e) { /* toasted */ } })));
}
function openProductForm(id) {
  const p = id ? coll('products').find(x => x.id === id) : null;
  const tiers = (p && p.tiers) || [];
  openModal(p ? t('edit') : t('addProduct'), modalForm(
    field(t('sku'), 'pf-sku', p && p.sku) + field(t('name'), 'pf-name', p && p.name) +
    field(t('price'), 'pf-price', p && p.price, 'number') + field(t('stock'), 'pf-stock', p && p.stock, 'number') +
    field(t('tierPrices'), 'pf-tiers', tiers.map(x => (x.qty || '') + ':' + (x.price || '')).join(', '))));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const tiers2 = $('pf-tiers').value.split(',').map(s => s.trim()).filter(Boolean).map(s => { const [qty, price] = s.split(':'); return { qty: +qty || 0, price: +price || 0 }; });
    const body = { sku: $('pf-sku').value, name: $('pf-name').value, price: +$('pf-price').value || 0, stock: +$('pf-stock').value || 0, tiers: tiers2 };
    try { if (p) await api('PUT', '/api/products/' + p.id, body); else await api('POST', '/api/products', body); closeModal(); await loadProducts(); toast(t('saved')); } catch (err) { /* toasted */ }
  });
}
window.openProductForm = openProductForm;

async function loadQuotes() { await Promise.all([loadColl('quotes'), loadColl('products'), loadColl('customers')]); renderQuotes(); }
function renderQuotes() {
  const tbl = $('quotesTable'); if (!tbl) return;
  const body = tbl.querySelector('tbody') || tbl;
  const rows = coll('quotes');
  body.innerHTML = rows.length ? rows.map(q => `<tr><td>${esc(q.number || q.id || '')}</td><td>${esc(q.customer || q.company || '')}</td>
    <td>${esc(q.version || 'v1')}</td><td>${fmtMoney(q.total)}</td><td>${esc(q.status || '')}</td>
    <td><button class="ghost" data-quote-view="${esc(q.id)}">${esc(t('detail'))}</button>
    <button class="ghost" data-quote-revise="${esc(q.id)}">${esc(t('revise'))}</button>
    <button class="ghost" data-quote-deal="${esc(q.id)}">${esc(t('convertDeal'))}</button>
    <button class="ghost" data-quote-order="${esc(q.id)}">${esc(t('convertOrder'))}</button></td></tr>`).join('')
    : `<tr><td colspan="6">${emptyState('emptyQuotes')}</td></tr>`;
  qsa('[data-quote-revise]').forEach(b => b.addEventListener('click', () => reviseQuote(b.getAttribute('data-quote-revise'))));
  qsa('[data-quote-deal]').forEach(b => b.addEventListener('click', () => convertQuote(b.getAttribute('data-quote-deal'), 'deal')));
  qsa('[data-quote-order]').forEach(b => b.addEventListener('click', () => convertQuote(b.getAttribute('data-quote-order'), 'order')));
  qsa('[data-quote-view]').forEach(b => b.addEventListener('click', () => openQuoteForm(b.getAttribute('data-quote-view'))));
}
function quoteTotal(lines) { return (lines || []).reduce((s, l) => s + (+l.qty || 0) * (+l.price || 0), 0); }
function openQuoteForm(id) {
  const q = id ? coll('quotes').find(x => x.id === id) : null;
  const lines = (q && q.lines) || [{ product: '', qty: 1, price: 0 }];
  const prodOpts = coll('products').map(p => `<option value="${esc(p.name || '')}">${esc(p.name || '')} — ${fmtMoney(p.price)}</option>`).join('');
  openModal(q ? t('detail') : t('addQuote'), modalForm(
    field(t('company'), 'qf-customer', q && (q.customer || q.company)) +
    `<div id="quoteLines">${lines.map((l, i) => `<div class="quote-line" data-line="${i}">
      <select class="ql-prod">${prodOpts}</select>
      <input class="ql-qty" type="number" value="${l.qty || 1}" placeholder="qty">
      <input class="ql-price" type="number" value="${l.price || 0}" placeholder="price">
      <span class="ql-sum">${fmtMoney((+l.qty || 0) * (+l.price || 0))}</span></div>`).join('')}</div>
    <button type="button" class="ghost" id="qfAddLine">+ line</button>
    <div>${esc(t('total'))}: <b id="qfTotal">${fmtMoney(quoteTotal(lines))}</b></div>`));
  const form = $('modalForm'); if (!form) return;
  const recalc = () => {
    let sum = 0;
    qsa('.quote-line', form).forEach(row => { const qty = +row.querySelector('.ql-qty').value || 0; const pr = +row.querySelector('.ql-price').value || 0; sum += qty * pr; const s = row.querySelector('.ql-sum'); if (s) s.textContent = fmtMoney(qty * pr); });
    const tot = $('qfTotal'); if (tot) tot.textContent = fmtMoney(sum);
  };
  form.addEventListener('input', recalc);
  const addBtn = $('qfAddLine'); if (addBtn) addBtn.addEventListener('click', () => {
    const wrap = $('quoteLines'); if (!wrap) return;
    const div = document.createElement('div'); div.className = 'quote-line';
    div.innerHTML = `<select class="ql-prod">${prodOpts}</select><input class="ql-qty" type="number" value="1"><input class="ql-price" type="number" value="0"><span class="ql-sum">$0</span>`;
    wrap.appendChild(div);
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const qlines = qsa('.quote-line', form).map(row => ({ product: row.querySelector('.ql-prod').value, qty: +row.querySelector('.ql-qty').value || 0, price: +row.querySelector('.ql-price').value || 0 }));
    const body = { customer: $('qf-customer').value, lines: qlines, total: quoteTotal(qlines), status: (q && q.status) || 'draft', version: (q && q.version) || 'v1' };
    try { if (q) await api('PUT', '/api/quotes/' + q.id, body); else await api('POST', '/api/quotes', Object.assign({ number: 'Q-' + Date.now().toString(36).toUpperCase() }, body)); closeModal(); await loadQuotes(); toast(t('saved')); } catch (err) { /* toasted */ }
  });
}
window.openQuoteForm = openQuoteForm;
async function reviseQuote(id) {
  const q = coll('quotes').find(x => x.id === id); if (!q) return;
  try {
    let r; try { r = await api('POST', '/api/quotes/' + id + '/revise', {}); } catch (e) { r = null; }
    if (!r) { const v = parseInt(String(q.version || 'v1').replace(/\D/g, '') || '1', 10) + 1; await api('POST', '/api/quotes', Object.assign({}, q, { id: undefined, version: 'v' + v, status: 'draft' })); }
    await loadQuotes(); toast(t('saved'));
  } catch (e) { /* toasted */ }
}
async function convertQuote(id, kind) {
  const q = coll('quotes').find(x => x.id === id); if (!q) return;
  try {
    let done = false;
    try { await api('POST', '/api/quotes/' + id + '/' + (kind === 'deal' ? 'to-deal' : 'to-order'), {}); done = true; } catch (e) { done = false; }
    if (!done) {
      if (kind === 'deal') await api('POST', '/api/deals', { title: q.number || q.customer, company: q.customer, amount: q.total, stage: 'quote', owner: state.settings.myName || '' });
      else await api('POST', '/api/orders', { number: 'O-' + Date.now().toString(36).toUpperCase(), customer: q.customer, amount: q.total, total: q.total, lines: q.lines || [], status: 'new' });
    }
    await loadQuotes(); toast(t('saved'));
  } catch (e) { /* toasted */ }
}

/* ================= 14. Orders / shipments / invoices ================= */
async function loadOrders() { await Promise.all([loadColl('orders'), loadColl('shipments'), loadColl('payments'), loadColl('inventory')]); renderOrders(); }
function renderOrders() {
  const board = $('orderBoard'); if (!board) return;
  const orders = coll('orders');
  const warnings = coll('inventory').filter(i => (i.stock || 0) < (i.safeStock || 0));
  board.innerHTML = (warnings.length ? `<div class="warn">${esc(t('orderWarnings'))}: ${warnings.map(w => esc(w.name || w.sku || '')).join(', ')}</div>` : '') +
    (orders.length ? orders.map(o => {
      const pct = o.progress != null ? o.progress : Math.round(((o.stocking || 0) + (o.qc || 0) + (o.inspection || 0) + (o.packing || 0)) / 4);
      return `<div class="order-card" data-order="${esc(o.id)}">
        <b>${esc(o.number || o.id || '')}</b> · ${esc(o.customer || o.company || '')} · ${fmtMoney(o.amount || o.total)}
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="order-steps">${esc(t('stocking'))} ${o.stocking || 0}% · ${esc(t('qc'))} ${o.qc || 0}% · ${esc(t('inspection'))} ${o.inspection || 0}% · ${esc(t('packing'))} ${o.packing || 0}%</div>
        <div class="card-actions"><button data-order-doc="${esc(o.id)}" data-doc="pi">${esc(t('pi'))}</button>
        <button data-order-doc="${esc(o.id)}" data-doc="ci">${esc(t('ci'))}</button>
        <button data-order-doc="${esc(o.id)}" data-doc="packing">${esc(t('packingList'))}</button>
        <button data-order-edit="${esc(o.id)}">${esc(t('edit'))}</button></div></div>`;
    }).join('') : emptyState('emptyOrders'));
  board.querySelectorAll('[data-order-doc]').forEach(b => b.addEventListener('click', () => showOrderDoc(b.getAttribute('data-order-doc'), b.getAttribute('data-doc'))));
  board.querySelectorAll('[data-order-edit]').forEach(b => b.addEventListener('click', () => openOrderForm(b.getAttribute('data-order-edit'))));
}
function showOrderDoc(id, kind) {
  const o = coll('orders').find(x => x.id === id); if (!o) return;
  const title = kind === 'pi' ? t('pi') : kind === 'ci' ? t('ci') : t('packingList');
  const lines = (o.lines || []).map(l => `<tr><td>${esc(l.product || '')}</td><td>${l.qty || ''}</td><td>${fmtMoney(l.price)}</td><td>${fmtMoney((+l.qty || 0) * (+l.price || 0))}</td></tr>`).join('');
  openModal(title + ' — ' + (o.number || o.id || ''), `<div class="doc">
    <p><b>${esc(o.customer || o.company || '')}</b> · ${esc(o.number || '')} · ${esc(o.date || todayStr())}</p>
    <table><thead><tr><th>${esc(t('product'))}</th><th>Qty</th><th>${esc(t('price'))}</th><th>${esc(t('total'))}</th></tr></thead><tbody>${lines || `<tr><td colspan="4">${emptyState('emptyDefault')}</td></tr>`}</tbody></table>
    <p><b>${esc(t('total'))}: ${fmtMoney(o.amount || o.total)}</b></p>
    <p>${esc(t('shipments'))}: ${(coll('shipments').filter(s => s.orderId === id).map(s => s.tracking || s.status || '').join(', ') || '—')}</p>
    <p>${esc(t('payments'))}: ${(coll('payments').filter(p => p.orderId === id).map(p => fmtMoney(p.amount) + ' ' + (p.status || '')).join(', ') || '—')}</p></div>`);
}
function openOrderForm(id) {
  const o = id ? coll('orders').find(x => x.id === id) : null;
  openModal(o ? t('edit') : t('addOrder'), modalForm(
    field(t('company'), 'of-customer', o && (o.customer || o.company)) +
    field(t('amount'), 'of-amount', o && (o.amount || o.total), 'number') +
    field(t('stocking') + ' %', 'of-stocking', o && o.stocking, 'number') +
    field(t('qc') + ' %', 'of-qc', o && o.qc, 'number') +
    field(t('inspection') + ' %', 'of-inspection', o && o.inspection, 'number') +
    field(t('packing') + ' %', 'of-packing', o && o.packing, 'number')));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = { customer: $('of-customer').value, amount: +$('of-amount').value || 0, total: +$('of-amount').value || 0, stocking: +$('of-stocking').value || 0, qc: +$('of-qc').value || 0, inspection: +$('of-inspection').value || 0, packing: +$('of-packing').value || 0 };
    try {
      const r = o ? await api('PUT', '/api/orders/' + o.id, body) : await api('POST', '/api/orders', Object.assign({ number: 'O-' + Date.now().toString(36).toUpperCase(), status: 'new' }, body));
      if (r && r.warnings && r.warnings.length) toast(t('orderWarnings') + ': ' + r.warnings.join(', '));
      closeModal(); await loadOrders(); toast(t('saved'));
    } catch (err) { /* toasted */ }
  });
}
window.openOrderForm = openOrderForm;
async function loadShipments() { await Promise.all([loadColl('shipments'), loadColl('orders')]); const pg = $('page-shipments'); if (!pg) return; let d = pg.querySelector('.ship-list'); if (!d) { d = document.createElement('div'); d.className = 'ship-list'; pg.appendChild(d); } const rows = coll('shipments'); d.innerHTML = rows.length ? rows.map(s => `<div>${esc(s.orderId || '')} · ${esc(s.carrier || '')} · ${esc(s.tracking || '')} · ${esc(s.status || '')}</div>`).join('') : emptyState('emptyDefault'); }
async function loadInvoices() { await loadColl('invoices'); const pg = $('page-invoices'); if (!pg) return; let d = pg.querySelector('.inv-list'); if (!d) { d = document.createElement('div'); d.className = 'inv-list'; pg.appendChild(d); } const rows = coll('invoices'); d.innerHTML = rows.length ? rows.map(i => `<div>${esc(i.number || i.id || '')} · ${esc(i.customer || '')} · ${fmtMoney(i.amount)} · ${esc(i.status || '')} · ${esc(i.due || '')}</div>`).join('') : emptyState('emptyDefault'); }

/* ================= 15. Finance ================= */
async function loadFinance() {
  let fin = null;
  try { fin = await apiGet('/api/finance'); } catch (e) { fin = null; }
  await Promise.all([loadColl('invoices'), loadColl('payments'), loadColl('orders')]);
  renderFinance(fin);
}
function renderFinance(fin) {
  const root = $('page-finance'); if (!root) return;
  const invoices = coll('invoices'), payments = coll('payments');
  const receivable = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (+i.amount || 0), 0);
  const received = payments.reduce((s, p) => s + (+p.amount || 0), 0);
  const overdueAmt = invoices.filter(i => i.status !== 'paid' && i.due && isOverdue(i.due)).reduce((s, i) => s + (+i.amount || 0), 0);
  const byMonth = {};
  payments.forEach(p => { const m = String(p.date || p.time || '').slice(0, 7); if (m) byMonth[m] = (byMonth[m] || 0) + (+p.amount || 0); });
  const months = Object.keys(byMonth).sort().slice(-6);
  const maxM = Math.max(1, ...months.map(m => byMonth[m]));
  const trend = $('financeTrend');
  const html = `<div class="finance-summary">
    <div class="card stat"><b>${fmtMoney(fin && fin.receivable != null ? fin.receivable : receivable)}</b><span>${esc(t('receivable'))}</span></div>
    <div class="card stat"><b>${fmtMoney(fin && fin.received != null ? fin.received : received)}</b><span>${esc(t('received'))}</span></div>
    <div class="card stat"><b class="over">${fmtMoney(fin && fin.overdue != null ? fin.overdue : overdueAmt)}</b><span>${esc(t('overdueAmount'))}</span></div></div>
    <h4>${esc(t('monthlyTrend'))}</h4>
    ${months.length ? months.map(m => `<div class="bar-row"><span>${esc(m)}</span><div class="bar"><i style="width:${Math.round(byMonth[m] / maxM * 100)}%"></i></div><b>${fmtMoney(byMonth[m])}</b></div>`).join('') : emptyState('emptyDefault')}`;
  if (trend) trend.innerHTML = html;
  else { let d = root.querySelector('.finance-body'); if (!d) { d = document.createElement('div'); d.className = 'finance-body'; root.appendChild(d); } d.innerHTML = html; }
}

/* ================= 16. Inventory ================= */
async function loadInventory() { await Promise.all([loadColl('inventory'), loadColl('stockMoves'), loadColl('products')]); renderInventory(); }
function renderInventory() {
  const body = $('inventoryBody'); const tbl = $('inventoryTable');
  const rows = coll('inventory');
  const html = rows.length ? rows.map(i => {
    const short = (i.stock || 0) < (i.safeStock || 0);
    return `<tr class="${short ? 'over' : ''}"><td>${esc(i.sku || '')}</td><td>${esc(i.name || '')}</td>
      <td>${i.stock != null ? i.stock : ''}</td><td>${i.inTransit != null ? i.inTransit : ''}</td>
      <td>${i.safeStock != null ? i.safeStock : ''}</td>
      <td>${short ? esc(t('shortage')) : ''}</td>
      <td><button class="ghost" data-inv-move="${esc(i.id)}">${esc(t('stockIn'))}/${esc(t('stockOut'))}</button>
      <button class="ghost" data-inv-tiers="${esc(i.id)}">${esc(t('tierPrices'))}</button></td></tr>`;
  }).join('') : `<tr><td colspan="7">${emptyState('emptyInventory')}</td></tr>`;
  if (body) body.innerHTML = html; else if (tbl) tbl.innerHTML = `<tbody>${html}</tbody>`;
  const log = $('stockLog');
  if (log) { const moves = coll('stockMoves'); log.innerHTML = moves.length ? moves.slice(-20).reverse().map(m => `<div>${esc(m.time || m.date || '')} · ${esc(m.sku || '')} · ${esc(m.type || '')} ${m.qty || ''}</div>`).join('') : emptyState('emptyLog'); }
  qsa('[data-inv-move]').forEach(b => b.addEventListener('click', () => openStockMoveForm(b.getAttribute('data-inv-move'))));
  qsa('[data-inv-tiers]').forEach(b => b.addEventListener('click', () => openTierEditor(b.getAttribute('data-inv-tiers'))));
}
function openStockMoveForm(id) {
  const item = coll('inventory').find(x => x.id === id);
  openModal(t('stockIn') + '/' + t('stockOut'), modalForm(
    `<label class="f">${esc(t('stockIn'))}/${esc(t('stockOut'))}<select id="sm-type"><option value="in">${esc(t('stockIn'))}</option><option value="out">${esc(t('stockOut'))}</option></select></label>` +
    field('Qty', 'sm-qty', '', 'number')));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const qty = +$('sm-qty').value || 0; const type = $('sm-type').value;
    try {
      await api('POST', '/api/stockMoves', { inventoryId: id, sku: item && item.sku, type, qty, time: new Date().toISOString() });
      if (item) await api('PUT', '/api/inventory/' + id, { stock: (item.stock || 0) + (type === 'in' ? qty : -qty) });
      closeModal(); await loadInventory(); toast(t('saved'));
    } catch (err) { /* toasted */ }
  });
}
function openTierEditor(id) {
  const item = coll('inventory').find(x => x.id === id) || coll('products').find(x => x.id === id);
  const tiers = (item && item.tiers) || [];
  openModal(t('tierPrices'), modalForm(field(t('tierPrices') + ' (qty:price, …)', 'te-tiers', tiers.map(x => (x.qty || '') + ':' + (x.price || '')).join(', '))));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const tiers2 = $('te-tiers').value.split(',').map(s => s.trim()).filter(Boolean).map(s => { const [qty, price] = s.split(':'); return { qty: +qty || 0, price: +price || 0 }; });
    try { await api('PUT', '/api/inventory/' + id, { tiers: tiers2 }); closeModal(); await loadInventory(); toast(t('saved')); } catch (err) { /* toasted */ }
  });
}

/* ================= 17. Inbox + Chat ================= */
const CHANNELS = ['whatsapp', 'wechat', 'email', 'site', 'instagram', 'facebook'];
const LANG_LABELS = { en: 'English', zh: '中文', es: 'Español', fr: 'Français', de: 'Deutsch', ar: 'العربية', pt: 'Português', ja: '日本語', ko: '한국어' };
function langLabel(code) { return LANG_LABELS[code] || code || 'English'; }
async function loadInbox() {
  await Promise.all([loadColl('messages'), loadColl('customers')]);
  renderChannelChips(); renderInboxThreads();
}
function renderChannelChips() {
  const chips = $('channelChips'); if (!chips) return;
  const all = [{ id: '', key: 'inboxAll' }].concat(CHANNELS.map(c => ({ id: c, key: 'channel' + c.charAt(0).toUpperCase() + c.slice(1) })));
  chips.innerHTML = all.map(c => `<button class="chip${state.chatChannel === c.id ? ' on' : ''}" data-channel="${esc(c.id)}">${esc(t(c.key))}</button>`).join('');
  chips.querySelectorAll('[data-channel]').forEach(b => b.addEventListener('click', () => { state.chatChannel = b.getAttribute('data-channel'); renderChannelChips(); renderInboxThreads(); }));
}
function renderInboxThreads() {
  const box = $('inboxThreads'); if (!box) return;
  let msgs = coll('messages');
  if (state.chatChannel) msgs = msgs.filter(m => m.channel === state.chatChannel);
  const byCust = {};
  msgs.forEach(m => { const k = m.customerId || 'unknown'; if (!byCust[k] || String(m.time || '') > String(byCust[k].time || '')) byCust[k] = m; });
  const list = Object.values(byCust).sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
  box.innerHTML = list.length ? list.map(m => {
    const c = coll('customers').find(x => x.id === m.customerId);
    return `<div class="thread" data-thread="${esc(m.customerId || '')}">
      <b>${esc(c ? (c.company || c.contact || '') : (m.customerId || ''))}</b>
      <span class="chip">${esc(m.channel || '')}</span>
      <div>${esc((m.originalBody || m.body || '').slice(0, 80))}</div>
      <small>${esc(m.time || '')}${m.dir === 'in' && !m.read ? ' · ' + esc(t('unread')) : ''}</small></div>`;
  }).join('') : emptyState('emptyThreads');
  box.querySelectorAll('[data-thread]').forEach(el => el.addEventListener('click', () => openChatThread(el.getAttribute('data-thread'))));
}
async function loadChat() {
  await Promise.all([loadColl('customers'), loadColl('messages'), loadColl('drafts')]);
  renderThreadList();
  // Guard: openChatThread() also routes through showPage('chat') → loadChat,
  // so only auto-open once per selected customer to avoid a re-entrancy loop.
  if (state.currentCustomerId && state._chatThreadOpen !== state.currentCustomerId) {
    state._chatThreadOpen = state.currentCustomerId;
    await openChatThread(state.currentCustomerId, true);
  } else if (!state.currentCustomerId) { const h = $('chatHeader'); if (h) h.textContent = t('pageChat'); }
}
function renderThreadList() {
  const box = $('threadList'); if (!box) return;
  const customers = coll('customers');
  const unreadByCust = {};
  coll('messages').forEach(m => { if (m.dir === 'in' && !m.read) unreadByCust[m.customerId] = (unreadByCust[m.customerId] || 0) + 1; });
  box.innerHTML = customers.length ? customers.map(c => {
    const n = unreadByCust[c.id] || 0;
    return `<div class="thread${state.currentCustomerId === c.id ? ' on' : ''}" data-thread="${esc(c.id)}">
      <b>${esc(c.company || c.contact || '')}</b>${n ? ` <span class="badge">${n}</span>` : ''}
      <div><small>${esc(c.country || '')} · ${esc(langLabel(c.peerLang))}</small></div></div>`;
  }).join('') : emptyState('emptyThreads');
  box.querySelectorAll('[data-thread]').forEach(el => el.addEventListener('click', () => openChatThread(el.getAttribute('data-thread'))));
}
function messageHtml(m) {
  const time = fmtTime(m.time || '') || String(m.time || '').slice(0, 16);
  const lang = langLabel(m.lang);
  if (m.dir === 'in') {
    return `<div class="msg in"><div class="msg-body">${esc(m.originalBody || m.body || '')}</div>
      ${m.translatedBody ? `<div class="msg-trans">${esc(t('translatedAs'))}${esc(m.translatedBody)}</div>` : ''}
      <div class="msg-meta">${esc(time)} · <span class="msg-lang">${esc(lang)}</span></div></div>`;
  }
  return `<div class="msg out"><div class="msg-body">${esc(m.translatedBody || m.body || '')}</div>
    ${m.originalBody ? `<div class="msg-trans">${esc(t('originalZh'))}${esc(m.originalBody)}</div>` : ''}
    <div class="msg-meta">${esc(time)} · <span class="msg-lang">${esc(lang)}</span></div></div>`;
}
async function openChatThread(customerId, keepDraft) {
  if (!customerId) return;
  state.currentCustomerId = customerId;
  state._chatThreadOpen = customerId;
  if (state.currentPage !== 'chat') showPage('chat');
  const c = coll('customers').find(x => x.id === customerId);
  const header = $('chatHeader');
  if (header && c) header.textContent = (c.company || c.contact || '') + ' · ' + langLabel(c.peerLang || 'en');
  let msgs = [];
  try { const d = await apiGet('/api/chat/messages?customerId=' + encodeURIComponent(customerId)); msgs = Array.isArray(d) ? d : (d.messages || []); }
  catch (e) { msgs = coll('messages').filter(m => m.customerId === customerId); }
  msgs.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const box = $('chatMessages');
  if (box) box.innerHTML = msgs.length ? msgs.map(messageHtml).join('') : emptyState('emptyMessages');
  if (box) box.scrollTop = box.scrollHeight;
  renderThreadList();
  await restoreDraft(customerId);
  // mark incoming as read (best effort)
  msgs.filter(m => m.dir === 'in' && !m.read).forEach(m => { api('PUT', '/api/messages/' + m.id, { read: true }).catch(() => {}); });
}
window.openChatThread = openChatThread;
async function restoreDraft(customerId) {
  const input = $('chatInput'); const hint = $('draftHint'); if (!input) return;
  let draft = null;
  try { const d = await apiGet('/api/chat/drafts'); const arr = Array.isArray(d) ? d : (d.drafts || []); draft = arr.find(x => x.customerId === customerId); } catch (e) { draft = null; }
  if (!draft) { const local = state.DB._drafts || {}; draft = local[customerId]; }
  if (draft && draft.body) {
    input.value = draft.body;
    if (hint) hint.textContent = t('draftSaved', { time: fmtTime(draft.updatedAt || draft.time || '') || '' });
  } else if (!draft) { input.value = ''; if (hint) hint.textContent = ''; }
}
const saveDraftDebounced = debounce(async () => {
  const input = $('chatInput'); if (!input || !state.currentCustomerId) return;
  const body = input.value;
  const hint = $('draftHint');
  try {
    await api('POST', '/api/chat/drafts', { customerId: state.currentCustomerId, body });
    if (hint) hint.textContent = t('draftSaved', { time: new Date().toTimeString().slice(0, 5) });
  } catch (e) {
    state.DB._drafts = state.DB._drafts || {}; state.DB._drafts[state.currentCustomerId] = { customerId: state.currentCustomerId, body, updatedAt: new Date().toISOString() };
    if (hint) hint.textContent = t('draftSaved', { time: new Date().toTimeString().slice(0, 5) });
  }
}, 500);
const translatePreviewDebounced = debounce(async () => {
  const input = $('chatInput'); const prev = $('translatePreview'); if (!input || !prev) return;
  const text = input.value.trim(); if (!text) { prev.textContent = ''; return; }
  const c = coll('customers').find(x => x.id === state.currentCustomerId);
  const target = (c && c.peerLang) || 'en';
  try {
    const r = await api('POST', '/api/translate', { text, target });
    prev.textContent = t('translateHint', { lang: langLabel(target) }) + ': ' + (r.translated || r.translation || text);
  } catch (e) { prev.textContent = t('translateHint', { lang: langLabel(target) }); }
}, 400);
function bindChatComposer() {
  const input = $('chatInput'); if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('input', () => { saveDraftDebounced(); translatePreviewDebounced(); });
  const sendBtn = $('btnChatSend');
  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } });
  const sug = $('btnAiSuggest');
  if (sug) sug.addEventListener('click', aiSuggest);
}
async function sendChatMessage() {
  const input = $('chatInput'); if (!input || !state.currentCustomerId) return;
  const chineseText = input.value.trim(); if (!chineseText) return;
  const c = coll('customers').find(x => x.id === state.currentCustomerId);
  const channel = state.chatChannel || 'whatsapp';
  try {
    const r = await api('POST', '/api/chat/send', { customerId: state.currentCustomerId, channel, chineseText });
    const msg = r.message || r;
    if (msg && msg.id) state.DB.messages = (state.DB.messages || []).concat([msg]);
    input.value = '';
    const prev = $('translatePreview'); if (prev) prev.textContent = '';
    const hint = $('draftHint'); if (hint) hint.textContent = '';
    const panel = $('aiPanel'); if (panel) panel.innerHTML = '';
    try { await api('DELETE', '/api/chat/drafts/' + encodeURIComponent(state.currentCustomerId)); } catch (e) { if (state.DB._drafts) delete state.DB._drafts[state.currentCustomerId]; }
    await openChatThread(state.currentCustomerId, true);
    toast(t('sent'));
  } catch (e) { /* toasted */ }
}
window.sendChatMessage = sendChatMessage;
async function aiSuggest() {
  if (!state.currentCustomerId) return;
  const panel = $('aiPanel'); if (panel) panel.innerHTML = '<div class="loading">…</div>';
  try {
    const r = await api('POST', '/api/chat/suggest', { customerId: state.currentCustomerId });
    const replyZh = r.replyZh || r.reply_zh || '';
    const reasoning = r.reasoning || '';
    const evidence = r.evidence || [];
    if (panel) panel.innerHTML = `<div class="ai-panel">
      <div class="ai-only">${esc(t('aiOnlyYou'))}</div>
      <div><b>${esc(t('replyZh'))}:</b> ${esc(replyZh)}</div>
      ${reasoning ? `<div><b>${esc(t('reasoning'))}:</b> ${esc(reasoning)}</div>` : ''}
      ${evidence.length ? `<div><b>${esc(t('evidence'))}:</b><ul>${evidence.map(x => `<li>${esc(typeof x === 'string' ? x : (x.text || x.title || JSON.stringify(x)))}</li>`).join('')}</ul></div>` : ''}
      <div class="card-actions"><button id="aiUseDraft">${esc(t('useDraft'))}</button><button id="aiSendDirect">${esc(t('sendDirect'))}</button></div></div>`;
    const useBtn = $('aiUseDraft'); if (useBtn) useBtn.addEventListener('click', () => { const input = $('chatInput'); if (input) { input.value = replyZh; input.dispatchEvent(new Event('input')); } });
    const sendBtn = $('aiSendDirect'); if (sendBtn) sendBtn.addEventListener('click', async () => { const input = $('chatInput'); if (input) input.value = replyZh; await sendChatMessage(); });
  } catch (e) { if (panel) panel.innerHTML = emptyState('emptyDefault'); }
}
window.aiSuggest = aiSuggest;
// simulate incoming message (used by integration test-send + manual testing)
async function simulateIncoming(customerId, text) {
  try {
    const r = await api('POST', '/api/chat/incoming', { customerId, channel: state.chatChannel || 'whatsapp', text });
    if (state.currentCustomerId === customerId) await openChatThread(customerId, true);
    return r;
  } catch (e) { return null; }
}
window.simulateIncoming = simulateIncoming;

/* ================= 18. Prospecting ================= */
const AI_PRESETS = {
  OpenAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  Anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
  Gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-1.5-flash' },
  Groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile' },
  xAI: { baseUrl: 'https://api.x.ai/v1', model: 'grok-beta' },
  Mistral: { baseUrl: 'https://api.mistral.ai/v1', model: 'mistral-large-latest' },
  Together: { baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
  Moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  GLM: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  Qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  StepFun: { baseUrl: 'https://api.stepfun.com/v1', model: 'step-1-8k' },
  Ollama: { baseUrl: 'http://localhost:11434/v1', model: 'llama3.1' },
  OpenRouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  Custom: { baseUrl: '', model: '' }
};
const PROSPECT_SOURCES = ['google', 'maps', 'linkedin', 'alibaba', 'madeinchina', 'globalsources', 'tradeshows', 'instagram', 'facebook', 'x', 'directories', 'importdata', 'website', 'referral'];
async function loadProspects() {
  await Promise.all([loadColl('prospects'), loadColl('miningRuns')]);
  renderProspects();
}
function renderProspects() {
  const pg = $('page-prospects'); if (!pg) return;
  const ai = (state.settings.aiProvider || {});
  const hasKey = !!ai.apiKey || !!ai.hasKey;
  let form = pg.querySelector('.prospect-form');
  if (!form) {
    form = document.createElement('div'); form.className = 'prospect-form';
    form.innerHTML = `
      <div class="demo-banner" id="prospectDemo"></div>
      <h4>${esc(t('provider'))}</h4>
      <label class="f">${esc(t('provider'))}<select id="aiProvider">${Object.keys(AI_PRESETS).map(p => `<option>${p}</option>`).join('')}</select></label>
      <label class="f">${esc(t('baseUrl'))}<input id="aiBaseUrl"></label>
      <label class="f">${esc(t('model'))}<input id="aiModel"></label>
      <label class="f">${esc(t('apiKey'))}<input id="aiKey" type="password" placeholder="sk-…"><small>${esc(t('noKeySaved'))}</small></label>
      <button id="aiSave">${esc(t('saveSettings'))}</button>
      <h4>${esc(t('prospectSources'))}</h4>
      <div id="prospectSources">${PROSPECT_SOURCES.map(s => `<label><input type="checkbox" value="${s}" checked> ${esc(t('source' + s.charAt(0).toUpperCase() + s.slice(1)))}</label>`).join('')}</div>
      <label class="f">${esc(t('product'))}<input id="prospectProduct" placeholder="LED, optical module…"></label>
      <label class="f">${esc(t('country'))}<input id="prospectCountry" placeholder="US, DE…"></label>
      <button id="prospectRun">${esc(t('prospectRun'))}</button>
      <button id="prospectImportBtn">${esc(t('prospectImport'))}</button>
      <div id="prospectResults"></div><div id="miningLog"></div>`;
    pg.appendChild(form);
    const prov = $('aiProvider');
    prov.value = ai.provider || 'OpenAI';
    const applyPreset = () => { const p = AI_PRESETS[prov.value] || {}; if (!$('aiBaseUrl').value || $('aiBaseUrl').dataset.preset) { $('aiBaseUrl').value = p.baseUrl || ''; $('aiBaseUrl').dataset.preset = '1'; } if (!$('aiModel').value || $('aiModel').dataset.preset) { $('aiModel').value = p.model || ''; $('aiModel').dataset.preset = '1'; } };
    prov.addEventListener('change', () => { $('aiBaseUrl').dataset.preset = ''; $('aiModel').dataset.preset = ''; applyPreset(); });
    $('aiBaseUrl').value = ai.baseUrl || (AI_PRESETS[prov.value] || {}).baseUrl || '';
    $('aiModel').value = ai.model || (AI_PRESETS[prov.value] || {}).model || '';
    $('aiBaseUrl').addEventListener('input', () => { $('aiBaseUrl').dataset.preset = ''; });
    $('aiModel').addEventListener('input', () => { $('aiModel').dataset.preset = ''; });
    $('aiSave').addEventListener('click', async () => {
      const key = $('aiKey').value.trim();
      state.settings.aiProvider = { provider: prov.value, baseUrl: $('aiBaseUrl').value.trim(), model: $('aiModel').value.trim(), apiKey: key || ai.apiKey || '' };
      await saveSettings(); toast(key ? t('keySaved') : t('settingsSaved')); renderProspects();
    });
    $('prospectRun').addEventListener('click', runProspecting);
    $('prospectImportBtn').addEventListener('click', () => bulkImportProspects());
  }
  const demo = $('prospectDemo');
  if (demo) { demo.style.display = hasKey ? 'none' : 'block'; demo.textContent = t('demoBanner'); }
  const res = $('prospectResults');
  if (res) {
    const rows = coll('prospects');
    res.innerHTML = rows.length ? `<table><thead><tr><th>${esc(t('company'))}</th><th>${esc(t('country'))}</th><th>${esc(t('score'))}</th><th>${esc(t('email'))}</th><th></th></tr></thead><tbody>` +
      rows.map(p => `<tr><td>${esc(p.company || '')}</td><td>${esc(p.country || '')}</td><td>${p.score != null ? p.score : ''}</td><td>${esc(p.email || '')}</td><td><button class="ghost" data-pros-lead="${esc(p.id)}">${esc(t('convertCustomer'))}</button></td></tr>`).join('') + '</tbody></table>' : emptyState('emptyProspects');
    res.querySelectorAll('[data-pros-lead]').forEach(b => b.addEventListener('click', async () => {
      const p = coll('prospects').find(x => x.id === b.getAttribute('data-pros-lead')); if (!p) return;
      try { await api('POST', '/api/leads', { name: p.contact || '', company: p.company, country: p.country, email: p.email, phone: p.phone, product: p.product || '', status: 'new', source: 'prospecting', value: 0, custom: {} }); toast(t('saved')); } catch (e) { /* toasted */ }
    }));
  }
  const log = $('miningLog');
  if (log) { const runs = coll('miningRuns'); log.innerHTML = runs.length ? runs.slice(-10).reverse().map(r => `<div>${esc(r.time || r.createdAt || '')} · ${esc(r.provider || '')} · ${esc(String(r.count != null ? r.count : ''))} · ${esc(r.status || '')}</div>`).join('') : emptyState('emptyLog'); }
}
async function runProspecting() {
  const sources = qsa('#prospectSources input:checked').map(x => x.value);
  const product = ($('prospectProduct') || {}).value || '';
  const country = ($('prospectCountry') || {}).value || '';
  const ai = state.settings.aiProvider || {};
  toast(t('runStarted'));
  try {
    const r = await api('POST', '/api/prospecting/run', { sources, product, country, provider: ai.provider, model: ai.model });
    const items = Array.isArray(r) ? r : (r.prospects || r.items || []);
    if (items.length) { for (const p of items) { try { await api('POST', '/api/prospects', p); } catch (e) { /* continue */ } } }
    try { await api('POST', '/api/miningRuns', { provider: ai.provider || '', count: items.length, status: 'done', time: new Date().toISOString() }); } catch (e) { /* ignore */ }
    await loadProspects();
  } catch (e) { /* toasted */ }
}
async function bulkImportProspects() {
  const rows = coll('prospects'); if (!rows.length) { toast(t('emptyProspects')); return; }
  const existing = new Set(coll('leads').map(l => (l.email || '') + '|' + (l.company || '')));
  let imported = 0, dup = 0;
  for (const p of rows) {
    const key = (p.email || '') + '|' + (p.company || '');
    if (p.email && existing.has(key)) { dup++; continue; }
    existing.add(key);
    try { await api('POST', '/api/leads', { name: p.contact || '', company: p.company, country: p.country, email: p.email, phone: p.phone, product: p.product || '', status: 'new', source: 'prospecting', value: 0, custom: {} }); imported++; } catch (e) { /* continue */ }
  }
  toast(t('importedOk', { n: imported, d: dup }));
}

/* ================= 19. Marketing / segments / cases / knowledge / calendar / reports ================= */
async function loadMarketing() { await Promise.all([loadColl('campaigns'), loadColl('scheduledPosts'), loadColl('segments')]); renderMarketing(); }
function renderMarketing() {
  const pg = $('page-marketing'); if (!pg) return;
  let d = pg.querySelector('.marketing-body');
  if (!d) { d = document.createElement('div'); d.className = 'marketing-body'; pg.appendChild(d); }
  const camps = coll('campaigns');
  d.innerHTML = `<button id="mkNew">${esc(t('campaignNew'))}</button>
    ${camps.length ? camps.map(c => `<div class="card"><b>${esc(c.name || '')}</b> · ${esc(c.status || '')} · ${esc(t('openRate'))} ${c.openRate != null ? c.openRate + '%' : '—'} · ${esc(t('clickRate'))} ${c.clickRate != null ? c.clickRate + '%' : '—'}
      <button class="ghost" data-camp-send="${esc(c.id)}">${esc(t('campaignSend'))}</button></div>`).join('') : emptyState('emptyCampaigns')}
    <h4>${esc(t('schedule'))}</h4>
    ${coll('scheduledPosts').length ? coll('scheduledPosts').map(p => `<div>${esc(p.date || p.time || '')} · ${esc(p.title || p.content || '')}</div>`).join('') : emptyState('emptyDefault')}`;
  const nb = $('mkNew'); if (nb) nb.addEventListener('click', () => openCampaignForm());
  d.querySelectorAll('[data-camp-send]').forEach(b => b.addEventListener('click', async () => {
    try { await api('PUT', '/api/campaigns/' + b.getAttribute('data-camp-send'), { status: 'sent', openRate: 0, clickRate: 0 }); await loadMarketing(); toast(t('sent')); } catch (e) { /* toasted */ }
  }));
}
function openCampaignForm() {
  openModal(t('campaignNew'), modalForm(field(t('name'), 'cf-name', '') + field(t('campaignNew'), 'cf-subject', '') + field(t('segments'), 'cf-segment', '')));
  const form = $('modalForm'); if (!form) return;
  form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/campaigns', { name: $('cf-name').value, subject: $('cf-subject').value, segment: $('cf-segment').value, status: 'draft', openRate: 0, clickRate: 0 }); closeModal(); await loadMarketing(); toast(t('saved')); } catch (err) { /* toasted */ } });
}
async function loadSegments() { await loadColl('segments'); renderSegments(); }
function renderSegments() {
  const pg = $('page-segments'); if (!pg) return;
  let d = pg.querySelector('.segment-body');
  if (!d) { d = document.createElement('div'); d.className = 'segment-body'; pg.appendChild(d); }
  const rows = coll('segments');
  d.innerHTML = `<button id="segNew">${esc(t('segmentNew'))}</button>` +
    (rows.length ? rows.map(s => `<div class="card"><b>${esc(s.name || '')}</b> · ${esc(s.rule || s.condition || '')} · ${s.count != null ? s.count : ''} <button class="ghost" data-seg-del="${esc(s.id)}">${esc(t('del'))}</button></div>`).join('') : emptyState('emptySegments'));
  const nb = $('segNew'); if (nb) nb.addEventListener('click', () => {
    openModal(t('segmentNew'), modalForm(field(t('name'), 'sf-name', '') + field(t('segments'), 'sf-rule', '')));
    const form = $('modalForm'); if (form) form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/segments', { name: $('sf-name').value, rule: $('sf-rule').value }); closeModal(); await loadSegments(); toast(t('saved')); } catch (err) { /* toasted */ } });
  });
  d.querySelectorAll('[data-seg-del]').forEach(b => b.addEventListener('click', () => confirmDlg(t('confirmDelete'), async () => { try { await api('DELETE', '/api/segments/' + b.getAttribute('data-seg-del')); await loadSegments(); } catch (e) { /* toasted */ } })));
}
async function loadCases() { await loadColl('cases'); renderCases(); }
function renderCases() {
  const pg = $('page-cases'); if (!pg) return;
  let d = pg.querySelector('.case-body');
  if (!d) { d = document.createElement('div'); d.className = 'case-body'; pg.appendChild(d); }
  const rows = coll('cases');
  const flow = ['open', 'progress', 'resolved', 'closed'];
  d.innerHTML = `<button id="caseNew">${esc(t('caseNew'))}</button>` +
    (rows.length ? rows.map(c => {
      const i = flow.indexOf(c.status || 'open');
      const next = flow[Math.min(flow.length - 1, i + 1)];
      return `<div class="card"><b>${esc(c.title || c.subject || '')}</b> · ${esc(c.customer || '')} · ${esc(t('case' + (c.status || 'open').charAt(0).toUpperCase() + (c.status || 'open').slice(1)))}
        <button class="ghost" data-case-next="${esc(c.id)}" data-next="${next}">${esc(t('case' + next.charAt(0).toUpperCase() + next.slice(1)))}</button></div>`;
    }).join('') : emptyState('emptyCases'));
  const nb = $('caseNew'); if (nb) nb.addEventListener('click', () => {
    openModal(t('caseNew'), modalForm(field(t('name'), 'cs-title', '') + field(t('company'), 'cs-customer', '')));
    const form = $('modalForm'); if (form) form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/cases', { title: $('cs-title').value, customer: $('cs-customer').value, status: 'open' }); closeModal(); await loadCases(); toast(t('saved')); } catch (err) { /* toasted */ } });
  });
  d.querySelectorAll('[data-case-next]').forEach(b => b.addEventListener('click', async () => {
    try { await api('PUT', '/api/cases/' + b.getAttribute('data-case-next'), { status: b.getAttribute('data-next') }); await loadCases(); } catch (e) { /* toasted */ }
  }));
}
async function loadKnowledge() { await loadColl('documents'); renderKnowledge(); }
function renderKnowledge() {
  const pg = $('page-knowledge'); if (!pg) return;
  let d = pg.querySelector('.kb-body');
  if (!d) { d = document.createElement('div'); d.className = 'kb-body'; pg.appendChild(d); }
  const rows = coll('documents');
  d.innerHTML = `<button id="docNew">${esc(t('docNew'))}</button>` +
    (rows.length ? rows.map(doc => `<div class="card">📄 <b>${esc(doc.title || '')}</b> · ${esc(doc.category || '')} · ${esc(doc.version || 'v1')}
      <button class="ghost" data-doc-hist="${esc(doc.id)}">${esc(t('docHistory'))}</button>
      <button class="ghost" data-doc-bump="${esc(doc.id)}">v+</button></div>`).join('') : emptyState('emptyDocs'));
  const nb = $('docNew'); if (nb) nb.addEventListener('click', () => {
    openModal(t('docNew'), modalForm(field(t('name'), 'dk-title', '') + field(t('segments'), 'dk-cat', '')));
    const form = $('modalForm'); if (form) form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/documents', { title: $('dk-title').value, category: $('dk-cat').value, version: 'v1', updated: todayStr(), history: [{ version: 'v1', date: todayStr() }] }); closeModal(); await loadKnowledge(); toast(t('saved')); } catch (err) { /* toasted */ } });
  });
  d.querySelectorAll('[data-doc-bump]').forEach(b => b.addEventListener('click', async () => {
    const doc = coll('documents').find(x => x.id === b.getAttribute('data-doc-bump')); if (!doc) return;
    const v = parseInt(String(doc.version || 'v1').replace(/\D/g, '') || '1', 10) + 1;
    const hist = (doc.history || []).concat([{ version: 'v' + v, date: todayStr() }]);
    try { await api('PUT', '/api/documents/' + doc.id, { version: 'v' + v, updated: todayStr(), history: hist }); await loadKnowledge(); } catch (e) { /* toasted */ }
  }));
  d.querySelectorAll('[data-doc-hist]').forEach(b => b.addEventListener('click', () => {
    const doc = coll('documents').find(x => x.id === b.getAttribute('data-doc-hist')); if (!doc) return;
    const hist = doc.history || [{ version: doc.version || 'v1', date: doc.updated || '' }];
    openModal(t('docHistory'), hist.map(h => `<div>${esc(h.version || '')} · ${esc(h.date || '')}</div>`).join('') || emptyState('emptyLog'));
  }));
}
async function loadCalendar() {
  const from = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 0).toISOString().slice(0, 10);
  let events = [];
  try { const d = await apiGet('/api/calendar?from=' + from + '&to=' + to); events = Array.isArray(d) ? d : (d.events || d.items || []); } catch (e) { events = []; }
  await Promise.all([loadColl('tasks'), loadColl('orders'), loadColl('invoices')]);
  if (!events.length) {
    coll('tasks').forEach(x => { if (x.due) events.push({ date: x.due, title: x.title, type: 'task' }); });
    coll('orders').forEach(o => { if (o.deliveryDate || o.due) events.push({ date: o.deliveryDate || o.due, title: o.number || o.customer, type: 'delivery' }); });
    coll('invoices').forEach(i => { if (i.due) events.push({ date: i.due, title: i.number || i.customer, type: 'due' }); });
  }
  renderCalendar(events);
}
function renderCalendar(events) {
  const pg = $('page-calendar'); if (!pg) return;
  let d = pg.querySelector('.cal-body');
  if (!d) { d = document.createElement('div'); d.className = 'cal-body'; pg.appendChild(d); }
  const y = state.calendarMonth.getFullYear(), m = state.calendarMonth.getMonth();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  const byDay = {};
  (events || []).forEach(ev => { const day = parseInt(String(ev.date || '').slice(8, 10), 10); if (day) { (byDay[day] = byDay[day] || []).push(ev); } });
  let cells = '';
  for (let i = 0; i < first; i++) cells += '<div class="cal-cell empty"></div>';
  for (let day = 1; day <= days; day++) {
    const evs = byDay[day] || [];
    cells += `<div class="cal-cell"><b>${day}</b>${evs.map(ev => `<div class="cal-ev">${esc(ev.title || '')}</div>`).join('')}</div>`;
  }
  d.innerHTML = `<div class="cal-head"><button id="calPrev">‹</button><b>${y}-${String(m + 1).padStart(2, '0')}</b><button id="calNext">›</button></div>
    <div class="cal-grid">${cells}</div>${(!events || !events.length) ? emptyState('emptyCalendar') : ''}`;
  const pv = $('calPrev'), nx = $('calNext');
  if (pv) pv.addEventListener('click', () => { state.calendarMonth = new Date(y, m - 1, 1); loadCalendar(); });
  if (nx) nx.addEventListener('click', () => { state.calendarMonth = new Date(y, m + 1, 1); loadCalendar(); });
}
async function loadReports() {
  await Promise.all([loadColl('leads'), loadColl('deals'), loadColl('orders')]);
  const pg = $('page-reports'); if (!pg) return;
  let d = pg.querySelector('.report-body');
  if (!d) { d = document.createElement('div'); d.className = 'report-body'; pg.appendChild(d); }
  const byC = {}; coll('leads').forEach(l => { if (l.country) byC[l.country] = (byC[l.country] || 0) + 1; });
  const byO = {}; coll('deals').forEach(x => { byO[x.owner || '—'] = (byO[x.owner || '—'] || 0) + (+x.amount || 0); });
  const maxC = Math.max(1, ...Object.values(byC));
  d.innerHTML = `<h4>${esc(t('country'))}</h4>${Object.keys(byC).length ? Object.entries(byC).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar-row"><span>${esc(k)}</span><div class="bar"><i style="width:${Math.round(v / maxC * 100)}%"></i></div><b>${v}</b></div>`).join('') : emptyState('emptyLeads')}
    <h4>${esc(t('kpiDeals'))}</h4>${Object.keys(byO).length ? Object.entries(byO).map(([k, v]) => `<div>${esc(k)}: ${fmtMoney(v)}</div>`).join('') : emptyState('emptyDeals')}`;
}

/* ================= 20. Integration ================= */
async function loadIntegration() {
  await loadColl('inquiryLogs');
  let siteKey = null;
  try { siteKey = await apiGet('/api/site/key'); } catch (e) { siteKey = null; }
  const key = (siteKey && (siteKey.key || siteKey.apiKey)) || (state.settings.siteKey || '');
  renderIntegration(key);
}
function renderIntegration(key) {
  const pg = $('page-integration'); if (!pg) return;
  let d = pg.querySelector('.int-body');
  if (!d) { d = document.createElement('div'); d.className = 'int-body'; pg.appendChild(d); }
  const masked = key ? key.slice(0, 4) + '••••••••' + key.slice(-4) : '—';
  const embed = `<form action="/api/site/inquiry" method="POST">\n  <input name="name" placeholder="Name" required>\n  <input name="email" type="email" placeholder="Email" required>\n  <input name="company" placeholder="Company">\n  <textarea name="message" placeholder="Message"></textarea>\n  <input type="hidden" name="key" value="${esc(key)}">\n  <button type="submit">Send Inquiry</button>\n</form>`;
  d.innerHTML = `<h4>${esc(t('apiKeyTitle'))}</h4>
    <div>${esc(masked)} <button id="intRegen">${esc(t('regenerate'))}</button> <button id="intDisable">${esc(t('disable'))}</button></div>
    <h4>${esc(t('embedForm'))}</h4><pre id="intEmbed">${esc(embed)}</pre><button id="intCopy">${esc(t('copy'))}</button>
    <h4>${esc(t('apiDocs'))}</h4><pre>POST /api/site/inquiry {key, name, email, company, message} → lead
POST /api/site/key → {key}
GET  /api/chat/threads · GET /api/chat/messages?customerId=
POST /api/chat/send {customerId, channel, chineseText}</pre>
    <h4>${esc(t('inquiryLog'))}</h4>
    ${coll('inquiryLogs').length ? coll('inquiryLogs').slice(-20).reverse().map(l => `<div>${esc(l.time || l.createdAt || '')} · ${esc(l.name || '')} · ${esc(l.company || '')} · ${esc(l.email || '')}</div>`).join('') : emptyState('emptyLog')}
    <button id="intTest">${esc(t('testSend'))}</button><div id="intTestResult"></div>`;
  const rg = $('intRegen'); if (rg) rg.addEventListener('click', async () => {
    try { const r = await api('POST', '/api/site/key', {}); const k = r.key || r.apiKey || ''; state.settings.siteKey = k; await saveSettings(); renderIntegration(k); toast(t('saved')); }
    catch (e) { const k = 'sk-' + uid(''); state.settings.siteKey = k; await saveSettings(); renderIntegration(k); }
  });
  const dis = $('intDisable'); if (dis) dis.addEventListener('click', async () => { state.settings.siteKey = ''; await saveSettings(); renderIntegration(''); toast(t('saved')); });
  const cp = $('intCopy'); if (cp) cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(embed); toast(t('copied')); } catch (e) { const ta = document.createElement('textarea'); ta.value = embed; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('copied')); } catch (err) { /* ignore */ } ta.remove(); }
  });
  const ts = $('intTest'); if (ts) ts.addEventListener('click', async () => {
    try {
      const r = await api('POST', '/api/site/test', { key, name: 'Test Visitor', email: 'test@example.com', company: 'Test Co', message: 'Test inquiry from integration page' });
      const lead = r.lead || r;
      const out = $('intTestResult'); if (out) out.textContent = t('saved') + ': ' + ((lead && (lead.company || lead.name || lead.id)) || JSON.stringify(lead || {}));
      await loadColl('inquiryLogs'); renderIntegration(key);
    } catch (e) { /* toasted */ }
  });
}

/* ================= 21. Customization ================= */
const FIELD_TYPES = ['text', 'number', 'select', 'multiselect', 'date', 'datetime', 'checkbox', 'email', 'phone', 'url', 'textarea', 'rich-text', 'rating', 'color', 'slider', 'address', 'file', 'user', 'currency', 'formula'];
const BUBBLE_COLORS = ['#2563eb', '#0e7490', '#15803d', '#ea580c', '#7c3aed', '#e11d48', '#475569', '#b45309', '#0f766e', '#f43f5e'];
function fieldTypeLabel(type) {
  const map = { 'rich-text': 'fieldRich', 'multiselect': 'fieldMulti' };
  const key = map[type] || ('field' + type.charAt(0).toUpperCase() + type.slice(1));
  const v = t(key); return v === key ? type : v;
}
async function loadCustomFields() { await loadColl('customFields'); renderCustomFields(); }
function renderCustomFields() {
  const pg = $('page-customfields'); if (!pg) return;
  let d = pg.querySelector('.cf-body');
  if (!d) { d = document.createElement('div'); d.className = 'cf-body'; pg.appendChild(d); }
  const rows = coll('customFields');
  d.innerHTML = `<div class="cf-form"><label class="f">${esc(t('name'))}<input id="cfLabel"></label>
    <label class="f">${esc(t('customFieldTypes'))}<select id="cfType">${FIELD_TYPES.map(x => `<option value="${esc(x)}">${esc(fieldTypeLabel(x))}</option>`).join('')}</select></label>
    <label class="f">Entity<select id="cfEntity"><option value="lead">lead</option><option value="deal">deal</option><option value="customer">customer</option><option value="product">product</option></select></label>
    <label class="f">Options<input id="cfOpts" placeholder="a,b,c"></label>
    <button id="cfAdd">+ ${esc(t('save'))}</button></div>
    ${rows.length ? rows.map(f => `<div>${esc(f.label || '')} (${esc(f.name || '')} · ${esc(fieldTypeLabel(f.type || 'text'))} · ${esc(f.entity || '')}) <button class="ghost" data-cf-del="${esc(f.id)}">${esc(t('del'))}</button></div>`).join('') : emptyState('emptyDefault')}`;
  const add = $('cfAdd'); if (add) add.addEventListener('click', async () => {
    const label = $('cfLabel').value.trim(); if (!label) return;
    const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || uid('f');
    try { await api('POST', '/api/customFields', { entity: $('cfEntity').value, label, name, type: $('cfType').value, options: $('cfOpts').value }); await loadCustomFields(); toast(t('saved')); } catch (e) { /* toasted */ }
  });
  d.querySelectorAll('[data-cf-del]').forEach(b => b.addEventListener('click', () => confirmDlg(t('confirmDelete'), async () => { try { await api('DELETE', '/api/customFields/' + b.getAttribute('data-cf-del')); await loadCustomFields(); } catch (e) { /* toasted */ } })));
}
async function loadCustomObjects() { await Promise.all([loadColl('customObjects'), loadColl('customRecords')]); renderCustomObjects(); }
function renderCustomObjects() {
  const pg = $('page-customobjects'); if (!pg) return;
  let d = pg.querySelector('.co-body');
  if (!d) { d = document.createElement('div'); d.className = 'co-body'; pg.appendChild(d); }
  const objs = coll('customObjects');
  d.innerHTML = `<button id="coNew">${esc(t('customObjects'))} +</button>` +
    (objs.length ? objs.map(o => {
      const recs = coll('customRecords').filter(r => r.objectId === o.id || r.object === o.name);
      return `<div class="card"><b>${esc(o.label || o.name || '')}</b> (${esc(o.name || '')}) — ${recs.length} ${esc(t('customRecords'))}
        <button class="ghost" data-co-rec="${esc(o.id)}">${esc(t('addRecord'))}</button>
        ${recs.map(r => `<div>${esc(r.title || r.name || JSON.stringify(r.data || r))}</div>`).join('')}</div>`;
    }).join('') : emptyState('emptyDefault'));
  const nb = $('coNew'); if (nb) nb.addEventListener('click', () => {
    openModal(t('customObjects'), modalForm(field(t('name'), 'co-name', '') + field(t('name'), 'co-label', '')));
    const form = $('modalForm'); if (form) form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/customObjects', { name: $('co-name').value, label: $('co-label').value || $('co-name').value }); closeModal(); await loadCustomObjects(); toast(t('saved')); } catch (err) { /* toasted */ } });
  });
  d.querySelectorAll('[data-co-rec]').forEach(b => b.addEventListener('click', () => {
    const oid = b.getAttribute('data-co-rec');
    openModal(t('addRecord'), modalForm(field(t('name'), 'cr-title', '')));
    const form = $('modalForm'); if (form) form.addEventListener('submit', async e => { e.preventDefault(); try { await api('POST', '/api/customRecords', { objectId: oid, title: $('cr-title').value }); closeModal(); await loadCustomObjects(); toast(t('saved')); } catch (err) { /* toasted */ } });
  }));
}
async function loadRoles() {
  const pg = $('page-roles'); if (!pg) return;
  let d = pg.querySelector('.role-body');
  if (!d) { d = document.createElement('div'); d.className = 'role-body'; pg.appendChild(d); }
  const role = state.settings.role || 'admin';
  d.innerHTML = `<label class="f">${esc(t('roles'))}<select id="roleSel">
      <option value="admin" ${role === 'admin' ? 'selected' : ''}>admin</option>
      <option value="manager" ${role === 'manager' ? 'selected' : ''}>manager</option>
      <option value="sales" ${role === 'sales' ? 'selected' : ''}>sales</option>
      <option value="viewer" ${role === 'viewer' ? 'selected' : ''}>viewer</option></select></label>
    <label class="f">${esc(t('myName'))}<input id="myName" value="${esc(state.settings.myName || '')}"></label>
    <button id="roleSave">${esc(t('saveSettings'))}</button>
    <p><small>${esc(t('roles'))}: admin = all · manager = all but settings · sales = own records only, amounts hidden · viewer = read-only</small></p>`;
  const save = $('roleSave'); if (save) save.addEventListener('click', async () => {
    state.settings.role = $('roleSel').value; state.settings.myName = $('myName').value.trim();
    await saveSettings(); document.body.classList.toggle('role-sales', state.settings.role === 'sales');
    toast(t('settingsSaved')); renderCurrentPage();
  });
}

/* ---- count bubbles + palette popover ---- */
function countForPage(page) {
  const map = { leads: coll('leads').length, deals: coll('deals').filter(d => d.stage !== 'won' && d.stage !== 'lost').length, customers: coll('customers').length, activities: coll('tasks').filter(x => !x.done).length, products: coll('products').length, quotes: coll('quotes').length, orders: coll('orders').length, inventory: coll('inventory').filter(i => (i.stock || 0) < (i.safeStock || 0)).length, chat: coll('messages').filter(m => m.dir === 'in' && !m.read).length, inbox: coll('messages').filter(m => m.dir === 'in' && !m.read).length, cases: coll('cases').filter(c => c.status !== 'closed').length, prospects: coll('prospects').length };
  return map[page];
}
function renderCountBubbles() {
  qsa('.nav-item[data-page]').forEach(nav => {
    const page = nav.getAttribute('data-page');
    const n = countForPage(page);
    let b = nav.querySelector('.count-bubble');
    if (n == null) { if (b) b.remove(); return; }
    const color = (state.settings.bubbleColors && state.settings.bubbleColors[page]) || '#2563eb';
    if (!b) { b = document.createElement('span'); b.className = 'count-bubble'; b.title = t('bubbleColor'); nav.appendChild(b); }
    b.textContent = n; b.style.background = color;
    if (!b.dataset.bound) { b.dataset.bound = '1'; b.addEventListener('click', e => { e.stopPropagation(); showBubblePopover(b, page); }); }
  });
}
function hideBubblePopover() { const p = $('bubblePopover'); if (p) p.remove(); }
function showBubblePopover(anchor, page) {
  hideBubblePopover();
  const pop = document.createElement('div'); pop.id = 'bubblePopover'; pop.className = 'bubble-popover';
  pop.innerHTML = BUBBLE_COLORS.map(c => `<button class="swatch" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('');
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.position = 'fixed'; pop.style.left = (r.left) + 'px'; pop.style.top = (r.bottom + 4) + 'px'; pop.style.zIndex = '9999';
  pop.querySelectorAll('[data-color]').forEach(b => b.addEventListener('click', async () => {
    state.settings.bubbleColors = state.settings.bubbleColors || {};
    state.settings.bubbleColors[page] = b.getAttribute('data-color');
    await saveSettings(); hideBubblePopover(); renderCountBubbles();
  }));
  setTimeout(() => document.addEventListener('click', function h(e) { if (!pop.contains(e.target)) { hideBubblePopover(); document.removeEventListener('click', h); } }), 0);
}
window.hideBubblePopover = hideBubblePopover;

/* ---- sidebar groups / favorites ---- */
function renderSidebarExtras() {
  const fav = $('favorites');
  if (fav) {
    const faves = state.settings.favorites || [];
    fav.innerHTML = faves.length ? faves.map(p => `<button class="nav-item" data-page="${esc(p)}">${esc(t('nav' + p.charAt(0).toUpperCase() + p.slice(1)) === 'nav' + p.charAt(0).toUpperCase() + p.slice(1) ? p : t('nav' + p.charAt(0).toUpperCase() + p.slice(1)))}</button>`).join('') : '';
    fav.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => showPage(b.getAttribute('data-page'))));
  }
  qsa('[data-group]').forEach(g => { if (!g.querySelector('.group-toggle')) { const h = g.querySelector('.group-head') || g.firstElementChild; if (h) h.classList.add('group-toggle'); } });
}
function toggleFavorite(page) {
  const f = state.settings.favorites || [];
  const i = f.indexOf(page);
  if (i >= 0) f.splice(i, 1); else f.push(page);
  state.settings.favorites = f; saveSettings(); renderSidebarExtras();
}
window.toggleFavorite = toggleFavorite;

/* ================= 22. Workflows + audit log ================= */
const DEFAULT_WORKFLOWS = [
  { id: 'wf-sla', name: 'SLA overdue → remind owner', enabled: true },
  { id: 'wf-new-lead', name: 'New lead → auto grade + assign', enabled: true },
  { id: 'wf-quote-follow', name: 'Quote sent 3 days → follow-up task', enabled: true },
  { id: 'wf-won-order', name: 'Deal won → create order draft', enabled: true },
  { id: 'wf-inquiry-site', name: 'Website inquiry → create lead', enabled: true },
  { id: 'wf-stock-low', name: 'Stock below safety → alert', enabled: true },
  { id: 'wf-payment-due', name: 'Invoice due → payment reminder', enabled: true },
  { id: 'wf-chat-unread', name: 'Unread chat 1h → notify', enabled: false }
];
async function loadWorkflows() { await Promise.all([loadColl('workflows'), loadColl('workflowLogs'), loadColl('auditLogs')]); renderWorkflows(); }
function renderWorkflows() {
  const pg = $('page-workflows'); if (!pg) return;
  let d = pg.querySelector('.wf-body');
  if (!d) { d = document.createElement('div'); d.className = 'wf-body'; pg.appendChild(d); }
  const stored = coll('workflows');
  const rules = DEFAULT_WORKFLOWS.map(def => {
    const s = stored.find(w => w.id === def.id || w.name === def.name);
    return s ? Object.assign({}, def, s) : def;
  });
  const master = state.settings.workflowMaster !== false;
  d.innerHTML = `<label><input type="checkbox" id="wfMaster" ${master ? 'checked' : ''}> ${esc(t('masterSwitch'))}</label>
    ${rules.map(r => `<div class="card"><b>${esc(r.name)}</b>
      <label><input type="checkbox" data-wf="${esc(r.id)}" ${r.enabled ? 'checked' : ''}> ${esc(t('masterSwitch'))}</label>
      <button class="ghost" data-wf-run="${esc(r.id)}">${esc(t('runNow'))}</button></div>`).join('')}
    <h4>${esc(t('runLog'))}</h4>
    ${coll('workflowLogs').length ? coll('workflowLogs').slice(-10).reverse().map(l => `<div>${esc(l.time || '')} · ${esc(l.workflowId || l.name || '')} · ${esc(l.status || l.result || '')}</div>`).join('') : emptyState('emptyLog')}
    <h4>${esc(t('auditLog'))}</h4>
    ${coll('auditLogs').length ? coll('auditLogs').slice(-10).reverse().map(l => `<div>${esc(l.time || '')} · ${esc(l.user || '')} · ${esc(l.action || '')} · ${esc(l.entity || '')}</div>`).join('') : emptyState('emptyLog')}`;
  const m = $('wfMaster'); if (m) m.addEventListener('change', async () => { state.settings.workflowMaster = m.checked; await saveSettings(); });
  d.querySelectorAll('[data-wf]').forEach(cb => cb.addEventListener('change', async () => {
    const id = cb.getAttribute('data-wf');
    try { const ex = coll('workflows').find(w => w.id === id); if (ex) await api('PUT', '/api/workflows/' + ex.id, { enabled: cb.checked }); else await api('POST', '/api/workflows', { id, enabled: cb.checked }); } catch (e) { /* toasted */ }
  }));
  d.querySelectorAll('[data-wf-run]').forEach(b => b.addEventListener('click', async () => {
    try {
      await api('POST', '/api/workflows/run', { id: b.getAttribute('data-wf-run') });
      toast(t('saved')); await loadWorkflows();
    } catch (e) { /* toasted */ }
  }));
}

/* ================= 23. Settings page ================= */
async function loadSettingsPage() { renderSettingsPage(); }
function renderSettingsPage() {
  const pg = $('page-settings'); if (!pg) return;
  const pal = $('themePalettes');
  if (pal) {
    pal.innerHTML = Object.keys(THEMES).map(name => `<button class="swatch${state.settings.theme === name ? ' on' : ''}" data-theme="${esc(name)}" style="background:${THEMES[name].primary}" title="${esc(name)}"></button>`).join('');
    pal.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', async () => { state.settings.theme = b.getAttribute('data-theme'); applyTheme(); await saveSettings(); renderSettingsPage(); }));
  }
  const cc = $('themeCustomColor');
  if (cc && !cc.dataset.bound) {
    cc.dataset.bound = '1';
    cc.value = (state.settings.themeCustom && state.settings.themeCustom.primary) || THEMES[state.settings.theme].primary;
    cc.addEventListener('input', () => { state.settings.themeCustom = Object.assign({}, state.settings.themeCustom, { primary: cc.value }); applyTheme(); });
    cc.addEventListener('change', async () => { await saveSettings(); });
  }
  // deal stages editor
  let st = pg.querySelector('.stage-editor');
  if (!st) { st = document.createElement('div'); st.className = 'stage-editor'; pg.appendChild(st); }
  const stages = state.settings.dealStages || [];
  st.innerHTML = `<h4>${esc(t('dealStages'))}</h4>` + stages.map((s, i) => `<div><input data-stage-idx="${i}" value="${esc(stageLabel(s))}" placeholder="${esc(stageKey(s))}"> <input data-stage-win="${i}" type="number" min="0" max="100" value="${(s && s.winRate) || 0}" style="width:64px">% <button class="ghost" data-stage-del="${i}">×</button></div>`).join('') +
    `<button id="stageAdd">+ ${esc(t('dealStages'))}</button> <button id="stageSave">${esc(t('saveSettings'))}</button>
     <h4>${esc(t('dashboardPages'))}</h4><button id="dashAddPage">${esc(t('addPage'))}</button> <button id="dashDelPage">${esc(t('removePage'))}</button>
     <h4>${esc(t('roles'))}</h4><button id="gotoRoles">${esc(t('roles'))}</button>
     <h4>${esc(t('moveToGroup'))}</h4><select id="movePageSel">${PAGES.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select>
     <select id="moveGroupSel"><option value="sales">sales</option><option value="ops">ops</option><option value="marketing">marketing</option><option value="system">system</option></select>
     <button id="movePageBtn">${esc(t('save'))}</button>`;
  const sa = $('stageAdd'); if (sa) sa.addEventListener('click', () => { state.settings.dealStages.push({ key: 'stage' + Date.now().toString(36), label: t('newStage'), winRate: 0 }); renderSettingsPage(); });
  st.querySelectorAll('[data-stage-del]').forEach(b => b.addEventListener('click', () => { state.settings.dealStages.splice(+b.getAttribute('data-stage-del'), 1); renderSettingsPage(); }));
  const ss = $('stageSave'); if (ss) ss.addEventListener('click', async () => {
    const labels = qsa('[data-stage-idx]', st).map(el => el.value.trim());
    const wins = qsa('[data-stage-win]', st).map(el => +el.value || 0);
    state.settings.dealStages = state.settings.dealStages.map((s, i) => ({ key: stageKey(s), label: labels[i] || stageKey(s), winRate: wins[i] || 0 }));
    await saveSettings(); toast(t('settingsSaved'));
  });
  const dap = $('dashAddPage'); if (dap) dap.addEventListener('click', async () => {
    const l = dashLayout(); l.pages.push({ name: 'page-' + (l.pages.length + 1), widgets: [] });
    state.settings.dashboardLayout = l; await saveSettings(); toast(t('saved'));
  });
  const ddp = $('dashDelPage'); if (ddp) ddp.addEventListener('click', async () => {
    const l = dashLayout(); if (l.pages.length > 1) { l.pages.splice(state.dashPage, 1); state.dashPage = 0; state.settings.dashboardLayout = l; await saveSettings(); toast(t('saved')); }
  });
  const gr = $('gotoRoles'); if (gr) gr.addEventListener('click', () => showPage('roles'));
  const mp = $('movePageBtn'); if (mp) mp.addEventListener('click', async () => {
    const map = state.settings.sidebarGroups || {};
    map[$('movePageSel').value] = $('moveGroupSel').value;
    state.settings.sidebarGroups = map; await saveSettings();
    const nav = qs('.nav-item[data-page="' + $('movePageSel').value + '"]');
    if (nav) nav.setAttribute('data-group', $('moveGroupSel').value);
    toast(t('saved'));
  });
  // layout export / import
  const ex = $('btnExportLayout');
  if (ex && !ex.dataset.bound) { ex.dataset.bound = '1'; ex.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.settings, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'guca-layout.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast(t('layoutExported'));
  }); }
  const im = $('btnImportLayout');
  if (im && !im.dataset.bound) { im.dataset.bound = '1'; im.addEventListener('click', () => { const f = $('layoutFile'); if (f) f.click(); }); }
  const lf = $('layoutFile');
  if (lf && !lf.dataset.bound) {
    lf.dataset.bound = '1';
    lf.addEventListener('change', async () => {
      const file = lf.files && lf.files[0]; if (!file) return;
      try { const data = JSON.parse(await file.text()); state.settings = Object.assign({}, state.settings, data); await saveSettings(); applyLang(state.settings.lang || 'zh'); toast(t('layoutImported')); }
      catch (e) { toast(t('loadFailed')); }
    });
  }
  // radius / density / font-size controls (created if absent)
  let ctl = pg.querySelector('.ui-controls');
  if (!ctl) {
    ctl = document.createElement('div'); ctl.className = 'ui-controls';
    ctl.innerHTML = `<label class="f">${esc(t('radius'))}<input id="uiRadius" type="range" min="0" max="16" value="${state.settings.radius || 8}"></label>
      <label class="f">${esc(t('fontSize'))}<input id="uiFont" type="range" min="12" max="18" value="${state.settings.fontSize || 14}"></label>
      <label class="f">${esc(t('density'))}<select id="uiDensity"><option value="comfortable">comfortable</option><option value="compact">compact</option></select></label>`;
    pg.appendChild(ctl);
    const r = $('uiRadius'); if (r) r.addEventListener('change', async () => { state.settings.radius = +r.value; applyTheme(); await saveSettings(); });
    const f = $('uiFont'); if (f) f.addEventListener('change', async () => { state.settings.fontSize = +f.value; applyTheme(); await saveSettings(); });
    const dn = $('uiDensity'); if (dn) { dn.value = state.settings.density || 'comfortable'; dn.addEventListener('change', async () => { state.settings.density = dn.value; applyTheme(); await saveSettings(); }); }
  }
}

/* ================= 24. Global bindings + init ================= */
function bindGlobal() {
  bindRouter();
  on('btnQuickCreate', 'click', () => { showPage('leads'); openLeadForm(); });
  on('langZh', 'click', () => setLang('zh'));
  on('langEn', 'click', () => setLang('en'));
  on('btnTheme', 'click', async () => {
    const names = Object.keys(THEMES); const i = names.indexOf(state.settings.theme);
    state.settings.theme = names[(i + 1) % names.length]; applyTheme(); await saveSettings(); renderSettingsPage();
  });
  on('btnEditDesktop', 'click', () => { const d = $('widgetDrawer'); if (d) d.classList.toggle('open'); });
  on('btnSidebar', 'click', () => { const s = $('sidebar'); if (s) s.classList.toggle('collapsed'); });
  on('modalClose', 'click', closeModal);
  const modal = $('modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  on('globalSearch', 'input', debounce(() => {
    const v = ($('globalSearch') || {}).value || '';
    if (state.currentPage !== 'leads') showPage('leads');
    const ls = $('leadSearch'); if (ls) { ls.value = v; renderLeads(); }
  }, 300));
  on('leadSearch', 'input', () => renderLeads());
  on('leadStatusFilter', 'change', () => renderLeads());
  on('leadOwnerFilter', 'change', () => renderLeads());
  on('btnNewLead', 'click', () => openLeadForm());
  on('btnExportLeads', 'click', exportLeadsCsv);
  on('btnSaveView', 'click', saveCurrentView);
  const imp = $('btnImportLeads');
  if (imp) imp.addEventListener('click', () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv,text/csv';
    inp.addEventListener('change', () => { if (inp.files[0]) importLeadsCsv(inp.files[0]); });
    inp.click();
  });
  bindChatComposer();
  // todo badge
  loadColl('tasks').then(() => {
    const b = $('todoBadge');
    if (b) { const n = coll('tasks').filter(x => !x.done).length; b.textContent = n || ''; b.style.display = n ? '' : 'none'; }
  }).catch(() => {});
}
window.exportLeadsCsv = exportLeadsCsv;
window.importLeadsCsv = importLeadsCsv;

async function init() {
  await loadSettings();
  document.body.classList.toggle('role-sales', state.settings.role === 'sales');
  applyLang(state.settings.lang || 'zh');
  renderSidebarExtras();
  bindGlobal();
  showPage(pageFromHash());
  // preload counts for bubbles
  Promise.all(['leads', 'deals', 'customers', 'tasks', 'products', 'quotes', 'orders', 'inventory', 'messages', 'cases', 'prospects'].map(loadColl)).then(renderCountBubbles).catch(() => {});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
