Write-Host "Starting IntelliInspect Application..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start all three services:" -ForegroundColor Yellow
Write-Host "- Frontend (Angular) on http://localhost:4200" -ForegroundColor Cyan
Write-Host "- Backend (.NET) on http://localhost:8080" -ForegroundColor Cyan
Write-Host "- ML Service (Python) on http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
Write-Host ""

try {
    docker-compose up --build
}
catch {
    Write-Host "Error starting services. Make sure Docker is running." -ForegroundColor Red
    Read-Host "Press Enter to continue"
}
