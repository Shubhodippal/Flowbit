# PowerShell script to restore Flowbit data
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath
)

if (-not (Test-Path $BackupPath)) {
    Write-Error "Backup path does not exist: $BackupPath"
    exit 1
}

Write-Host "Restoring from backup: $BackupPath" -ForegroundColor Green

# Stop containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "Restoring MongoDB data..." -ForegroundColor Yellow
# Start only MongoDB for restore
docker-compose up -d mongodb
Start-Sleep 10  # Wait for MongoDB to be ready

# Copy backup to container and restore
docker cp "$BackupPath\mongodb" flowbit-mongodb:/tmp/restore
docker exec flowbit-mongodb mongorestore --host localhost --port 27017 --username admin --password password --authenticationDatabase admin --drop /tmp/restore/flowbit

Write-Host "Restoring n8n data..." -ForegroundColor Yellow
docker run --rm -v flowbit_n8n_data:/data -v "${PWD}\${BackupPath}:/backup" alpine sh -c "cd /data && rm -rf * && tar xzf /backup/n8n_data.tar.gz"

Write-Host "Restoring n8n files..." -ForegroundColor Yellow  
docker run --rm -v flowbit_n8n_files:/data -v "${PWD}\${BackupPath}:/backup" alpine sh -c "cd /data && rm -rf * && tar xzf /backup/n8n_files.tar.gz"

Write-Host "Restoring API logs..." -ForegroundColor Yellow
docker run --rm -v flowbit_api_logs:/data -v "${PWD}\${BackupPath}:/backup" alpine sh -c "cd /data && rm -rf * && tar xzf /backup/api_logs.tar.gz"

Write-Host "Starting all containers..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "Restore completed successfully!" -ForegroundColor Green
Write-Host "All containers are starting up..." -ForegroundColor Green
