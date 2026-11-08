# Guca CRM — Flexus 部署清单

目标机：华为云 Flexus L，Ubuntu 24.04，2 vCPU / 2 GB，IP 60.204.243.24
本机验证：2026-11-08，`node server.js` 首页 200，`/api/leads` 正常返回种子线索，
内存占用 < 50 MB，2G 机器能跑。验证后本地服务已停，无残留进程。

## 前置条件（部署前要用户确认）
- Flexus SSH 通道：记忆里没存 Flexus 的 SSH 凭证，之前 GoodJob 是走华为云控制台扫码登录。
  需要用户在控制台开终端，或给一个 SSH 登录方式，Q 才能把代码传上去。
- 端口：默认 3000，建议用 `PORT=8080`，并在华为云安全组 / Flexus 防火墙放行该端口。
- 域名（可选，现阶段不拦部署）：WhatsApp Cloud API 要 token + phone_number_id，
  企业微信要 corp id + secret；没这些之前两者保持占位，CRM 其余功能照常用。

## 部署步骤
1. 把 `~/workspace/guca-crm` 整个目录传到 Flexus，如 `/opt/guca-crm`
   （server.js、public/、data/ 都要带上，零依赖，不用 npm install）
2. `cd /opt/guca-crm && PORT=8080 node server.js`，先前台跑通一次
3. 确认 `http://60.204.243.24:8080/` 能打开后，做成 systemd 常驻服务，
   数据存在 `data/db.json`，备份就是拷走这个文件
4. 种子数据 6 线索 / 4 商机是演示数据，正式用之前在工作台里清掉或替换成真实客户

## 仍是占位（不要当成已接通）
- WhatsApp：`/api/whatsapp/send` 只写本地时间线，未接 Cloud API
- AI 翻译：常用外贸短句词典，未接 DeepL / Google Translate
- 企业微信：模块占位，未实现
- 邮件发送：未实现，只有跟进记录
