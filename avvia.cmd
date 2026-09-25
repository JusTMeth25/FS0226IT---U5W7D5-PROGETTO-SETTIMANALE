@echo off
setlocal
title Salone auto (locale)
cd /d "%~dp0"

rem ---------- PostgreSQL: serve il database U5W7D5-PROGETTO-SETTIMANALE sulla 5432 ----------
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try { $c.Connect('localhost',5432); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo [postgres] porta 5432 chiusa: il backend non partira'.
  echo            createdb -U postgres U5W7D5-PROGETTO-SETTIMANALE
) else (
  echo [postgres] in ascolto sulla 5432.
)

rem ---------- Variabili del backend: senza JWT_SECRET il BE non parte ----------
if not defined JWT_SECRET echo [BE] JWT_SECRET non impostata: il backend non partira'.
if not defined ADMIN_PASSWORD echo [BE] ADMIN_PASSWORD non impostata: nessun amministratore verra' creato.

if not exist "fe\node_modules" (
  echo [FE] npm install...
  pushd fe
  call npm install
  popd
)

start "BE (8080)" /D "%~dp0be" cmd /k .\mvnw.cmd spring-boot:run
start "FE (5173)" /D "%~dp0fe" cmd /k npm run dev

echo.
echo  Applicazione : http://localhost:5173
echo  Stato        : http://localhost:8080/api/stato
echo  Salute       : http://localhost:8080/actuator/health
endlocal
