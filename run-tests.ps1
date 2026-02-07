# ShreeHR Test Runner Script
# This script helps run tests with proper setup

param(
    [Parameter(Position = 0)]
    [ValidateSet("all", "unit", "e2e", "navigation", "chat", "ui", "debug")]
    [string]$TestType = "all",
    
    [switch]$SkipSetup,
    [switch]$GenerateReport
)

Write-Host @"
╔═══════════════════════════════════════╗
║      ShreeHR Automated Test Suite     ║
╚═══════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Function to check if process is running
function Test-ProcessRunning {
    param($ProcessName, $Port)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2
        return $true
    } catch {
        return $false
    }
}

# Setup test environment if not skipped
if (-not $SkipSetup) {
    Write-Host "`n🔧 Setting up test environment..." -ForegroundColor Yellow
    
    # Check if dev server is running
    if (-not (Test-ProcessRunning -Port 3000)) {
        Write-Host "⚠️  Dev server not running. Please run 'pnpm dev' in another terminal." -ForegroundColor Yellow
        Write-Host "   Or the tests will start it automatically (slower)." -ForegroundColor Gray
    } else {
        Write-Host "✅ Dev server is running" -ForegroundColor Green
    }
    
    # Check database and seed test users
    Write-Host "`n📊 Checking test data..." -ForegroundColor Yellow
    try {
        pnpm tsx e2e/setup/seed-e2e-users.ts
    } catch {
        Write-Host "⚠️  Failed to seed test users. Check database connection." -ForegroundColor Yellow
    }
}

# Run appropriate tests
Write-Host "`n🧪 Running tests..." -ForegroundColor Cyan

switch ($TestType) {
    "all" {
        Write-Host "Running all tests (unit + E2E)..." -ForegroundColor Blue
        pnpm test
        if ($LASTEXITCODE -eq 0) {
            pnpm test:e2e
        }
    }
    "unit" {
        Write-Host "Running unit tests..." -ForegroundColor Blue
        pnpm test
    }
    "e2e" {
        Write-Host "Running E2E tests..." -ForegroundColor Blue
        pnpm test:e2e
    }
    "navigation" {
        Write-Host "Running navigation tests..." -ForegroundColor Blue
        pnpm test:e2e navigation-visibility
    }
    "chat" {
        Write-Host "Running AI chat tests..." -ForegroundColor Blue
        pnpm test:e2e ai-chat
    }
    "ui" {
        Write-Host "Opening Playwright UI mode..." -ForegroundColor Blue
        Write-Host "Tip: Use this to debug failing tests!" -ForegroundColor Gray
        pnpm test:e2e:ui
    }
    "debug" {
        Write-Host "Running tests in debug mode..." -ForegroundColor Blue
        pnpm test:e2e:debug
    }
}

$exitCode = $LASTEXITCODE

# Generate report if requested
if ($GenerateReport -and $exitCode -eq 0) {
    Write-Host "`n📊 Generating test report..." -ForegroundColor Yellow
    pnpm test:e2e:report
}

# Summary
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "        ✅ TESTS PASSED!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`nGreat job! Your code is tested and ready." -ForegroundColor Green
    
    if ($TestType -eq "navigation") {
        Write-Host "`n📸 Don't forget to:" -ForegroundColor Yellow
        Write-Host "   1. Take a screenshot of passed tests"
        Write-Host "   2. Include it in your update"
        Write-Host "   3. Mention which roles were tested"
    }
} else {
    Write-Host "        ❌ TESTS FAILED!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "`n🔍 Debug tips:" -ForegroundColor Yellow
    Write-Host "   1. Run with UI mode: .\run-tests.ps1 ui"
    Write-Host "   2. Check the test output above"
    Write-Host "   3. Look for element not found errors"
    Write-Host "   4. Verify test users exist in database"
    Write-Host "`n⚠️  Do NOT mark this feature as done!" -ForegroundColor Red
}

Write-Host "`n📖 See TESTING_CHECKLIST.md for more info" -ForegroundColor Blue

exit $exitCode