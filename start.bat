@echo off
echo Starting IntelliInspect Application...
echo.
echo This will start all three services:
echo - Frontend (Angular) on http://localhost:4200
echo - Backend (.NET) on http://localhost:5000
echo - ML Service (Python) on http://localhost:8000
echo.
echo Press Ctrl+C to stop all services
echo.

docker-compose up --build

pause
