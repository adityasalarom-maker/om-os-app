---
name: om-os-pwa-mobile-build
description: Build, verify, and run the responsive Progressive Web Application (PWA) for Windows 11 desktop and Samsung Galaxy S25 Ultra over local network with offline service worker caching.
---

# Om Knowledge OS: PWA & Mobile Build

Use this skill when:
- Verifying TypeScript compilation (`tsc -b`) and production bundling (`vite build`).
- Checking the live server status on localhost:5173 or LAN IP for mobile access.
- Validating the offline service worker (`public/sw.js`) and web app manifest (`public/manifest.json`).
- Testing responsive layouts across smartphone (360-480px) and widescreen desktop.

## Procedures:
1. **Build Check**: Run `npm run build` inside `C:\Users\adity\Ag Folder\om_os_app`.
2. **Server Check**: Test port 5173 using `Invoke-WebRequest -Uri "http://localhost:5173/"`.
3. **PWA Validation**: Inspect `public/manifest.json` for standalone display mode and icons.

