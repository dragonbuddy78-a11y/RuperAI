# Set Vercel production env vars after deploy.
# Usage: .\scripts\set-vercel-env.ps1 -AppUrl "https://your-app.vercel.app" -DatabaseUrl "postgresql://..."

param(
  [Parameter(Mandatory = $true)]
  [string]$AppUrl,
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [string]$GroqApiKey = $env:GROQ_API_KEY,
  [string]$AuthSecret = ""
)

if (-not $AuthSecret) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $AuthSecret = [Convert]::ToBase64String($bytes)
  Write-Host "Generated AUTH_SECRET" -ForegroundColor Yellow
}

if (-not $GroqApiKey) {
  Write-Host "Set GROQ_API_KEY in your shell or pass -GroqApiKey" -ForegroundColor Red
  exit 1
}

$vars = @{
  DATABASE_URL = $DatabaseUrl
  DIRECT_DATABASE_URL = $DatabaseUrl
  AUTH_SECRET = $AuthSecret
  AUTH_URL = $AppUrl
  NEXTAUTH_URL = $AppUrl
  NEXT_PUBLIC_APP_URL = $AppUrl
  NEXT_PUBLIC_BETA_FREE_PRO = "true"
  GROQ_API_KEY = $GroqApiKey
  AI_PROVIDER = "groq"
}

foreach ($key in $vars.Keys) {
  Write-Host "Setting $key..." -ForegroundColor Cyan
  $value = $vars[$key]
  echo $value | npx vercel env add $key production --force 2>&1 | Out-Null
}

Write-Host "`nDone. Redeploy: npx vercel --prod" -ForegroundColor Green
Write-Host "Then run: npx prisma db push (with DATABASE_URL pointing to Neon)" -ForegroundColor Green