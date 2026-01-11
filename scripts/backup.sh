#!/bin/bash
# Automated backup script for HSC-JIT databases and cache

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-.}/backups"
RETENTION_DAYS=${RETENTION_DAYS:-7}
S3_BUCKET=${S3_BUCKET:-""}
LOG_FILE="$BACKUP_DIR/backup-$DATE.log"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting HSC-JIT backup"

# ============ Backup Redis ============
if command -v redis-cli &> /dev/null; then
    log "Backing up Redis..."
    REDIS_HOST=${REDIS_HOST:-localhost}
    REDIS_PORT=${REDIS_PORT:-6379}
    
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" SAVE
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" BGSAVE
    
    if [ -f /var/lib/redis/dump.rdb ]; then
        gzip -c /var/lib/redis/dump.rdb > "$BACKUP_DIR/redis-$DATE.rdb.gz"
        log "Redis backup created: $BACKUP_DIR/redis-$DATE.rdb.gz"
    else
        log "Warning: Redis dump file not found at expected location"
    fi
else
    log "Warning: redis-cli not found, skipping Redis backup"
fi

# ============ Backup PostgreSQL ============
if command -v pg_dump &> /dev/null; then
    log "Backing up PostgreSQL..."
    POSTGRES_HOST=${POSTGRES_HOST:-localhost}
    POSTGRES_USER=${POSTGRES_USER:-admin}
    POSTGRES_DB=${POSTGRES_DB:-hsc_jit}
    
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        "$POSTGRES_DB" | \
        gzip > "$BACKUP_DIR/postgres-$DATE.sql.gz"
    
    log "PostgreSQL backup created: $BACKUP_DIR/postgres-$DATE.sql.gz"
else
    log "Warning: pg_dump not found, skipping PostgreSQL backup"
fi

# ============ Upload to S3 ============
if [ ! -z "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Uploading backups to S3: $S3_BUCKET"
    aws s3 cp "$BACKUP_DIR/redis-$DATE.rdb.gz" "s3://$S3_BUCKET/redis/" || log "Warning: Failed to upload Redis backup"
    aws s3 cp "$BACKUP_DIR/postgres-$DATE.sql.gz" "s3://$S3_BUCKET/postgres/" || log "Warning: Failed to upload PostgreSQL backup"
    log "S3 upload completed"
else
    log "S3 upload skipped (bucket not configured or AWS CLI not found)"
fi

# ============ Cleanup old backups ============
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.gz" -mtime +"$RETENTION_DAYS" -delete
log "Cleanup completed"

log "Backup finished successfully"
exit 0
