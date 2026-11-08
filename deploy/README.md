# Guca CRM 1.0.0 — Flexus 部署包
零依赖：只用 Node 内置模块，不用 npm install，不会卡在 npm ci。
内存 < 50 MB，2 vCPU / 2 GB 能跑。数据在 data/db.json 一个文件，备份就是拷走它。

## 装到 Flexus（Ubuntu 24.04，IP 60.204.243.24）
1. 把本压缩包传到服务器，解压：tar xzf guca-crm-1.0.0.tar.gz && cd guca-crm-1.0.0
2. sudo bash deploy/install-flexus.sh
3. 华为云安全组放行 TCP 8080，打开 http://60.204.243.24:8080/
4. 可选：把 deploy/nginx-guca.conf 放到 /etc/nginx/sites-enabled/，用 80 端口访问

## 本地试跑
node server.js ，打开 http://127.0.0.1:3000 ，PORT=8080 node server.js 改端口。
种子数据：6 线索（美国/德国/阿联酋/巴西/印度/越南）、4 商机、3 客户，正式用前请清掉换真实客户。

## 仍是占位
WhatsApp 模拟发送未接 Cloud API；AI 翻译是常用短句词典；企业微信占位；邮件发送未实现。
