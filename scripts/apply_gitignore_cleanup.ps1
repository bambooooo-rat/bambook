# This does not delete local files.
# It only removes ignored files from Git tracking.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$paths = @(
  "node_modules",
  ".venv",
  "venv",
  "env",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  "dist",
  "build",
  "out",
  "public",
  "reports"
)

foreach ($path in $paths) {
  git rm -r --cached --ignore-unmatch $path
}

git rm --cached --ignore-unmatch repomix-output.xml

$patterns = @(
  "*.pyc", "*.pyo", "*.log", "*.tmp", "*.bak",
  "*.zip", "*.7z", "*.rar", "*.tar", "*.gz",
  "*.psd", "*.aep", "*.prproj", "*.kra", "*.clip", "*.xcf", "*.sketch", "*.fig", "*.figma"
)

foreach ($pattern in $patterns) {
  git ls-files $pattern | ForEach-Object {
    if ($_ -and $_.Trim()) {
      git rm --cached --ignore-unmatch $_
    }
  }
}

git status --short
