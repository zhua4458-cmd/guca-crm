#!/bin/bash
# Guca CRM backup: data is one file, copy it with a date stamp
set -e
cd /opt/guca-crm
mkdir -p /opt/guca-crm-backups
cp data/db.json "/opt/guca-crm-backups/db-$(date +%Y%m%d-%H%M).json"
echo "backup saved to /opt/guca-crm-backups/"
ls -t /opt/guca-crm-backups/ | head -5
