#!/bin/bash
echo "====================================================================="
echo "   STUDENT DROPOUT PREDICTION SYSTEM - LAUNCHER"
echo "====================================================================="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Python ML API
echo "[*] Launching ML API on port 5000..."
(cd "$SCRIPT_DIR/ml_api" && python3 app.py) &
ML_PID=$!

sleep 2

# Start Node.js Backend
echo "[*] Launching Backend Server on port 3000..."
(cd "$SCRIPT_DIR/backend" && npm start) &
BACKEND_PID=$!

sleep 2

# Open Frontend
echo "[*] Opening Frontend..."
if command -v xdg-open > /dev/null; then
  xdg-open "$SCRIPT_DIR/frontend/index.html"
elif command -v open > /dev/null; then
  open "$SCRIPT_DIR/frontend/index.html"
fi

echo "====================================================================="
echo "  All services started! Press Ctrl+C to terminate all services."
echo "====================================================================="

trap "kill $ML_PID $BACKEND_PID; exit" INT
wait
