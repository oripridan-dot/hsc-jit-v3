#!/bin/bash
# Restore script for HSC-JIT backups

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <backup_type> <backup_file>"
    echo "  backup_type: redis | postgres"
    echo "  backup_file: path to backup file (.gz)"
    exit 1
fi

BACKUP_TYPE=$1
BACKUP_FILE=$2
DATE=$(date '+%Y-%m-%d %H:%M:%S')

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

log() {
    echo "[$DATE] $1"
}

restore_redis() {
    local backup_file=$1
    local redis_host=${REDIS_HOST:-localhost}
    local redis_port=${REDIS_PORT:-6379}
    
    log "Restoring Redis from $backup_file"
    
    if ! command -v redis-cli &> /dev/null; then
        echo "Error: redis-cli not found"
        exit 1
    fi
    
    # Decompress
    local temp_file=$(mktemp)
    gunzip -c "$backup_file" > "$temp_file"
    
    # Stop accepting writes
    log "Stopping Redis writes..."
    redis-cli -h "$redis_host" -p "$redis_port" CONFIG SET stop-writes-on-bgsave-error yes
    
    # Restore
    log "Restoring data..."
    redis-cli -h "$redis_host" -p "$redis_port" SHUTDOWN NOSAVE || true
    sleep 2
    
    # Copy dump file
    sudo cp "$temp_file" /var/lib/redis/dump.rdb
    sudo chown redis:redis /var/lib/redis/dump.rdb
    
    # Restart Redis
    log "Restarting Redis..."
    sudo systemctl restart redis-server
    sleep 2
    
    # Verify
    if redis-cli -h "$redis_host" -p "$redis_port" ping > /dev/null; then
        log "Redis restore completed successfully"
    else
        echo "Error: Redis failed to start after restore"
        exit 1
    fi
    
    rm -f "$temp_file"
}

restore_postgres() {
    local backup_file=$1
    local postgres_host=${POSTGRES_HOST:-localhost}
    local postgres_user=${POSTGRES_USER:-admin}
    local postgres_db=${POSTGRES_DB:-hsc_jit}
    
    log "Restoring PostgreSQL from $backup_file"
    
    if ! command -v psql &> /dev/null; then
        echo "Error: psql not found"
        exit 1
    fi
    
    # Create backup of current DB
    local backup_suffix=$(date +%s)
    log "Creating backup of current database as ${postgres_db}_backup_${backup_suffix}"
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$postgres_host" \
        -U "$postgres_user" \
        "$postgres_db" | \
        gzip > "${postgres_db}_backup_${backup_suffix}.sql.gz"
    
    # Drop and recreate DB
    log "Dropping and recreating database..."
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$postgres_host" \
        -U "$postgres_user" \
        -tc "DROP DATABASE IF EXISTS $postgres_db;"
    
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$postgres_host" \
        -U "$postgres_user" \
        -tc "CREATE DATABASE $postgres_db;"
    
    # Restore
    log "Restoring data..."
    gunzip -c "$backup_file" | \
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$postgres_host" \
        -U "$postgres_user" \
        "$postgres_db"
    
    log "PostgreSQL restore completed successfully"
    log "Backup of previous database saved as: ${postgres_db}_backup_${backup_suffix}.sql.gz"
}

case "$BACKUP_TYPE" in
    redis)
        restore_redis "$BACKUP_FILE"
        ;;
    postgres)
        restore_postgres "$BACKUP_FILE"
        ;;
    *)
        echo "Error: Unknown backup type: $BACKUP_TYPE"
        exit 1
        ;;
esac

log "Restore completed"
