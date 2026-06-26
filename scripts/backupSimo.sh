#!/bin/bash
set -euo pipefail

# Change to the directory of this script
cd "$(dirname "$0")"

export HOME=/root

echo "Triggering redis dump"
docker-compose exec redis redis-cli --raw SAVE

echo "Creating influxdb backup"
docker exec influxdb influxd backup -portable /tmp/influxdb_backup
docker cp influxdb:/tmp/influxdb_backup .
docker exec influxdb rm -fr /tmp/influxdb_backup

echo "Creating a tar ball"
now=$(date +"%m_%d_%Y")
tar -cf backup-${now}.tar redis-data grafana_data simojs-data influxdb_backup settings_pythonsimo.cfg settings.json 

echo "Gzipping it"
gzip -f backup-${now}.tar

echo "Uploading backup-${now}.tar.gz to S3"
aws s3api put-object --bucket simobot-backup --key backup-${now}.tar.gz --body backup-${now}.tar.gz

echo "Backup done!"

echo "Cleaning up"
rm -fr influxdb_backup backup-${now}.tar.gz
