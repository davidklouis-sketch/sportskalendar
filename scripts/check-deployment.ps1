# Deployment Health Check Script
Write-Host "🔍 Checking Sportskalendar Deployment Status" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Check if containers are running
Write-Host "📦 Container Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "sportskalendar" | Write-Host

Write-Host ""
Write-Host "🌐 Network Status:" -ForegroundColor Yellow
docker network ls | Select-String "traefik" | Write-Host

Write-Host ""
Write-Host "🔗 Traefik Status:" -ForegroundColor Yellow
docker logs traefik --tail 10 2>$null | Write-Host

Write-Host ""
Write-Host "📱 Frontend Status:" -ForegroundColor Yellow
docker logs sportskalendar-frontend --tail 10 2>$null | Write-Host

Write-Host ""
Write-Host "🔧 Backend Status:" -ForegroundColor Yellow
docker logs sportskalendar-backend --tail 10 2>$null | Write-Host

Write-Host ""
Write-Host "🗄️ Database Status:" -ForegroundColor Yellow
docker logs sportskalendar-db --tail 5 2>$null | Write-Host

Write-Host ""
Write-Host "🌍 DNS Check:" -ForegroundColor Yellow
nslookup sportskalendar.de | Write-Host

Write-Host ""
Write-Host "🔒 SSL Certificate Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://sportskalendar.de" -Method Head -TimeoutSec 10
    Write-Host "✅ HTTPS connection successful - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Health Endpoints:" -ForegroundColor Yellow
Write-Host "Backend Health:" -ForegroundColor Cyan
try {
    $backendHealth = Invoke-WebRequest -Uri "https://api.sportskalendar.de/api/health" -TimeoutSec 10
    Write-Host "✅ Backend health check successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Frontend Health:" -ForegroundColor Cyan
try {
    $frontendHealth = Invoke-WebRequest -Uri "https://sportskalendar.de" -Method Head -TimeoutSec 10
    Write-Host "✅ Frontend health check successful - Status: $($frontendHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Deployment check complete!" -ForegroundColor Green
