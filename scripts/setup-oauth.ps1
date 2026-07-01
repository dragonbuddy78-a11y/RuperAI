# RepurAI OAuth Setup Helper
# Opens the right pages and updates .env for you.

$envFile = Join-Path $PSScriptRoot "..\.env"
$envFile = Resolve-Path $envFile

Write-Host ""
Write-Host "=== RepurAI OAuth Setup ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pick a provider (GitHub is fastest ~2 min):" -ForegroundColor Yellow
Write-Host "  1) GitHub OAuth"
Write-Host "  2) Google OAuth"
Write-Host "  3) Both"
Write-Host "  4) Skip (use email/password only)"
Write-Host ""
$choice = Read-Host "Enter 1, 2, 3, or 4"

if ($choice -eq "4") {
    Write-Host "Skipping OAuth. Use email sign-up at http://localhost:3000/sign-up" -ForegroundColor Green
    exit 0
}

if ($choice -eq "1" -or $choice -eq "3") {
    Write-Host ""
    Write-Host "Opening GitHub OAuth app creation..." -ForegroundColor Cyan
    Write-Host "Fill in:" -ForegroundColor Yellow
    Write-Host "  Homepage URL:        http://localhost:3000"
    Write-Host "  Callback URL:        http://localhost:3000/api/auth/callback/github"
    Start-Process "https://github.com/settings/applications/new"
    $ghId = Read-Host "Paste GitHub Client ID"
    $ghSecret = Read-Host "Paste GitHub Client Secret"
    if ($ghId -and $ghSecret) {
        (Get-Content $envFile) -replace 'AUTH_GITHUB_ID=".*"', "AUTH_GITHUB_ID=`"$ghId`"" | Set-Content $envFile
        (Get-Content $envFile) -replace 'AUTH_GITHUB_SECRET=".*"', "AUTH_GITHUB_SECRET=`"$ghSecret`"" | Set-Content $envFile
        Write-Host "GitHub credentials saved!" -ForegroundColor Green
    }
}

if ($choice -eq "2" -or $choice -eq "3") {
    Write-Host ""
    Write-Host "Opening Google Cloud credentials..." -ForegroundColor Cyan
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "  1) Create project + OAuth consent screen (External, add yourself as test user)"
    Write-Host "  2) Credentials -> OAuth client ID -> Web application"
    Write-Host "  3) Redirect URI: http://localhost:3000/api/auth/callback/google"
    Start-Process "https://console.cloud.google.com/apis/credentials"
    $gId = Read-Host "Paste Google Client ID"
    $gSecret = Read-Host "Paste Google Client Secret"
    if ($gId -and $gSecret) {
        (Get-Content $envFile) -replace 'AUTH_GOOGLE_ID=".*"', "AUTH_GOOGLE_ID=`"$gId`"" | Set-Content $envFile
        (Get-Content $envFile) -replace 'AUTH_GOOGLE_SECRET=".*"', "AUTH_GOOGLE_SECRET=`"$gSecret`"" | Set-Content $envFile
        Write-Host "Google credentials saved!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! Restart the dev server:" -ForegroundColor Green
Write-Host "  cd C:\Users\goatd\projects\repurai"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then test: http://localhost:3000/sign-in" -ForegroundColor Cyan