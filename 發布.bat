@echo off
chcp 65001 >nul
setlocal
REM Bambook 一鍵發布：建立索引與短網址頁面 → 驗證 → commit → push。
REM 平常用 GitHub Desktop 也可以（commit 時 hook 會自動建索引），這個檔給不想開 GitHub Desktop 的時候用。
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo.
echo ===== Bambook 發布 =====
echo.
git status --short
echo.
set "MSG="
set /p "MSG=這次改了什麼（直接按 Enter 用「更新內容」）："
if "%MSG%"=="" set "MSG=更新內容"

python tools\build-index.py
if errorlevel 1 goto failed
python tools\validate-content.py
if errorlevel 1 goto failed

git add -A
git commit -m "%MSG%"
if errorlevel 1 goto failed
git push
if errorlevel 1 goto failed

echo.
echo 完成，網站大約一分鐘後更新。
pause
exit /b 0

:failed
echo.
echo 沒有完成，請看上面的訊息。（沒有東西要 commit 時也會出現這行）
pause
exit /b 1
