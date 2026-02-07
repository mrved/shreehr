# Verification script for ShreeHR testing setup
Write-Host "🧪 Verifying ShreeHR Testing Setup..." -ForegroundColor Cyan

# Check if pnpm is installed
Write-Host "`n📦 Checking pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm $pnpmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm not found. Please install pnpm first." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
Write-Host "`n📚 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Dependencies not installed. Running 'pnpm install'..." -ForegroundColor Yellow
    pnpm install
}

# Check Playwright installation
Write-Host "`n🎭 Checking Playwright..." -ForegroundColor Yellow
try {
    $playwrightVersion = npx playwright --version
    Write-Host "✅ Playwright $playwrightVersion installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Playwright CLI not found. Installing browsers..." -ForegroundColor Yellow
    npx playwright install
}

# Check test files
Write-Host "`n📁 Checking test files..." -ForegroundColor Yellow
$testFiles = @(
    "playwright.config.ts",
    "e2e/navigation-visibility.spec.ts",
    "e2e/ai-chat-access.spec.ts",
    "e2e/fixtures/base.ts",
    "e2e/pages/login.page.ts",
    "e2e/pages/navigation.page.ts"
)

$allFilesExist = $true
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file not found" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Check environment
Write-Host "`n🔧 Checking environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check for DATABASE_URL
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL=") {
        Write-Host "✅ DATABASE_URL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DATABASE_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found. Copy .env.example to .env" -ForegroundColor Red
}

# Summary
Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           SETUP VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

if ($allFilesExist) {
    Write-Host "`n✅ All test files are in place!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure your database is running"
    Write-Host "2. Run: pnpm tsx e2e/setup/seed-e2e-users.ts"
    Write-Host "3. Run: pnpm dev (in another terminal)"
    Write-Host "4. Run: pnpm test:e2e"
    Write-Host "`nOr use the UI mode for debugging:"
    Write-Host "   pnpm test:e2e:ui" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Some files are missing. Please check the setup." -ForegroundColor Red
}

Write-Host "`n📖 See docs/testing-guide.md for full documentation" -ForegroundColor Blue