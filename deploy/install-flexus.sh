#!/bin/bash
# Guca CRM one-command install for Huawei Cloud Flexus L, Ubuntu 24.04, 2C/2G
# Run as root on the server, from the directory containing this package:
#   tar xzf guca-crm-1.0.0.tar.gz && cd guca-crm-1.0.0 && sudo bash deploy/install-flexus.sh
set -e
if [ "$(id -u)" != "0" ]; then echo "please run as root"; exit 1; fi
command -v node >/dev/null || { echo "installing nodejs..."; apt-get update -y && apt-get install -y nodejs; }
node --version
mkdir -p /opt/guca-crm
cp -r server.js package.json public data deploy /opt/guca-crm/
# fresh data on first install: start from seed, never ship a used db.json
rm -f /opt/guca-crm/data/db.json
cp deploy/guca-crm.service /etc/systemd/system/guca-crm.service
systemctl daemon-reload
systemctl enable guca-crm
systemctl restart guca-crm
sleep 2
systemctl status guca-crm --no-pager | head -12
curl -s -o /dev/null -w "homepage HTTP %{http_code}\n" http://127.0.0.1:8080/
curl -s http://127.0.0.1:8080/api/stats; echo
echo "Guca CRM is running at http://<server-ip>:8080/  (open port 8080 in the security group)"
echo "Backup: bash /opt/guca-crm/deploy/backup.sh  (copies data/db.json)"
