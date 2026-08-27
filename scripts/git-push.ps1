# Denchai-GIS Quick Push & Live Deploy Script
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
Write-Host " 🚀 Denchai-GIS: Git Sync & Deploy Tool" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Using Git: $gitPath"

# 1. Commit and push source to main
Write-Host "1. Staging & Committing main branch..." -ForegroundColor Gray
& $gitPath add -A
& $gitPath commit -m "$msg"
Write-Host "2. Pushing main branch to GitHub..." -ForegroundColor Cyan
& $gitPath push origin main

# 2. Build and push live bundle to gh-pages branch
Write-Host "3. Building production bundle..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "4. Deploying to live GitHub Pages (gh-pages branch)..." -ForegroundColor Green
    Set-Location dist
    & $gitPath init
    & $gitPath branch -M gh-pages
    & $gitPath add -A
    & $gitPath commit -m "deploy: update live site ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
    & $gitPath push -f https://github.com/theerasakoopp/Denchai-GIS.git gh-pages
    Set-Location ..
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Successfully pushed & deployed to GitHub!" -ForegroundColor Green
Write-Host "🌐 Live URL: https://theerasakoopp.github.io/Denchai-GIS/" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
