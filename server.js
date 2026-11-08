// Guca CRM v2.0.0 — 零依赖 Node 后端（只用内置 http/fs/path），无 npm 构建，单文件部署。
// 数据存在 data/db.json，首次启动从 data/seed.json 复制；v2 的 seed 是空库（仅默认设置）。
// 翻译/挖掘/聊天建议均为内置演示词典与演示数据，绝不伪装成真实 AI 调用。
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const SEED_PATH = path.join(__dirname, 'data', 'seed.json');

const COLLECTIONS = [
  'leads', 'deals', 'customers', 'contacts', 'activities', 'tasks', 'products',
  'quotes', 'orders', 'shipments', 'payments', 'invoices', 'inventory', 'stockMoves',
  'messages', 'prospects', 'miningRuns', 'segments', 'campaigns', 'campaignRecipients',
  'scheduledPosts', 'cases', 'documents', 'customFields', 'customObjects', 'customRecords',
  'workflows', 'workflowLogs', 'auditLogs', 'inquiryLogs', 'savedViews', 'quickReplies',
  'emailTemplates', 'drafts',
  // 兼容 v1 前端：资料库 / WhatsApp 旧集合
  'docs', 'whatsapp'
];
const PREFIX = {
  leads: 'L', deals: 'D', customers: 'C', contacts: 'CT', activities: 'A', tasks: 'T',
  products: 'P', quotes: 'Q', orders: 'O', shipments: 'S', payments: 'PAY', invoices: 'INV',
  inventory: 'I', stockMoves: 'SM', messages: 'M', prospects: 'PR', miningRuns: 'MR',
  segments: 'SG', campaigns: 'CP', campaignRecipients: 'CR', scheduledPosts: 'SP',
  cases: 'CS', documents: 'DOC', customFields: 'CF', customObjects: 'CO', customRecords: 'CRD',
  workflows: 'WF', workflowLogs: 'WL', auditLogs: 'AU', inquiryLogs: 'IL', savedViews: 'SV',
  quickReplies: 'QR', emailTemplates: 'ET', drafts: 'DR', docs: 'K', whatsapp: 'W'
};

const DEFAULT_AI = { provider: 'demo', baseUrl: '', model: '', hasKey: false };
const DEFAULT_APP = {
  lang: 'zh',
  automationEnabled: true,
  theme: { primary: '#1A56DB', radius: 10, density: 'comfortable', fontSize: 14 },
  bubbleColors: {},
  dashboardLayout: { pages: [{ name: '销售', widgets: ['kpiLeads', 'kpiDeals', 'kpiReceivable', 'kpiReceived', 'aiBrief', 'funnel', 'country', 'sla', 'today', 'orders', 'chat'].map(id => ({ id, size: 'w-standard', hidden: false })) }] },
  sidebar: {},
  dealStages: [
    { key: 'inquiry', label: '询盘', winRate: 10 },
    { key: 'confirm', label: '需求确认', winRate: 20 },
    { key: 'quote', label: '报价', winRate: 40 },
    { key: 'negotiate', label: '谈判', winRate: 60 },
    { key: 'sample', label: '样品', winRate: 80 },
    { key: 'won', label: '赢单', winRate: 100 },
    { key: 'lost', label: '输单', winRate: 0 }
  ],
  roles: { current: 'admin', myName: '', hideAmount: false }
};
const DEFAULT_SITE = { enabled: true, apiKey: '' };

function defaultDb() {
  const db = {};
  for (const c of COLLECTIONS) db[c] = [];
  db.aiSettings = { ...DEFAULT_AI };
  db.appSettings = JSON.parse(JSON.stringify(DEFAULT_APP));
  db.siteIntegration = { ...DEFAULT_SITE };
  return db;
}
function ensureDir() { const d = path.dirname(DB_PATH); if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
ensureDir();
if (!fs.existsSync(DB_PATH)) {
  if (fs.existsSync(SEED_PATH)) fs.copyFileSync(SEED_PATH, DB_PATH);
  else fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2));
}
function load() {
  let db;
  try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { db = defaultDb(); }
  if (!db || typeof db !== 'object') db = defaultDb();
  for (const c of COLLECTIONS) if (!Array.isArray(db[c])) db[c] = [];
  db.aiSettings = { ...DEFAULT_AI, ...(db.aiSettings || {}) };
  delete db.aiSettings.apiKey; // 永不落盘真实 key，只存 hasKey
  const a = db.appSettings || {};
  const themeObj = (a.theme && typeof a.theme === 'object') ? { ...DEFAULT_APP.theme, ...a.theme } : DEFAULT_APP.theme;
  db.appSettings = {
    ...JSON.parse(JSON.stringify(DEFAULT_APP)), ...a,
    theme: themeObj,
    roles: { ...DEFAULT_APP.roles, ...(a.roles || {}) }
  };
  if (!Array.isArray(db.appSettings.dealStages) || !db.appSettings.dealStages.length)
    db.appSettings.dealStages = JSON.parse(JSON.stringify(DEFAULT_APP.dealStages));
  // 修掉已落盘的空桌面布局：没有任何可见小部件时恢复默认 11 个小部件（删的是演示数据，不是功能）
  const _dl = db.appSettings.dashboardLayout;
  const _hasWidget = _dl && Array.isArray(_dl.pages) && _dl.pages.some(p => Array.isArray(p.widgets) && p.widgets.some(w => !w.hidden));
  if (!_hasWidget) db.appSettings.dashboardLayout = JSON.parse(JSON.stringify(DEFAULT_APP.dashboardLayout));
  db.siteIntegration = { ...DEFAULT_SITE, ...(db.siteIntegration || {}) };
  return db;
}
function save(db) { try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) { console.error('save failed', e); } }

const uid = p => (p || 'X') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const nowISO = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().slice(0, 10);
const num = v => { const n = +v; return Number.isFinite(n) ? n : 0; };
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 5 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      if (!s.trim()) return resolve({});
      try { resolve(JSON.parse(s)); } catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function audit(db, action, entity, entityId, detail) {
  db.auditLogs.push({ id: uid('AU'), at: nowISO(), actor: '我', action, entity, entityId: entityId || '', detail: detail || '' });
}
const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
function toCsv(rows, cols) { return [cols.join(','), ...rows.map(r => cols.map(c => csvEscape(r[c])).join(','))].join('\n'); }
function addDays(dateStr, n) { const d = new Date(dateStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function monthKeys(n) {
  const out = []; const d = new Date();
  for (let i = n - 1; i >= 0; i--) { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)); out.push(m.toISOString().slice(0, 7)); }
  return out;
}

