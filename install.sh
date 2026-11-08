#!/bin/bash
# Guca CRM 一键安装：装 Node、拉源码、装服务、开 8080 端口、启动
# 用法（一条命令，root 或 sudo）：
#   curl -fsSL https://raw.githubusercontent.com/zhua4458-cmd/guca-crm/main/install.sh | sudo bash
# 装完打开 http://服务器IP:8080/
set -e
if [ "$(id -u)" != "0" ]; then echo "请用 root 或 sudo 运行"; exit 1; fi
apt-get update -y
apt-get install -y nodejs curl
cd /tmp
rm -rf guca-crm-main guca-crm.tar.gz
curl -L -o guca-crm.tar.gz https://github.com/zhua4458-cmd/guca-crm/archive/refs/heads/main.tar.gz
tar xzf guca-crm.tar.gz
cd guca-crm-main
bash deploy/install-flexus.sh
# 开端口：本机防火墙放行 8080
if command -v ufw >/dev/null 2>&1; then ufw allow 8080/tcp || true; ufw --force enable || true; fi
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "装好了，打开 http://${IP:-服务器IP}:8080/"
echo "注意：华为云/阿里云等还需在控制台安全组里放行 TCP 8080，本机命令开不了安全组。"
