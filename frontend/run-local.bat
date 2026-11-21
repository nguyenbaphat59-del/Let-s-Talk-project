@echo off
cd /d "%~dp0.."
echo Starting LET'S TALK Backend and Frontend...
start "LET'S TALK Backend" cmd /k "npm run dev:backend"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:5500
npm run dev:frontend