// ---------- 演示翻译词典：常用外贸短句（zh/en/es/fr/de/pt/ar/ru/ja/ko）----------
// 未命中时返回原文 + note，engine 恒为 demo-dictionary，绝不声称是真实 AI 翻译。
const PHRASES = [
  { zh: '你好', en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', pt: 'Olá', ar: 'مرحباً', ru: 'Здравствуйте', ja: 'こんにちは', ko: '안녕하세요' },
  { zh: '谢谢', en: 'Thank you', es: 'Gracias', fr: 'Merci', de: 'Danke', pt: 'Obrigado', ar: 'شكراً', ru: 'Спасибо', ja: 'ありがとうございます', ko: '감사합니다' },
  { zh: '请确认', en: 'Please confirm', es: 'Por favor confirme', fr: 'Veuillez confirmer', de: 'Bitte bestätigen', pt: 'Por favor confirme', ar: 'يرجى التأكيد', ru: 'Пожалуйста, подтвердите', ja: 'ご確認ください', ko: '확인 부탁드립니다' },
  { zh: '报价', en: 'Quotation', es: 'Cotización', fr: 'Devis', de: 'Angebot', pt: 'Orçamento', ar: 'عرض سعر', ru: 'Коммерческое предложение', ja: '見積り', ko: '견적' },
  { zh: '样品', en: 'Sample', es: 'Muestra', fr: 'Échantillon', de: 'Muster', pt: 'Amostra', ar: 'عينة', ru: 'Образец', ja: 'サンプル', ko: '샘플' },
  { zh: '免费样品', en: 'Free sample', es: 'Muestra gratis', fr: 'Échantillon gratuit', de: 'Kostenloses Muster', pt: 'Amostra grátis', ar: 'عينة مجانية', ru: 'Бесплатный образец', ja: '無料サンプル', ko: '무료 샘플' },
  { zh: '能发样品吗？', en: 'Can you send a sample?', es: '¿Puede enviar una muestra?', fr: 'Pouvez-vous envoyer un échantillon ?', de: 'Können Sie ein Muster senden?', pt: 'Você pode enviar uma amostra?', ar: 'هل يمكنك إرسال عينة؟', ru: 'Можете ли вы отправить образец?', ja: 'サンプルを送っていただけますか？', ko: '샘플을 보내 주실 수 있나요？' },
  { zh: '价格', en: 'Price', es: 'Precio', fr: 'Prix', de: 'Preis', pt: 'Preço', ar: 'السعر', ru: 'Цена', ja: '価格', ko: '가격' },
  { zh: '价格是多少？', en: 'What is the price?', es: '¿Cuál es el precio?', fr: 'Quel est le prix ?', de: 'Wie hoch ist der Preis?', pt: 'Qual é o preço?', ar: 'ما هو السعر؟', ru: 'Какая цена?', ja: '価格はいくらですか？', ko: '가격이 얼마인가요？' },
  { zh: '交期', en: 'Lead time', es: 'Plazo de entrega', fr: 'Délai de livraison', de: 'Lieferzeit', pt: 'Prazo de entrega', ar: 'مدة التسليم', ru: 'Срок поставки', ja: '納期', ko: '납기' },
  { zh: '最小起订量', en: 'Minimum order quantity', es: 'Cantidad mínima de pedido', fr: 'Quantité minimale de commande', de: 'Mindestbestellmenge', pt: 'Quantidade mínima de pedido', ar: 'الحد الأدنى لكمية الطلب', ru: 'Минимальное количество заказа', ja: '最小注文数量', ko: '최소 주문 수량' },
  { zh: '付款方式', en: 'Payment method', es: 'Método de pago', fr: 'Mode de paiement', de: 'Zahlungsmethode', pt: 'Método de pagamento', ar: 'طريقة الدفع', ru: 'Способ оплаты', ja: 'お支払い方法', ko: '결제 방법' },
  { zh: '发票', en: 'Invoice', es: 'Factura', fr: 'Facture', de: 'Rechnung', pt: 'Fatura', ar: 'فاتورة', ru: 'Счёт-фактура', ja: '請求書', ko: '송장' },
  { zh: '运费', en: 'Shipping cost', es: 'Costo de envío', fr: "Frais d'expédition", de: 'Versandkosten', pt: 'Custo de envio', ar: 'تكلفة الشحن', ru: 'Стоимость доставки', ja: '送料', ko: '배송비' },
  { zh: '库存', en: 'Stock', es: 'Inventario', fr: 'Stock', de: 'Lagerbestand', pt: 'Estoque', ar: 'المخزون', ru: 'Складские запасы', ja: '在庫', ko: '재고' },
  { zh: '有货', en: 'In stock', es: 'En stock', fr: 'En stock', de: 'Auf Lager', pt: 'Em estoque', ar: 'متوفر', ru: 'В наличии', ja: '在庫あり', ko: '재고 있음' },
  { zh: '缺货', en: 'Out of stock', es: 'Sin stock', fr: 'En rupture de stock', de: 'Nicht auf Lager', pt: 'Fora de estoque', ar: 'غير متوفر', ru: 'Нет в наличии', ja: '在庫切れ', ko: '품절' },
  { zh: '请查收附件', en: 'Please check the attachment', es: 'Por favor, revise el archivo adjunto', fr: 'Veuillez trouver la pièce jointe', de: 'Bitte prüfen Sie den Anhang', pt: 'Por favor, verifique o anexo', ar: 'يرجى مراجعة المرفق', ru: 'Пожалуйста, проверьте вложение', ja: '添付ファイルをご確認ください', ko: '첨부 파일을 확인해 주세요' },
  { zh: '期待您的回复', en: 'Looking forward to your reply', es: 'Espero su respuesta', fr: "Dans l'attente de votre réponse", de: 'Ich freue mich auf Ihre Antwort', pt: 'Aguardo sua resposta', ar: 'أتطلع إلى ردك', ru: 'С нетерпением жду вашего ответа', ja: 'ご返信をお待ちしております', ko: '답장 기다리겠습니다' },
  { zh: '合作愉快', en: 'Happy to work with you', es: 'Encantado de trabajar con usted', fr: 'Au plaisir de collaborer avec vous', de: 'Ich freue mich auf die Zusammenarbeit', pt: 'Prazer em trabalhar com você', ar: 'سعيد بالتعاون معك', ru: 'Рад сотрудничеству с вами', ja: 'よろしくお願いいたします', ko: '함께 일하게 되어 기쁩니다' },
  { zh: '质量', en: 'Quality', es: 'Calidad', fr: 'Qualité', de: 'Qualität', pt: 'Qualidade', ar: 'الجودة', ru: 'Качество', ja: '品質', ko: '품질' },
  { zh: '证书', en: 'Certificate', es: 'Certificado', fr: 'Certificat', de: 'Zertifikat', pt: 'Certificado', ar: 'شهادة', ru: 'Сертификат', ja: '証明書', ko: '인증서' },
  { zh: '包装', en: 'Packaging', es: 'Embalaje', fr: 'Emballage', de: 'Verpackung', pt: 'Embalagem', ar: 'التغليف', ru: 'Упаковка', ja: '梱包', ko: '포장' },
  { zh: '发货', en: 'Ship the goods', es: 'Enviar la mercancía', fr: 'Expédier les marchandises', de: 'Ware versenden', pt: 'Enviar a mercadoria', ar: 'شحن البضائع', ru: 'Отправить товар', ja: '発送する', ko: '발송하다' },
  { zh: '订单', en: 'Order', es: 'Pedido', fr: 'Commande', de: 'Bestellung', pt: 'Pedido', ar: 'طلب', ru: 'Заказ', ja: '注文', ko: '주문' },
  { zh: '折扣', en: 'Discount', es: 'Descuento', fr: 'Remise', de: 'Rabatt', pt: 'Desconto', ar: 'خصم', ru: 'Скидка', ja: '割引', ko: '할인' },
  { zh: '欢迎光临', en: 'Welcome', es: 'Bienvenido', fr: 'Bienvenue', de: 'Willkommen', pt: 'Bem-vindo', ar: 'أهلاً وسهلاً', ru: 'Добро пожаловать', ja: 'いらっしゃいませ', ko: '환영합니다' },
  { zh: '再见', en: 'Goodbye', es: 'Adiós', fr: 'Au revoir', de: 'Auf Wiedersehen', pt: 'Adeus', ar: 'مع السلامة', ru: 'До свидания', ja: 'さようなら', ko: '안녕히 가세요' },
  { zh: '请问一下', en: 'May I ask?', es: '¿Puedo preguntar?', fr: 'Puis-je demander ?', de: 'Darf ich fragen?', pt: 'Posso perguntar?', ar: 'هل يمكنني أن أسأل؟', ru: 'Могу я спросить?', ja: 'お尋ねしてもよろしいですか？', ko: '여쭤봐도 될까요？' }
];
const LANG_LABELS = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ar: 'Arabic', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', hi: 'Hindi', th: 'Thai', it: 'Italian', tr: 'Turkish', id: 'Indonesian', vi: 'Vietnamese' };

function translateText(text, target, hasKey) {
  const t = (target || 'en').toLowerCase();
  const src = String(text || '');
  let note = '';
  if (hasKey) note = '已保存 API key，但本构建无真实在线翻译调用，仍使用演示词典。';
  if (!src.trim()) return { translated: '', engine: 'demo-dictionary', demo: true, note: note || '空文本' };
  // 整句命中
  for (const e of PHRASES) {
    for (const v of Object.values(e)) {
      if (v && v.toLowerCase() === src.trim().toLowerCase()) {
        return { translated: e[t] || e.en || src, engine: 'demo-dictionary', demo: true, note: note || '词典命中（演示）' };
      }
    }
  }
  // 词组逐个替换（最长优先）
  let out = src; let hit = false;
  const entries = [...PHRASES].sort((a, b) => (b.zh || '').length - (a.zh || '').length);
  for (const e of entries) {
    for (const v of Object.values(e)) {
      if (!v) continue;
      const idx = out.toLowerCase().indexOf(v.toLowerCase());
      if (idx >= 0) {
        const before = out.slice(0, idx), after = out.slice(idx + v.length);
        const rep = e[t] || e.en || v;
        const joinL = before && /[\p{L}\p{N}]$/u.test(before) && /^[\p{L}\p{N}]/u.test(rep) ? ' ' : '';
        const joinR = after && /[\p{L}\p{N}]$/u.test(rep) && /^[\p{L}\p{N}]/u.test(after) ? ' ' : '';
        out = before + joinL + rep + joinR + after; hit = true;
      }
    }
  }
  if (hit) return { translated: out, engine: 'demo-dictionary', demo: true, note: note || '词典部分命中（演示）' };
  return { translated: src, engine: 'demo-dictionary', demo: true, note: (note ? note + ' ' : '') + '演示词典未命中：已返回原文，需接真实翻译 API（DeepL/Google Translate）后才有准确翻译' };
}

function detectLang(text) {
  const s = String(text || '');
  if (/[\u0600-\u06FF]/.test(s)) return { lang: 'ar', label: 'Arabic' };
  if (/[\u0400-\u04FF]/.test(s)) return { lang: 'ru', label: 'Russian' };
  if (/[\u3040-\u30FF]/.test(s)) return { lang: 'ja', label: 'Japanese' };
  if (/[\uAC00-\uD7AF]/.test(s)) return { lang: 'ko', label: 'Korean' };
  if (/[\u4E00-\u9FFF]/.test(s)) return { lang: 'zh', label: 'Chinese' };
  if (/[\u0900-\u097F]/.test(s)) return { lang: 'hi', label: 'Hindi' };
  if (/[\u0E00-\u0E7F]/.test(s)) return { lang: 'th', label: 'Thai' };
  const low = ' ' + s.toLowerCase() + ' ';
  const KW = {
    es: ['hola', 'gracias', 'precio', 'por favor', 'cotización', 'muestra', 'pedido', 'envío', 'buenos días'],
    fr: ['bonjour', 'merci', 'prix', 'devis', 'échantillon', 'commande', 'livraison', "s'il vous plaît"],
    de: ['hallo', 'danke', 'preis', 'angebot', 'muster', 'lieferung', 'bestellung'],
    pt: ['olá', 'obrigado', 'preço', 'orçamento', 'amostra', 'pedido', 'envio'],
    it: ['ciao', 'grazie', 'prezzo', 'preventivo', 'campione', 'ordine', 'spedizione'],
    tr: ['merhaba', 'teşekkür', 'fiyat', 'lütfen', 'teklif', 'numune', 'sipariş'],
    id: ['halo', 'terima kasih', 'harga', 'tolong', 'penawaran', 'contoh', 'pesanan'],
    vi: ['xin chào', 'cảm ơn', 'giá', 'vui lòng', 'báo giá', 'mẫu', 'đơn hàng']
  };
  for (const [lang, words] of Object.entries(KW)) {
    if (words.some(w => low.includes(w))) return { lang, label: LANG_LABELS[lang] };
  }
  return { lang: 'en', label: 'English' };
}

// ---------- 统计 / 财务 ----------
function financeOf(db) {
  const today = todayStr();
  const receivable = db.invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + num(i.amount), 0);
  const received = db.payments.reduce((s, p) => s + num(p.amount), 0);
  const overdue = db.invoices.filter(i => i.status !== 'paid' && i.dueDate && i.dueDate < today).reduce((s, i) => s + num(i.amount), 0);
  const monthlyTrend = monthKeys(6).map(m => ({
    month: m,
    received: db.payments.filter(p => String(p.date || p.createdAt || p.at || '').slice(0, 7) === m).reduce((s, p) => s + num(p.amount), 0)
  }));
  return { receivable, received, overdue, monthlyTrend };
}
function statsOf(db) {
  const today = todayStr();
  const funnel = {}; db.deals.forEach(d => { const k = d.stage || '未分阶段'; funnel[k] = (funnel[k] || 0) + 1; });
  const byCountry = {}; db.leads.forEach(l => { const k = l.country || '未知'; byCountry[k] = (byCountry[k] || 0) + 1; });
  const byOwner = {}; db.deals.forEach(d => { const k = d.owner || '未分配'; byOwner[k] = (byOwner[k] || 0) + num(d.amount); });
  const fin = financeOf(db);
  return {
    leads: db.leads.length, deals: db.deals.length,
    totalAmount: db.deals.reduce((s, d) => s + num(d.amount), 0),
    receivable: fin.receivable, received: fin.received,
    overdueTasks: db.tasks.filter(t => !t.done && t.due && t.due < today).length,
    funnel, byCountry, byOwner
  };
}

