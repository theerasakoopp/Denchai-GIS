# Denchai-GIS Quick Push Script
param (
    [string]$msg = "Update Denchai-GIS Web Platform ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
)

# Detect Git executable
$gitPath = "git"
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    $desktopGit = "C:\Users\theerasak\AppData\Local\GitHubDesktop\app-3.5.8\resources\app\git\cmd\git.exe"
    if (Test-Path $desktopGit) {
        $gitPath = $desktopGit
    } else {
        $found = Get-ChildItem "C:\Users\theerasak\AppData\Local\GitHubDesktop" -Recurse -Filter "git.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        if ($found) { $gitPath = $found }
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🚀 Denchai-GIS: Git Sync & Push Tool" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Using Git: $gitPath"

# Initialize if needed
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Green
    & $gitPath init
    & $gitPath branch -M main
    & $gitPath remote add origin https://github.com/theerasakoopp/Denchai-GIS.git
}

# Add, Commit, Push
Write-Host "1. Staging files..." -ForegroundColor Gray
& $gitPath add -A

Write-Host "2. Committing changes: '$msg'..." -ForegroundColor Gray
& $gitPath commit -m "$msg"

Write-Host "3. Pushing to GitHub (origin main)..." -ForegroundColor Cyan
& $gitPath push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to https://github.com/theerasakoopp/Denchai-GIS" -ForegroundColor Green
} else {
    Write-Host "⚠️ Push encountered an issue. Check network or repository permissions." -ForegroundColor Yellow
}
