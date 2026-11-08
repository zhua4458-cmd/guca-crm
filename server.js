// Guca CRM — 零依赖 Node 后端（只用内置 http/fs/path），无 npm 构建，单文件部署。
// 数据存在 data/db.json，首次启动从 data/seed.json 复制。
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, 'data', 'db.json');
const SEED = path.join(__dirname, 'data', 'seed.json');
if (!fs.existsSync(DB)) fs.copyFileSync(SEED, DB);
const load = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const uid = p => p + Date.now().toString(36);
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
const COLL = ['leads', 'deals', 'customers', 'activities', 'tasks', 'docs', 'whatsapp', 'customFields'];

function body(req) {
  return new Promise(r => { let s = ''; req.on('data', c => s += c); req.on('end', () => { try { r(s ? JSON.parse(s) : {}); } catch { r({}); } }); });
}
const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
function toCsv(rows, cols) { return [cols.join(','), ...rows.map(r => cols.map(c => csvEscape(r[c])).join(','))].join('\n'); }

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  // 静态文件
  if (req.method === 'GET' && (p === '/' || p.startsWith('/public/'))) {
    const f = p === '/' ? 'public/index.html' : p.slice(1);
    const fp = path.join(__dirname, f);
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    const type = fp.endsWith('.js') ? 'text/javascript' : fp.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type }); return fs.createReadStream(fp).pipe(res);
  }
  if (!p.startsWith('/api/')) { res.writeHead(404); return res.end('not found'); }
  const db = load();
  const parts = p.split('/').filter(Boolean); // api, coll, id?
  try {
    if (p === '/api/stats') {
      const overdue = db.tasks.filter(t => !t.done && t.due < '2026-11-09').length;
      const funnel = {}; db.deals.forEach(d => funnel[d.stage] = (funnel[d.stage] || 0) + 1);
      const byCountry = {}; db.leads.forEach(l => byCountry[l.country] = (byCountry[l.country] || 0) + 1);
      const total = db.deals.reduce((s, d) => s + (+d.amount || 0), 0);
      return json(res, 200, { leads: db.leads.length, deals: db.deals.length, totalAmount: total, overdueTasks: overdue, funnel, byCountry });
    }
    if (p === '/api/translate' && req.method === 'POST') {
      const b = await body(req);
      // 占位翻译：内置常用外贸短句词典，未命中时明确标注需接翻译 API，不伪装成真翻译
      const dict = { '报价': 'Quotation', '样品': 'Sample', '交期': 'Lead time', '你好': 'Hello', '谢谢': 'Thank you', '请确认': 'Please confirm', '价格': 'Price' };
      let out = b.text || '';
      for (const [k, v] of Object.entries(dict)) out = out.split(k).join(v);
      const hit = out !== (b.text || '');
      return json(res, 200, { translated: out, stub: !hit, note: hit ? '词典命中（演示）' : '未命中词典：需接真实翻译 API（DeepL/Google Translate）后才有准确翻译' });
    }
    if (p === '/api/whatsapp/send' && req.method === 'POST') {
      const b = await body(req);
      const m = { id: uid('W'), leadId: b.leadId, from: 'me', text: b.text, date: new Date().toISOString().slice(0, 16).replace('T', ' ') };
      db.whatsapp.push(m); save(db); return json(res, 200, { ok: true, message: m, note: '模拟发送：未接真实 WhatsApp Cloud API，需配置 token + phone_number_id' });
    }
    if (p === '/api/export' && req.method === 'GET') {
      const type = u.searchParams.get('type') || 'leads';
      const cols = type === 'deals' ? ['id', 'title', 'company', 'country', 'stage', 'amount', 'owner'] : ['id', 'name', 'company', 'country', 'product', 'status', 'value', 'owner'];
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename=${type}.csv` });
      return res.end('\ufeff' + toCsv(db[type] || [], cols));
    }
    if (p === '/api/import' && req.method === 'POST') {
      const b = await body(req); // {type, csv}
      const lines = (b.csv || '').trim().split('\n'); if (lines.length < 2) return json(res, 400, { ok: false, error: 'CSV 至少需要表头+1行' });
      const cols = lines[0].split(',').map(s => s.trim());
      let n = 0;
      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const vals = line.split(',').map(s => s.trim());
        const row = { id: uid('L') }; cols.forEach((c, i) => row[c] = vals[i] || '');
        row.value = +row.value || 0; row.custom = {}; row.status = row.status || '新线索';
        db.leads.push(row); n++;
      }
      save(db); return json(res, 200, { ok: true, imported: n });
    }
    const coll = parts[1];
    if (!COLL.includes(coll)) return json(res, 404, { error: 'unknown collection' });
    const id = parts[2];
    if (req.method === 'GET' && !id) return json(res, 200, db[coll]);
    if (req.method === 'GET' && id) return json(res, 200, db[coll].find(x => x.id === id) || null);
    if (req.method === 'POST') {
      const b = await body(req);
      const prefix = { leads: 'L', deals: 'D', customers: 'C', activities: 'A', tasks: 'T', docs: 'K', whatsapp: 'W', customFields: 'CF' }[coll];
      const row = { id: uid(prefix), ...b };
      if (coll === 'leads' && !row.custom) row.custom = {};
      db[coll].push(row); save(db); return json(res, 200, row);
    }
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) {
      const b = await body(req);
      const i = db[coll].findIndex(x => x.id === id);
      if (i < 0) return json(res, 404, { error: 'not found' });
      db[coll][i] = { ...db[coll][i], ...b, id }; save(db); return json(res, 200, db[coll][i]);
    }
    if (req.method === 'DELETE' && id) {
      db[coll] = db[coll].filter(x => x.id !== id); save(db); return json(res, 200, { ok: true });
    }
    return json(res, 405, { error: 'method not allowed' });
  } catch (e) { return json(res, 500, { error: String(e) }); }
});
server.listen(PORT, () => console.log(`Guca CRM running on http://127.0.0.1:${PORT}`));