// ---------- 订单（含库存扣减） ----------
function createOrder(db, b) {
  const items = Array.isArray(b.items) ? b.items : [];
  const warnings = [];
  let total = 0;
  const normItems = items.map(it => {
    const qty = Math.max(0, Math.floor(num(it.qty)));
    const inv = db.inventory.find(i => i.id === it.productId || i.productId === it.productId);
    const price = it.price != null ? num(it.price) : num(inv && (inv.price ?? inv.tierPrice));
    total += qty * price;
    let deducted = 0;
    if (inv) {
      deducted = Math.min(num(inv.stock), qty);
      if (deducted > 0) inv.stock = num(inv.stock) - deducted;
    }
    const short = qty - deducted;
    if (short > 0) warnings.push({ productId: it.productId, short });
    return { productId: it.productId, name: it.name || (inv && inv.name) || '', qty, price };
  });
  const order = {
    id: uid('O'), customerId: b.customerId || '', leadId: b.leadId || '', quoteId: b.quoteId || '',
    title: b.title || '', items: normItems, total, status: b.status || '待处理',
    deliveryDate: b.deliveryDate || '', createdAt: nowISO()
  };
  // 保留调用方传入的其他字段（不覆盖已算好的 id/items/total）
  for (const k of Object.keys(b)) if (!['id', 'items', 'total', 'status'].includes(k)) order[k] = b[k];
  order.items = normItems; order.total = total;
  db.orders.push(order);
  // 记录 stockMoves：按本次实际扣减量（qty - short）
  for (const it of normItems) {
    const w = warnings.find(x => x.productId === it.productId);
    const deducted = it.qty - (w ? w.short : 0);
    if (deducted > 0) db.stockMoves.push({ id: uid('SM'), productId: it.productId, qty: -deducted, type: 'order', orderId: order.id, at: nowISO() });
  }
  audit(db, 'create', 'orders', order.id, order.title || order.id);
  return { order, warnings };
}

