# PowerShell script to backup Flowbit data
param(
    [string]$BackupPath = ".\backups\$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
)

Write-Host "Creating backup directory: $BackupPath" -ForegroundColor Green
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null

Write-Host "Backing up MongoDB data..." -ForegroundColor Yellow
docker exec flowbit-mongodb mongodump --host localhost --port 27017 --username admin --password password --authenticationDatabase admin --db flowbit --out /tmp/backup

# Copy backup from container to host
docker cp flowbit-mongodb:/tmp/backup "$BackupPath\mongodb"

Write-Host "Backing up n8n data..." -ForegroundColor Yellow
docker run --rm -v flowbit_n8n_data:/data -v "${PWD}\${BackupPath}:/backup" alpine tar czf /backup/n8n_data.tar.gz -C /data .

Write-Host "Backing up n8n files..." -ForegroundColor Yellow
docker run --rm -v flowbit_n8n_files:/data -v "${PWD}\${BackupPath}:/backup" alpine tar czf /backup/n8n_files.tar.gz -C /data .

Write-Host "Backing up API logs..." -ForegroundColor Yellow
docker run --rm -v flowbit_api_logs:/data -v "${PWD}\${BackupPath}:/backup" alpine tar czf /backup/api_logs.tar.gz -C /data .

Write-Host "Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $BackupPath" -ForegroundColor Green

# Create a backup manifest
$manifest = @{
    timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    containers = @('flowbit-mongodb', 'flowbit-n8n', 'flowbit-api')
    volumes = @('mongo_data', 'mongo_config', 'n8n_data', 'n8n_files', 'api_logs')
} | ConvertTo-Json

$manifest | Out-File "$BackupPath\manifest.json"
Write-Host "Backup manifest created: $BackupPath\manifest.json" -ForegroundColor Green
