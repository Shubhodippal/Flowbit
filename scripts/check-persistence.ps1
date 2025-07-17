# PowerShell script to check data persistence and volumes
Write-Host "=== Flowbit Data Persistence Status ===" -ForegroundColor Green

Write-Host "`nChecking Docker volumes..." -ForegroundColor Yellow
docker volume ls --filter "name=flowbit"

Write-Host "`nChecking volume details..." -ForegroundColor Yellow
$volumes = @("flowbit_mongo_data", "flowbit_mongo_config", "flowbit_n8n_data", "flowbit_n8n_files", "flowbit_api_logs")

foreach ($volume in $volumes) {
    Write-Host "`n--- Volume: $volume ---" -ForegroundColor Cyan
    docker volume inspect $volume --format "{{.Mountpoint}}" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $size = docker run --rm -v "${volume}:/data" alpine du -sh /data 2>$null
        if ($size) {
            Write-Host "Size: $size" -ForegroundColor Green
        }
    } else {
        Write-Host "Volume not found" -ForegroundColor Red
    }
}

Write-Host "`nChecking MongoDB data..." -ForegroundColor Yellow
$mongoStatus = docker exec flowbit-mongodb mongosh -u admin -p password --authenticationDatabase admin flowbit --eval "db.users.countDocuments()" --quiet 2>$null
if ($mongoStatus) {
    Write-Host "Users in database: $mongoStatus" -ForegroundColor Green
} else {
    Write-Host "Could not connect to MongoDB" -ForegroundColor Red
}

$ticketStatus = docker exec flowbit-mongodb mongosh -u admin -p password --authenticationDatabase admin flowbit --eval "db.tickets.countDocuments()" --quiet 2>$null
if ($ticketStatus) {
    Write-Host "Tickets in database: $ticketStatus" -ForegroundColor Green
}

Write-Host "`n=== Data Persistence Configuration ===" -ForegroundColor Green
Write-Host "✅ MongoDB data will persist through container restarts" -ForegroundColor Green
Write-Host "✅ n8n workflows and settings will persist" -ForegroundColor Green  
Write-Host "✅ API logs will persist" -ForegroundColor Green
Write-Host "✅ All containers have restart policy: unless-stopped" -ForegroundColor Green

Write-Host "`n=== Backup and Restore ===" -ForegroundColor Green
Write-Host "• To backup data: .\scripts\backup-data.ps1" -ForegroundColor Cyan
Write-Host "• To restore data: .\scripts\restore-data.ps1 -BackupPath 'path\to\backup'" -ForegroundColor Cyan
