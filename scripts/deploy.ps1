# RepurAI — deploy to Vercel (free public URL like https://repurai.vercel.app)
# Run from project root: .\scripts\deploy.ps1

Write-Host "`n=== RepurAI Deploy ===" -ForegroundColor Cyan
Write-Host ""

# 1. GitHub
Write-Host "[1/4] Push code to GitHub..." -ForegroundColor Yellow
git status --short
$commit = git log --oneline -1 2>$null
if (-not $commit) {
  git add -A
  git commit -m "RepurAI open beta — ready for deploy"
}
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "  Push failed. Fix git auth, then re-run." -ForegroundColor Red
  exit 1
}
Write-Host "  GitHub OK" -ForegroundColor Green

# 2. Vercel login (interactive — opens browser once)
Write-Host "`n[2/4] Vercel login..." -ForegroundColor Yellow
npx vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
  npx vercel login
}

# 3. Link + deploy
Write-Host "`n[3/4] Deploying to Vercel..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host "`n[4/4] After deploy — set these env vars in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host @"

  DATABASE_URL          = Neon Postgres connection string
  DIRECT_DATABASE_URL   = same as DATABASE_URL (Neon)
  AUTH_SECRET           = run: openssl rand -base64 32
  AUTH_URL              = https://YOUR-APP.vercel.app
  NEXTAUTH_URL          = https://YOUR-APP.vercel.app
  NEXT_PUBLIC_APP_URL   = https://YOUR-APP.vercel.app
  NEXT_PUBLIC_BETA_FREE_PRO = true
  GROQ_API_KEY          = your Groq key
  AI_PROVIDER           = groq

Then run once (with production DATABASE_URL in .env):
  npx prisma db push

"@ -ForegroundColor Gray

Write-Host "Done! Your link will be shown above (e.g. https://repurai-xxx.vercel.app)" -ForegroundColor Green