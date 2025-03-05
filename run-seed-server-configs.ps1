try {
    Write-Host "Running migration..." -ForegroundColor Cyan
    npx prisma migrate dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration completed successfully." -ForegroundColor Green
        
        Write-Host "Seeding server configuration data..." -ForegroundColor Cyan
        npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed-server-configs.ts
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Server configuration data seeded successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to seed server configuration data." -ForegroundColor Red
        }
    } else {
        Write-Host "Migration failed." -ForegroundColor Red
    }
} catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
} 