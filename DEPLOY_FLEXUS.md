# Guca CRM v2.0.0 — Flexus 部署清单

目标机：华为云 Flexus L，Ubuntu 24.04，2 vCPU / 2 GB，IP 60.204.243.24
本机验证：2026-11-08，`node server.js` 首页 200，`/api/stats` 空库全 0，
建线索、商机移阶段、订单扣库存、聊天翻译、独立站询盘都通过，
内存占用 < 50 MB，2G 机器能跑。验证后本地服务已停，无残留进程。

## 前置条件

- Flexus SSH 通道：记忆里没存 Flexus 的 SSH 凭证，之前是走华为云控制台扫码登录。
  需要用户在控制台开终端，或给一个 SSH 登录方式，才能把代码传上去。
- 端口：用 `PORT=8080`，并在华为云安全组放行 TCP 8080。
- 域名（可选，现阶段不拦部署）：WhatsApp Cloud API 要 token + phone_number_id，
  企业微信要 corp id + secret；没这些之前两者保持占位，CRM 其余功能照常用。

## 部署步骤

一键安装（服务器上 root 跑一条命令）：

```bash
curl -fsSL https://raw.githubusercontent.com/zhua4458-cmd/guca-crm/main/install.sh | sudo bash
```

手动装：

1. 把 `~/workspace/guca-crm` 整个目录传到 Flexus，如 `/opt/guca-crm`
   （server.js、public/、data/、deploy/ 都要带上，零依赖，不用 npm install）
2. `cd /opt/guca-crm && PORT=8080 node server.js`，先前台跑通一次
3. 确认 `http://60.204.243.24:8080/` 能打开后，用 `deploy/install-flexus.sh` 做成
   systemd 常驻服务，数据存在 `data/db.json`，备份就是拷走这个文件

## 数据

`data/seed.json` 是空库：首次启动就是空的，没有演示数据。

## 仍是占位（不要当成已接通）

- WhatsApp / 企业微信：本地时间线模拟，未接真实账号
- AI 翻译 / AI 回复 / AI 获客：没配 Key 走内置词典/演示引擎并标注
- 邮件发送：营销邮件模拟发送，未接真实邮件服务