// ---------- 预设自动化规则（8 条；seed 为空时仍可用） ----------
const PRESET_RULES = [
  { id: 'wf-sla', name: 'SLA 逾期线索跟进', desc: '线索下次跟进日期已过仍未跟进时，自动创建跟进任务' },
  { id: 'wf-quote-expire', name: '报价即将过期提醒', desc: '报价单有效期在 3 天内到期时，自动创建提醒任务' },
  { id: 'wf-payment-overdue', name: '逾期应收提醒', desc: '发票已过付款截止日仍未付时，自动创建催款任务' },
  { id: 'wf-vip-festival', name: 'VIP 客户节日回访', desc: '为 A 级/VIP 客户创建节日回访任务' },
  { id: 'wf-new-lead', name: '新线索当日跟进', desc: '今天新增且尚无任何跟进记录的线索，创建首访任务' },
  { id: 'wf-deal-stale', name: '商机长期停滞提醒', desc: '非终态商机 14 天无跟进记录时，创建提醒任务' },
  { id: 'wf-low-stock', name: '库存不足提醒', desc: '库存低于 10 件的产品，创建补货提醒任务' },
  { id: 'wf-order-unpaid', name: '订单未付款跟进', desc: '创建超过 7 天仍待处理的订单，创建跟进任务' }
];
function ensureTask(db, title, extra) {
  if (db.tasks.some(t => t.title === title && !t.done)) return false;
  db.tasks.push({ id: uid('T'), title, done: false, due: todayStr(), owner: '我', createdAt: nowISO(), ...(extra || {}) });
  return true;
}
function runWorkflows(db) {
  const today = todayStr();
  const logs = [];
  const rules = db.workflows.length ? db.workflows : PRESET_RULES;
  const byId = Object.fromEntries(rules.map(r => [r.id, r]));
  const enabled = id => !byId[id] || byId[id].enabled !== false;
  const log = (ruleId, detail, created) => {
    const entry = { id: uid('WL'), rule: ruleId, ruleName: (byId[ruleId] || {}).name || ruleId, at: nowISO(), result: created ? '已执行' : '无匹配', detail };
    db.workflowLogs.push(entry); logs.push(entry); return entry;
  };
  if (enabled('wf-sla')) {
    let n = 0;
    db.leads.filter(l => l.nextFollow && l.nextFollow < today && !l.converted && l.status !== '已转化').forEach(l => {
      if (ensureTask(db, `跟进逾期线索：${l.company || l.name || l.id}`, { leadId: l.id })) n++;
    });
    log('wf-sla', n ? `创建 ${n} 个逾期跟进任务` : '无逾期线索', n > 0);
  }
  if (enabled('wf-quote-expire')) {
    let n = 0;
    db.quotes.filter(q => q.validUntil && q.validUntil <= addDays(today, 3) && q.status !== '已过期').forEach(q => {
      if (ensureTask(db, `报价即将过期：${q.title || q.id}（${q.validUntil}）`, { quoteId: q.id })) n++;
    });
    log('wf-quote-expire', n ? `创建 ${n} 个报价过期提醒` : '无即将过期报价', n > 0);
  }
  if (enabled('wf-payment-overdue')) {
    let n = 0;
    db.invoices.filter(i => i.status !== 'paid' && i.dueDate && i.dueDate < today).forEach(i => {
      if (ensureTask(db, `催款：${i.customer || i.company || i.id} 应收 $${num(i.amount)}（${i.dueDate}）`, { invoiceId: i.id })) n++;
    });
    log('wf-payment-overdue', n ? `创建 ${n} 个催款任务` : '无逾期应收', n > 0);
  }
  if (enabled('wf-vip-festival')) {
    let n = 0;
    db.customers.filter(c => c.level === 'A' || c.level === 'VIP').forEach(c => {
      if (ensureTask(db, `节日回访 VIP 客户：${c.company || c.contact || c.id}`, { customerId: c.id, due: addDays(today, 7) })) n++;
    });
    log('wf-vip-festival', n ? `创建 ${n} 个 VIP 回访任务` : '无 VIP 客户', n > 0);
  }
  if (enabled('wf-new-lead')) {
    let n = 0;
    db.leads.filter(l => String(l.created || l.createdAt || '').slice(0, 10) === today).forEach(l => {
      const hasAct = db.activities.some(a => a.leadId === l.id);
      if (!hasAct && ensureTask(db, `首访新线索：${l.company || l.name || l.id}`, { leadId: l.id })) n++;
    });
    log('wf-new-lead', n ? `创建 ${n} 个新线索首访任务` : '今日无待首访新线索', n > 0);
  }
  if (enabled('wf-deal-stale')) {
    let n = 0;
    const cutoff = addDays(today, -14);
    db.deals.filter(d => !['won', 'lost', '赢单', '输单', '成交', '丢单'].includes(d.stage)).forEach(d => {
      const recent = db.activities.some(a => (a.dealId === d.id || a.leadId === d.leadId) && String(a.date || a.createdAt || '').slice(0, 10) >= cutoff);
      if (!recent && ensureTask(db, `商机停滞提醒：${d.title || d.id}`, { dealId: d.id })) n++;
    });
    log('wf-deal-stale', n ? `创建 ${n} 个商机停滞提醒` : '无停滞商机', n > 0);
  }
  if (enabled('wf-low-stock')) {
    let n = 0;
    db.inventory.filter(i => num(i.stock) < 10).forEach(i => {
      if (ensureTask(db, `库存不足补货：${i.name || i.sku || i.id} 仅剩 ${num(i.stock)} 件`, { productId: i.id })) n++;
    });
    log('wf-low-stock', n ? `创建 ${n} 个补货提醒` : '无低库存产品', n > 0);
  }
  if (enabled('wf-order-unpaid')) {
    let n = 0;
    const cutoff = addDays(today, -7);
    db.orders.filter(o => (o.status === '待处理' || o.status === 'created') && String(o.createdAt || '').slice(0, 10) <= cutoff).forEach(o => {
      if (ensureTask(db, `订单未付款跟进：${o.title || o.id}`, { orderId: o.id })) n++;
    });
    log('wf-order-unpaid', n ? `创建 ${n} 个订单跟进任务` : '无超期未付款订单', n > 0);
  }
  return logs;
}

