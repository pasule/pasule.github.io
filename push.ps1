# One-command commit and push script
# Usage: .\push.ps1 "your commit message"
# Example: .\push.ps1 "feat: add new friend link"

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Message
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Host "Error: commit message cannot be empty" -ForegroundColor Red
    Write-Host 'Usage: .\push.ps1 "your commit message"'
    exit 1
}

Write-Host "==> git add -A ..." -ForegroundColor Cyan
git add -A

Write-Host "==> git commit: $Message" -ForegroundColor Cyan
git commit -m $Message

Write-Host "==> git push origin astro-source ..." -ForegroundColor Cyan
git push origin astro-source

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Pushed. GitHub Actions will rebuild and deploy automatically." -ForegroundColor Green
    Write-Host "     Actions: https://github.com/pasule/pasule.github.io/actions" -ForegroundColor Green
    Write-Host "     Site:    https://pasule.com/" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[FAIL] Push failed. Check the error above." -ForegroundColor Red
}

exit $LASTEXITCODE
