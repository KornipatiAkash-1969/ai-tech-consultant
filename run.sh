#!/usr/bin/env bash
# ==============================================================================
# AI Tech Consultant - Unified One-Command Launcher (Linux / macOS)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "     ⚡ AI TECH CONSULTANT PLATFORM - LAUNCHING ALL SERVICES      "
echo "================================================================="

# Start Task 1 Knowledge Brain
echo "[1/4] Starting Task 1 (Knowledge Brain) on http://localhost:8001..."
python3 -m uvicorn task1_knowledge_brain.app.main:app --port 8001 --host 0.0.0.0 &
P1=$!

# Start Task 2 Inbox Agent
echo "[2/4] Starting Task 2 (Inbox Agent) on http://localhost:8002..."
node task2_inbox_agent/dist/index.js &
P2=$!

# Start Task 3 Meeting SOW
echo "[3/4] Starting Task 3 (Meeting to SOW) on http://localhost:8003..."
python3 -m uvicorn task3_meeting_sow.app.main:app --port 8003 --host 0.0.0.0 &
P3=$!

# Start React.js Frontend
echo "[4/4] Starting React.js Frontend on http://localhost:5173..."
(cd frontend && npm run dev -- --port 5173 --host) &
P4=$!

sleep 4
echo "Opening React.js Frontend..."
if which xdg-open > /dev/null; then
  xdg-open http://localhost:5173 &
elif which open > /dev/null; then
  open http://localhost:5173 &
fi

echo "================================================================="
echo "  ✅ ALL SERVICES & REACT FRONTEND SUCCESSFULLY RUNNING!"
echo "  - React.js UI:       http://localhost:5173"
echo "  - Task 1 API & Docs: http://localhost:8001/docs"
echo "  - Task 2 API:        http://localhost:8002"
echo "  - Task 3 API & Docs: http://localhost:8003/docs"
echo "================================================================="
echo "Press [Ctrl+C] to terminate all background services..."

trap "kill $P1 $P2 $P3 $P4; echo 'All services stopped.'; exit" SIGINT SIGTERM
wait