// ---------- 聊天建议回复模板 ----------
const GREET = {
  en: 'Hello! Thank you for your inquiry.', zh: '您好！感谢您的询盘。',
  es: '¡Hola! Gracias por su consulta.', fr: 'Bonjour ! Merci pour votre demande.',
  de: 'Hallo! Vielen Dank für Ihre Anfrage.', pt: 'Olá! Obrigado pela sua consulta.',
  ar: 'مرحباً! شكراً لاستفسارك.', ru: 'Здравствуйте! Спасибо за ваш запрос.',
  ja: 'こんにちは！お問い合わせありがとうございます。', ko: '안녕하세요! 문의해 주셔서 감사합니다。'
};
const CLOSE = {
  en: 'Please let me know if you would like a formal quotation or a sample.',
  zh: '如需正式报价单或样品，请告诉我。',
  es: 'Por favor, avíseme si desea una cotización formal o una muestra.',
  fr: 'N’hésitez pas à me dire si vous souhaitez un devis formel ou un échantillon.',
  de: 'Bitte teilen Sie mir mit, ob Sie ein formelles Angebot oder ein Muster wünschen.',
  pt: 'Por favor, avise-me se desejar um orçamento formal ou uma amostra.',
  ar: 'يرجى إخباري إذا كنت ترغب في عرض سعر رسمي أو عينة.',
  ru: 'Сообщите, пожалуйста, если вам нужны официальное предложение или образец.',
  ja: '正式な見積書やサンプルが必要でしたらお知らせください。',
  ko: '정식 견적서나 샘플이 필요하시면 알려주세요。'
};

