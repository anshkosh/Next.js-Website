#!/bin/bash
set -e

# Load environment variables
source /var/www/anshkosh/.env

# Configuration
BACKUP_DIR="/var/backups/anshkosh"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

echo "Starting database backup..."
pg_dump $DATABASE_URL | gzip > $DB_BACKUP_FILE

echo "Uploading to Cloudflare R2..."
# Assuming aws-cli is configured with profile 'r2'
aws s3 cp $DB_BACKUP_FILE s3://anshkosh-backups/ --profile r2 --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com

echo "Cleaning up local backups older than 7 days..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup process completed successfully."
