#!/bin/bash
echo "========================================================"
echo " Weather-Aware Truck Routing - Spotter AI Assessment"
echo "========================================================"
echo ""

# Activate backend venv & runserver
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
fi
python backend/manage.py runserver 8000 &
BACKEND_PID=$!

# Run frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Servers running:"
echo "- Backend: http://127.0.0.1:8000/"
echo "- Frontend: http://localhost:3000/"
echo ""
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