// ---------- HTTP 服务 ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = u.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  // 静态文件：/ 与 /public/*
  if (req.method === 'GET' && (p === '/' || p.startsWith('/public/'))) {
    const rel = p === '/' ? 'index.html' : p.slice('/public/'.length);
    const pubDir = path.join(__dirname, 'public');
    const fp = path.join(pubDir, rel);
    if (!fp.startsWith(pubDir) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
    return fs.createReadStream(fp).pipe(res);
  }
  if (!p.startsWith('/api/')) { res.writeHead(404); return res.end('not found'); }

  const db = load();
  const ok = (code, obj, persist) => { if (persist) save(db); return json(res, code, obj); };
  const parts = p.split('/').filter(Boolean); // ['api', coll, id?, action?]

  try {
    // ===== 统计 / 工作台 / 财务 / 日历 =====
    if (p === '/api/stats' && req.method === 'GET') return ok(200, statsOf(db));
    if (p === '/api/dashboard' && req.method === 'GET') {
      const today = todayStr();
      const st = statsOf(db);
      const slaOverdue = db.leads.filter(l => l.nextFollow && l.nextFollow < today && !l.converted && l.status !== '已转化');
      return ok(200, {
        ...st,
        slaOverdue,
        todayTasks: db.tasks.filter(t => !t.done && t.due === today),
        recentOrders: [...db.orders].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 5),
        monthlyTrend: financeOf(db).monthlyTrend
      });
    }
    if (p === '/api/finance' && req.method === 'GET') return ok(200, financeOf(db));
    if (p === '/api/calendar' && req.method === 'GET') {
      const from = u.searchParams.get('from') || todayStr();
      const to = u.searchParams.get('to') || addDays(todayStr(), 30);
      const inWin = d => d && d >= from && d <= to;
      return ok(200, {
        from, to,
        tasks: db.tasks.filter(t => inWin(t.due)),
        deals: db.deals.filter(d => inWin(d.closeDate)),
        orders: db.orders.filter(o => inWin(o.deliveryDate)),
        payments: db.payments.filter(x => inWin(x.dueDate))
      });
    }
    if (p === '/api/export' && req.method === 'GET') {
      const type = u.searchParams.get('type') || 'leads';
      const format = u.searchParams.get('format') || 'csv';
      if (format !== 'csv') return ok(400, { error: 'unsupported format' });
      if (!COLLECTIONS.includes(type)) return ok(404, { error: 'unknown collection' });
      const rows = db[type] || [];
      const cols = [];
      rows.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
      if (!cols.length) cols.push('id');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${type}.csv` });
      return res.end('\ufeff' + toCsv(rows, cols));
    }

    // ===== 设置 =====
    if (p === '/api/settings') {
      if (req.method === 'GET') return ok(200, { appSettings: db.appSettings, aiSettings: db.aiSettings });
      if (req.method === 'POST') {
        const b = await body(req);
        if (b.appSettings && typeof b.appSettings === 'object') {
          const incoming = { ...b.appSettings };
          const themeVal = incoming.theme;
          delete incoming.theme;
          db.appSettings = {
            ...db.appSettings, ...incoming,
            theme: (themeVal && typeof themeVal === 'object') ? { ...(typeof db.appSettings.theme === 'object' ? db.appSettings.theme : DEFAULT_APP.theme), ...themeVal } : (themeVal !== undefined ? themeVal : db.appSettings.theme),
            roles: { ...db.appSettings.roles, ...(b.appSettings.roles || {}) }
          };
        }
        if (b.aiSettings && typeof b.aiSettings === 'object') {
          const ai = { ...b.aiSettings };
          if ('apiKey' in ai) { db.aiSettings.hasKey = !!String(ai.apiKey || '').trim(); delete ai.apiKey; }
          db.aiSettings = { ...db.aiSettings, ...ai };
          delete db.aiSettings.apiKey;
        }
        return ok(200, { appSettings: db.appSettings, aiSettings: db.aiSettings }, true);
      }
      return ok(405, { error: 'method not allowed' });
    }

    // ===== 翻译 / 语种识别（演示词典） =====
    if (p === '/api/translate' && req.method === 'POST') {
      const b = await body(req);
      const r = translateText(b.text || '', b.target || 'en', db.aiSettings.hasKey);
      return ok(200, { ...r, note: r.note });
    }
    if (p === '/api/detect' && req.method === 'POST') {
      const b = await body(req);
      return ok(200, detectLang(b.text || ''));
    }

    // ===== 聊天 =====
    if (p === '/api/chat/threads' && req.method === 'GET') {
      const threads = db.customers.map(c => {
        const msgs = db.messages.filter(m => m.customerId === c.id);
        const latest = [...msgs].sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')))[0] || null;
        return {
          customerId: c.id, company: c.company, contact: c.contact, country: c.country,
          peerLang: c.peerLang || 'en', channel: (latest && latest.channel) || c.channel || 'WhatsApp',
          latest, unread: msgs.filter(m => m.dir === 'in' && !m.read).length
        };
      }).sort((a, b) => String(b.latest && b.latest.time || '').localeCompare(String(a.latest && a.latest.time || '')));
      return ok(200, threads);
    }
    if (p === '/api/chat/messages' && req.method === 'GET') {
      const customerId = u.searchParams.get('customerId') || '';
      const list = db.messages.filter(m => !customerId || m.customerId === customerId)
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
      let changed = false;
      for (const m of list) {
        if (m.dir === 'in' && !m.read) { m.read = true; changed = true; }
        if (m.dir === 'in' && !m.translatedBody) {
          const d = detectLang(m.body || '');
          const tr = translateText(m.body || '', 'zh', db.aiSettings.hasKey);
          m.lang = d.lang; m.langLabel = d.label; m.translatedBody = tr.translated; m.engine = tr.engine;
          changed = true;
        }
        if (m.dir === 'out' && !m.originalBody) {
          const tr = translateText(m.body || '', 'zh', db.aiSettings.hasKey);
          m.originalBody = tr.translated; m.translatedBody = m.body;
          changed = true;
        }
      }
      return ok(200, list, changed);
    }
    if (p === '/api/chat/send' && req.method === 'POST') {
      const b = await body(req);
      const c = db.customers.find(x => x.id === b.customerId);
      if (!c) return ok(404, { error: 'customer not found' });
      const peerLang = c.peerLang || 'en';
      const tr = translateText(b.chineseText || '', peerLang, db.aiSettings.hasKey);
      const m = {
        id: uid('M'), customerId: c.id, channel: b.channel || c.channel || 'WhatsApp', dir: 'out',
        body: tr.translated, originalBody: b.chineseText || '', translatedBody: tr.translated,
        lang: peerLang, langLabel: LANG_LABELS[peerLang] || peerLang, engine: tr.engine,
        time: nowISO(), read: true
      };
      db.messages.push(m);
      db.drafts = db.drafts.filter(d => d.customerId !== c.id); // 发送后清草稿
      db.activities.push({ id: uid('A'), customerId: c.id, type: '聊天', text: `发送消息给 ${c.company || c.contact || ''}：${b.chineseText || ''}`, by: '我', date: todayStr(), createdAt: nowISO() });
      audit(db, 'create', 'messages', m.id, `发送给 ${c.company || c.contact || ''}`);
      return ok(200, m, true);
    }
    if (p === '/api/chat/incoming' && req.method === 'POST') {
      const b = await body(req);
      const c = db.customers.find(x => x.id === b.customerId);
      if (!c) return ok(404, { error: 'customer not found' });
      const d = detectLang(b.text || '');
      const tr = translateText(b.text || '', 'zh', db.aiSettings.hasKey);
      const m = {
        id: uid('M'), customerId: c.id, channel: b.channel || c.channel || 'WhatsApp', dir: 'in',
        body: b.text || '', originalBody: '', translatedBody: tr.translated,
        lang: d.lang, langLabel: d.label, engine: tr.engine, time: nowISO(), read: false
      };
      db.messages.push(m);
      c.peerLang = d.lang; // 记住对方语种，下次回复用它
      audit(db, 'create', 'messages', m.id, `收到 ${c.company || c.contact || ''} 的消息（${d.label}）`);
      return ok(200, m, true);
    }
    if (p === '/api/chat/drafts') {
      if (req.method === 'GET') return ok(200, db.drafts);
      if (req.method === 'POST') {
        const b = await body(req);
        if (!b.customerId) return ok(400, { error: 'customerId required' });
        if (!String(b.body || '').trim()) {
          db.drafts = db.drafts.filter(d => d.customerId !== b.customerId);
          return ok(200, { customerId: b.customerId, body: '', savedAt: null, deleted: true }, true);
        }
        let d = db.drafts.find(x => x.customerId === b.customerId);
        if (!d) { d = { id: uid('DR'), customerId: b.customerId, body: b.body, savedAt: nowISO() }; db.drafts.push(d); }
        else { d.body = b.body; d.savedAt = nowISO(); }
        return ok(200, { customerId: d.customerId, body: d.body, savedAt: d.savedAt }, true);
      }
      return ok(405, { error: 'method not allowed' });
    }
    if (p === '/api/chat/suggest' && req.method === 'POST') {
      const b = await body(req);
      const c = db.customers.find(x => x.id === b.customerId);
      if (!c) return ok(404, { error: 'customer not found' });
      const peerLang = c.peerLang || 'en';
      const latestIn = [...db.messages.filter(m => m.customerId === c.id && m.dir === 'in')]
        .sort((x, y) => String(y.time || '').localeCompare(String(x.time || '')))[0];
      const text = (latestIn && latestIn.body) || '';
      const low = text.toLowerCase();
      let matched = db.inventory.filter(i => {
        const p = db.products.find(x => x.id === i.productId) || {};
        const name = String(p.name || i.name || '').toLowerCase();
        const sku = String(p.sku || i.sku || '').toLowerCase();
        if (name && low.includes(name)) return true;
        if (sku && low.includes(sku)) return true;
        return name.split(/[\s\-_/]+/).some(w => w.length > 2 && low.includes(w));
      });
      const byKeyword = matched.length > 0;
      if (!matched.length) matched = db.inventory.slice(0, 3);
      const greet = GREET[peerLang] || GREET.en;
      const close = CLOSE[peerLang] || CLOSE.en;
      let reply, replyZh, reasoning, evidence;
      if (!db.inventory.length) {
        reply = `${greet} ${peerLang === 'zh' ? '目前库存为空，暂无法提供现货与价格，我会确认后尽快回复您。' : 'We currently have no stock data, so I cannot confirm availability or price yet. I will check and get back to you soon.'}`;
        replyZh = '您好！感谢您的询盘。目前库存为空，暂无法提供现货与价格，我会确认后尽快回复您。';
        reasoning = 'inventory 为空，没有任何库存数据，无法按真实数字报价，只能先回复对方正在确认。';
        evidence = ['inventory 为空，无库存数据'];
      } else {
        // inventory 行只存 productId/数量，名称/SKU/价格从 products 表 join
        const prodOf = i => db.products.find(p => p.id === i.productId) || {};
        const priceOf = i => { const p = prodOf(i); if (p.price != null) return p.price; const tiers = p.priceTiers || p.tiers || []; if (tiers.length) return tiers[0].price; return i.price ?? i.tierPrice; };
        const nameOf = i => prodOf(i).name || i.name || i.sku || '未命名产品';
        const skuOf = i => prodOf(i).sku || i.sku || '无 SKU';
        const lines = matched.map(i => `- ${nameOf(i)} (${skuOf(i)}): ${num(i.stock)} units in stock, $${num(priceOf(i))}/unit, lead time ${i.leadTime || '-'} days.`);
        const linesZh = matched.map(i => `- ${nameOf(i)}（${skuOf(i)}）：现货 ${num(i.stock)} 件，单价 $${num(priceOf(i))}，交期 ${i.leadTime || '-'} 天。`);
        reply = `${greet}\n${lines.join('\n')}\n${close}`;
        replyZh = `您好！感谢您的询盘。\n${linesZh.join('\n')}\n如需正式报价单或样品，请告诉我。`;
        reasoning = byKeyword
          ? `最新询盘“${text.slice(0, 60)}”中出现产品关键词，匹配到 ${matched.length} 个库存产品，按真实库存/价格/交期起草回复（仅草稿，未发送）。`
          : `最新询盘中未出现明确产品关键词，取库存前 ${matched.length} 个产品起草回复（仅草稿，未发送），建议人工确认产品后再发。`;
        evidence = matched.map(i => `库存：${nameOf(i)} 现货 ${num(i.stock)} 件，单价 $${num(priceOf(i))}，交期 ${i.leadTime || '-'} 天（来源：inventory + products）`);
      }
      return ok(200, { reply, replyZh, reasoning, evidence, engine: 'demo', demo: true });
    }

    // ===== 客户挖掘（演示数据） =====
    if (p === '/api/prospecting/run' && req.method === 'POST') {
      const b = await body(req);
      const sources = Array.isArray(b.sources) && b.sources.length ? b.sources : ['Google', 'LinkedIn', 'Alibaba'];
      const count = 3 + Math.floor(Math.random() * 6); // 3–8
      const stems = ['Bright', 'Global', 'Prime', 'Nova', 'Atlas', 'Summit', 'Horizon', 'United', 'Everest', 'Pinnacle'];
      const suffixes = ['Trading Co.', 'Import & Export Ltd', 'Sourcing Group', 'International LLC', 'Distributors Inc'];
      const firsts = ['John', 'Anna', 'Carlos', 'Ahmed', 'Priya', 'Maria', 'David', 'Sofia'];
      const run = { id: uid('MR'), product: b.product || '', country: b.country || '', keyword: b.keyword || '', sources, count, engine: 'demo', demo: true, at: nowISO() };
      db.miningRuns.push(run);
      const prospects = [];
      for (let i = 0; i < count; i++) {
        const stem = stems[(i * 3 + count) % stems.length];
        const company = `${stem} ${suffixes[i % suffixes.length]}`;
        const contact = firsts[(i * 2 + 1) % firsts.length];
        const pr = {
          id: uid('PR'), runId: run.id, company, country: b.country || '', source: sources[i % sources.length],
          product: b.product || '', matchScore: 70 + Math.floor(Math.random() * 26),
          intentScore: 50 + Math.floor(Math.random() * 41),
          contact, email: `sales@${stem.toLowerCase()}.com`, imported: false
        };
        db.prospects.push(pr); prospects.push(pr);
      }
      audit(db, 'create', 'miningRuns', run.id, `挖掘 ${run.product || ''} / ${run.country || ''}，${count} 条演示线索`);
      return ok(200, { run, prospects }, true);
    }

    // ===== 独立站集成 =====
    if (p === '/api/site/key' && req.method === 'GET') {
      return ok(200, { apiKey: db.siteIntegration.apiKey || '', enabled: db.siteIntegration.enabled !== false });
    }
    if (p === '/api/site/key' && req.method === 'POST') {
      const hex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      db.siteIntegration.apiKey = 'guca_' + hex;
      return ok(200, { apiKey: db.siteIntegration.apiKey }, true);
    }
    if (p === '/api/site/inquiry' && req.method === 'POST') {
      const b = await body(req);
      const valid = db.siteIntegration.enabled !== false && db.siteIntegration.apiKey && b.apiKey === db.siteIntegration.apiKey;
      if (!valid) {
        db.inquiryLogs.push({ id: uid('IL'), at: nowISO(), status: 'rejected', company: b.company || '', email: b.email || '', source: b.source || '独立站', reason: 'invalid apiKey' });
        return ok(401, { ok: false, error: 'invalid apiKey' }, true);
      }
      const lead = {
        id: uid('L'), name: b.contact || '', company: b.company || '', contact: b.contact || '',
        email: b.email || '', country: b.country || '', product: b.product || '',
        message: b.message || '', source: '独立站询盘', status: '新线索',
        created: todayStr(), createdAt: nowISO()
      };
      db.leads.push(lead);
      db.inquiryLogs.push({ id: uid('IL'), at: nowISO(), status: 'created', company: b.company || '', email: b.email || '', source: b.source || '独立站', leadId: lead.id });
      audit(db, 'create', 'leads', lead.id, `独立站询盘：${b.company || ''}`);
      return ok(200, { ok: true, leadId: lead.id }, true);
    }
    if (p === '/api/site/test' && req.method === 'POST') {
      const lead = {
        id: uid('L'), name: '测试客户', company: '独立站测试', contact: '测试客户',
        email: 'test@example.com', country: '美国', product: '测试产品',
        message: '站点集成测试询盘', source: '独立站询盘', status: '新线索',
        created: todayStr(), createdAt: nowISO()
      };
      db.leads.push(lead);
      db.inquiryLogs.push({ id: uid('IL'), at: nowISO(), status: 'created', company: '独立站测试', email: 'test@example.com', source: 'site-test', leadId: lead.id });
      audit(db, 'create', 'leads', lead.id, '独立站测试询盘');
      return ok(200, { ok: true, leadId: lead.id }, true);
    }

    // ===== 自动化规则 =====
    if (p === '/api/workflows' && req.method === 'GET') {
      return ok(200, db.workflows.length ? db.workflows : PRESET_RULES);
    }
    if (p === '/api/workflows/run' && req.method === 'POST') {
      if (db.appSettings.automationEnabled === false) return ok(200, { ran: 0, logs: [] });
      const logs = runWorkflows(db);
      return ok(200, { ran: logs.length, logs }, true);
    }

    // ===== 兼容 v1：CSV 导入 / WhatsApp 模拟发送 =====
    if (p === '/api/import' && req.method === 'POST') {
      const b = await body(req);
      const type = COLLECTIONS.includes(b.type) ? b.type : 'leads';
      const lines = String(b.csv || '').trim().split('\n');
      if (lines.length < 2) return ok(400, { ok: false, error: 'CSV 至少需要表头+1行' });
      const cols = lines[0].split(',').map(s => s.trim());
      let n = 0;
      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const vals = line.split(',').map(s => s.trim());
        const row = { id: uid(PREFIX[type] || 'X'), createdAt: nowISO() };
        cols.forEach((c, i) => { row[c] = vals[i] || ''; });
        if (type === 'leads') { row.value = num(row.value); row.custom = row.custom || {}; row.status = row.status || '新线索'; }
        db[type].push(row); n++;
      }
      audit(db, 'create', type, '', `CSV 导入 ${n} 条`);
      return ok(200, { ok: true, imported: n }, true);
    }
    if (p === '/api/whatsapp/send' && req.method === 'POST') {
      const b = await body(req);
      const m = { id: uid('W'), leadId: b.leadId || '', from: 'me', text: b.text || '', date: nowISO().slice(0, 16).replace('T', ' ') };
      db.whatsapp.push(m);
      audit(db, 'create', 'whatsapp', m.id, 'WhatsApp 模拟发送');
      return ok(200, { ok: true, message: m, note: '模拟发送：未接真实 WhatsApp Cloud API，需配置 token + phone_number_id' }, true);
    }

    // ===== 线索转化 / 报价流转 =====
    if (parts[1] === 'leads' && parts[3] === 'convert' && req.method === 'POST') {
      const lead = db.leads.find(x => x.id === parts[2]);
      if (!lead) return ok(404, { error: 'lead not found' });
      const customer = {
        id: uid('C'), company: lead.company || '', contact: lead.name || '', name: lead.name || '',
        country: lead.country || '', email: lead.email || '', phone: lead.phone || '',
        level: lead.level || 'B', source: lead.source || '', createdAt: nowISO()
      };
      db.customers.push(customer);
      db.contacts.push({ id: uid('CT'), customerId: customer.id, name: lead.name || '', email: lead.email || '', phone: lead.phone || '', createdAt: nowISO() });
      lead.status = '已转化'; lead.converted = true; lead.customerId = customer.id;
      audit(db, 'create', 'customers', customer.id, `线索 ${lead.id} 转化`);
      return ok(200, customer, true);
    }
    if (parts[1] === 'quotes' && parts[3] === 'revise' && req.method === 'POST') {
      const q = db.quotes.find(x => x.id === parts[2]);
      if (!q) return ok(404, { error: 'quote not found' });
      const next = { ...q, id: uid('Q'), version: num(q.version || 1) + 1, status: '草稿', createdAt: nowISO(), revisedFrom: q.id, items: JSON.parse(JSON.stringify(q.items || [])) };
      db.quotes.push(next);
      audit(db, 'create', 'quotes', next.id, `报价修订 v${next.version}`);
      return ok(200, next, true);
    }
    if (parts[1] === 'quotes' && parts[3] === 'to-deal' && req.method === 'POST') {
      const q = db.quotes.find(x => x.id === parts[2]);
      if (!q) return ok(404, { error: 'quote not found' });
      const amount = q.total != null ? num(q.total) : (q.items || []).reduce((s, i) => s + num(i.qty) * num(i.price), 0);
      const deal = {
        id: uid('D'), title: q.title || `报价 ${q.id} 商机`, company: q.company || '', country: q.country || '',
        amount, stage: 'quote', quoteId: q.id, owner: q.owner || '', closeDate: q.validUntil || '', createdAt: nowISO()
      };
      db.deals.push(deal);
      audit(db, 'create', 'deals', deal.id, `报价 ${q.id} 转商机`);
      return ok(200, deal, true);
    }
    if (parts[1] === 'quotes' && parts[3] === 'to-order' && req.method === 'POST') {
      const q = db.quotes.find(x => x.id === parts[2]);
      if (!q) return ok(404, { error: 'quote not found' });
      const r = createOrder(db, { quoteId: q.id, customerId: q.customerId || '', title: q.title || '', items: q.items || [] });
      return ok(200, r, true);
    }

    // ===== 通用 REST =====
    const coll = parts[1];
    if (!COLLECTIONS.includes(coll)) return ok(404, { error: 'unknown collection' });
    const id = parts[2];
    if (req.method === 'GET' && !id) {
      let rows = db[coll];
      const q = u.searchParams.get('q');
      if (q) { const needle = q.toLowerCase(); rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(needle)); }
      return ok(200, rows);
    }
    if (req.method === 'GET' && id) return ok(200, db[coll].find(x => x.id === id) || null);
    if (req.method === 'POST' && !id) {
      const b = await body(req);
      if (coll === 'orders') {
        const r = createOrder(db, b);
        return ok(200, r, true);
      }
      const row = { createdAt: nowISO(), ...b, id: uid(PREFIX[coll] || 'X') };
      db[coll].push(row);
      audit(db, 'create', coll, row.id, row.name || row.title || row.company || '');
      return ok(200, row, true);
    }
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const b = await body(req);
      const i = db[coll].findIndex(x => x.id === id);
      if (i < 0) return ok(404, { error: 'not found' });
      db[coll][i] = { ...db[coll][i], ...b, id };
      audit(db, 'update', coll, id, db[coll][i].name || db[coll][i].title || db[coll][i].company || '');
      return ok(200, db[coll][i], true);
    }
    if (req.method === 'DELETE' && id) {
      db[coll] = db[coll].filter(x => x.id !== id);
      audit(db, 'delete', coll, id, '');
      return ok(200, { ok: true }, true);
    }
    return ok(405, { error: 'method not allowed' });
  } catch (e) {
    if (e && e.message === 'invalid JSON') return json(res, 400, { error: 'invalid JSON' });
    return json(res, 500, { error: String(e && e.message || e) });
  }
});
server.listen(PORT, () => console.log(`Guca CRM v2.0.0 running on http://127.0.0.1:${PORT}`));
