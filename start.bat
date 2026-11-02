@echo off
echo ========================================================
echo  Weather-Aware Truck Routing - Spotter AI Assessment
echo ========================================================
echo.
echo Starting Django Backend on http://127.0.0.1:8000 ...
start "Spotter AI Backend" cmd /k ".\backend\venv\Scripts\python backend/manage.py runserver 8000"

echo Starting React Vite Frontend on http://localhost:3000 ...
start "Spotter AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo - API Backend: http://127.0.0.1:8000/
echo - Web Dashboard: http://localhost:3000/
echo ========================================================
pause

