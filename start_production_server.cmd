@echo off
title Om Knowledge OS - Production Server
echo ========================================================================
echo   Om Knowledge OS - Launching Zero-Dependency Production Server
echo ========================================================================
echo.
node "%~dp0scripts\serve_production.mjs" --port 8080
pause
