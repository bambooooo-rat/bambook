@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM This is the Bambook project root, not the location of this .bat file.
REM The launcher can therefore be copied to the Desktop or run from anywhere.
set "SITE_ROOT=X:\web\bambook"
set "PORT=8001"

if not exist "%SITE_ROOT%\index.html" (
  echo.
  echo [Bambook] Cannot find the website folder:
  echo %SITE_ROOT%
  echo.
  pause
  exit /b 1
)

pushd "%SITE_ROOT%"

REM Rebuild the static index before starting the site.
python build_manifest.py
if errorlevel 1 (
  echo.
  echo [Bambook] Failed to build site-manifest.json.
  popd
  pause
  exit /b 1
)

REM Find a free local port, starting at 8001. This does not conflict with
REM VS Code Live Server (usually 5500) or an existing Bambook server.
:find_free_port
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  set /a PORT+=1
  goto find_free_port
)

echo.
echo [Bambook] Starting at http://127.0.0.1:%PORT%/
start "Bambook Local Server" /D "%SITE_ROOT%" cmd /k python -m http.server %PORT%

REM Let Python bind the chosen port before opening the browser.
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

popd
endlocal
