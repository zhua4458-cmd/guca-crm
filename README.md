# Guca CRM

整合三套开源源码的可用原型（不是设计稿）：
- **Frappe CRM**：线索/商机一页详情、Kanban 拖拽、保存视图、SLA 响应时限
- **GoodJob CRM**：外贸跟进提醒、资料库（版本）、WhatsApp 时间线 + AI 翻译、企业微信（占位）
- **EspoCRM**：轻量部署、无代码自定义字段、邮件/工作流思想（本原型用任务 + 跟进记录实现）

## 技术栈
Node 24 内置 http/fs/path，零依赖、零 npm 构建、零框架。
数据存 `data/db.json`（首次启动从 `data/seed.json` 复制），可换 MySQL。
内存占用 < 50 MB，2 vCPU / 2 GB 服务器可跑。

## 运行
```bash
cd ~/workspace/guca-crm
node server.js
# 打开 http://127.0.0.1:3000
```
端口可用 `PORT=8080 node server.js` 改。

## 功能
工作台（统计/逾期/漏斗）、线索列表 + 新增/编辑/筛选/保存视图、商机 Kanban 拖拽改阶段、
客户/联系人、跟进记录 + 提醒（逾期标红）、资料库、WhatsApp 模拟发送 + AI 翻译占位、
CSV 导入导出、报表（按国家/负责人）、自定义字段（加到线索表单）。

## 仍是占位，需真实凭证才能接通
- WhatsApp：需 WhatsApp Cloud API 的 token + phone_number_id（当前 `/api/whatsapp/send` 只写本地时间线）
- AI 翻译：内置常用外贸短句词典演示，未命中时提示接 DeepL / Google Translate
- 企业微信：模块占位，需 corp id + secret，未实现
- 邮件发送：未实现，只有跟进记录

## 源码出处（只读，未改动）
- `~/workspace/GoodJob`
- `~/workspace/guca-src/espocrm`
- `~/workspace/guca-src/frappe-crm`

## 注意：这个仓库是哪个版本
这是 Guca CRM 的可运行 Node 原型 v1.0.0（零依赖、本地 JSON 数据、Flexus 部署脚本）。
Muse 里在线用的 Guca 是另外一个完整版（聊天翻译、库存价目、手机桌面布局、AI 挖掘等都在那上面），
它的代码在 Muse 的托管空间里，不是一份本地文件树，所以这次传上来的不是那个完整版的源码。
想把完整版也落到 GitHub，需要另外做源码导出/重建，再说一声就行。
