# ==============================================================================
# AI Tech Consultant - Unified One-Command Launcher (Windows PowerShell)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "     ⚡ AI TECH CONSULTANT PLATFORM - LAUNCHING ALL SERVICES      " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = $PSScriptRoot

# 1. Start Task 1: Knowledge Brain (Python / FastAPI - Port 8001)
Write-Host "[1/4] Starting Task 1 (Knowledge Brain) on http://localhost:8001..." -ForegroundColor Green
$p1 = Start-Process python -ArgumentList "-m uvicorn task1_knowledge_brain.app.main:app --port 8001 --host 0.0.0.0" -WorkingDirectory $ROOT -PassThru -NoNewWindow

# 2. Start Task 2: Inbox Agent (TypeScript Node - Port 8002)
Write-Host "[2/4] Starting Task 2 (Inbox Agent) on http://localhost:8002..." -ForegroundColor Green
$p2 = Start-Process node -ArgumentList "task2_inbox_agent/dist/index.js" -WorkingDirectory $ROOT -PassThru -NoNewWindow

# 3. Start Task 3: Meeting to Scope of Work (Python / FastAPI - Port 8003)
Write-Host "[3/4] Starting Task 3 (Meeting to SOW) on http://localhost:8003..." -ForegroundColor Green
$p3 = Start-Process python -ArgumentList "-m uvicorn task3_meeting_sow.app.main:app --port 8003 --host 0.0.0.0" -WorkingDirectory $ROOT -PassThru -NoNewWindow

# 4. Start React.js Frontend (Vite - Port 5173)
Write-Host "[4/4] Starting React.js Frontend on http://localhost:5173..." -ForegroundColor Green
$p4 = Start-Process npm -ArgumentList "run dev -- --port 5173 --host" -WorkingDirectory (Join-Path $ROOT "frontend") -PassThru -NoNewWindow

# 5. Open React Frontend in Browser
Start-Sleep -Seconds 4
Write-Host "Opening React.js Frontend..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ✅ ALL SERVICES & REACT FRONTEND SUCCESSFULLY RUNNING!" -ForegroundColor Green
Write-Host "  - React.js UI:       http://localhost:5173" -ForegroundColor White
Write-Host "  - Task 1 API & Docs: http://localhost:8001/docs" -ForegroundColor White
Write-Host "  - Task 2 API:        http://localhost:8002" -ForegroundColor White
Write-Host "  - Task 3 API & Docs: http://localhost:8003/docs" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Press [Ctrl+C] or any key to stop all background services..." -ForegroundColor Yellow

try {
    [Console]::ReadKey($true) | Out-Null
} finally {
    Write-Host "`nStopping services..." -ForegroundColor Magenta
    Stop-Process -Id $p1.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $p2.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $p3.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $p4.Id -ErrorAction SilentlyContinue
    Write-Host "All services stopped cleanly." -ForegroundColor Green
}
