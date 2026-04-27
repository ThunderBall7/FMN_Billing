@echo off
title FMN Billing Software
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Install Node.js yourself only from a source you trust.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Dependencies are missing.
    echo This private build will not download anything automatically.
    echo Run "npm install" yourself only if you trust the package list.
    pause
    exit /b 1
)

echo.
echo  Starting FMN Billing Software...
echo  (Frontend-only mode on Vite dev server)
echo.
start "" cmd /k "npm run dev:win"
timeout /t 3 /nobreak >nul
start http://localhost:5173
