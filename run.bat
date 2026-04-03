@echo off
cd /d "%~dp0"

set "DO_CLEAN=0"
if /i "%~1"=="clean" set "DO_CLEAN=1"

if %DO_CLEAN%==1 (
    echo Cleaning site...
    call bundle exec jekyll clean || exit /b
)

echo Starting Jekyll server on 0.0.0.0:4000 with live reload...

REM Foreground mode (run in current terminal, no new window)
if /i "%~1"=="fg" (
    bundle exec jekyll serve --livereload --host 0.0.0.0
    exit /b
)

REM Default: detached window
start cmd /k "cd /d "%~dp0" && bundle exec jekyll serve --livereload --host 0.0.0.0"

REM Wait for port 4000 to be ready (max 30 seconds)
echo Waiting for server to start...
set "PORT=4000"
set "TIMEOUT=30"
for /l %%i in (1,1,%TIMEOUT%) do (
    timeout /t 1 /nobreak >nul
    netstat -an | find ":%PORT% " | find "LISTENING" >nul && goto :ready
)
echo WARNING: Server not responding after %TIMEOUT% seconds. Opening browser anyway.

:ready
start http://127.0.0.1:4000/