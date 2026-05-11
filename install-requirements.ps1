# Installation script for Danesh Learning Platform requirements
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Danesh Platform - Requirements Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click on PowerShell and select Run as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Install Node.js LTS
Write-Host "Installing Node.js LTS..." -ForegroundColor Yellow
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -eq 0) {
    Write-Host "Node.js installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install Node.js" -ForegroundColor Red
}
Write-Host ""

# Install PostgreSQL
Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
winget install PostgreSQL.PostgreSQL --accept-source-agreements --accept-package-agreements
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install PostgreSQL" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Please close and reopen your terminal for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "After reopening terminal, verify installations:" -ForegroundColor Cyan
Write-Host "  node --version" -ForegroundColor White
Write-Host "  npm --version" -ForegroundColor White
Write-Host "  psql --version" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
