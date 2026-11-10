@echo off
title Om Knowledge OS - Mobile Firewall Configurator
echo ========================================================================
echo   [OM] Om Knowledge OS - S25 Ultra Firewall Automatic Elevation
echo ========================================================================
echo.
echo Requesting Windows Administrator elevation...
echo When the Windows prompt appears, click 'Yes' to allow firewall configuration.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0allow_notes_pro_sync_firewall.ps1\"\"'"
echo.
echo Done! Once you confirmed the prompt, your S25 Ultra can access both ports 8080 and 5173.
pause
