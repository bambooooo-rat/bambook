# 把 materials/*/handout/ 底下所有講義 PDF 檔名的「_填空版」「_解答版」
# 改成「_填空」「_解答」，並用 git mv 讓 git 把這當成「重新命名」而不是
# 刪除＋新增，保留檔案歷史。
#
# 用法：在 PowerShell 裡執行（不需要先 cd，腳本會自己找到 repo 根目錄）：
#   powershell -ExecutionPolicy Bypass -File scripts\rename-handouts.ps1
# 或直接在 PowerShell 視窗裡執行：
#   .\scripts\rename-handouts.ps1

$ErrorActionPreference = "Stop"

# repo 根目錄 = 這個腳本所在資料夾（scripts/）的上一層
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "Repo root: $repoRoot"
Write-Host ""

$handoutDirs = Get-ChildItem -Path (Join-Path $repoRoot "materials") -Directory -Recurse -Filter "handout"

if (-not $handoutDirs) {
    Write-Host "找不到任何 materials/*/handout 資料夾，沒有東西可以改。"
    exit 0
}

$renamed = 0
$skipped = 0

foreach ($dir in $handoutDirs) {
    Get-ChildItem -Path $dir.FullName -File -Filter "*.pdf" | ForEach-Object {
        $oldName = $_.Name
        $newName = $oldName -replace "填空版", "填空" -replace "解答版", "解答"

        if ($newName -eq $oldName) {
            return
        }

        $newPath = Join-Path $dir.FullName $newName
        if (Test-Path -LiteralPath $newPath) {
            Write-Warning "跳過：目標檔名已存在 -> $newName"
            $script:skipped++
            return
        }

        Write-Host "Renaming: $oldName  ->  $newName"
        git mv -- $_.FullName $newPath
        $script:renamed++
    }
}

Write-Host ""
Write-Host "完成。重新命名 $renamed 個檔案，跳過 $skipped 個。"
Write-Host ""
Write-Host "接下來："
Write-Host "  1. 執行 python tools/build-index.py 重新產生 site-manifest.json"
Write-Host "  2. 用 git status 確認變更，或直接在 GitHub Desktop 裡檢查、commit、push"
