#!/bin/bash

echo "====================================="
echo "   问卷星在线调研平台 - 一键启动"
echo "====================================="

if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python3，请先安装 Python 3.11+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm，请先安装 Node.js"
    exit 1
fi

echo ""
echo "📦 步骤1/3：安装后端依赖..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ 后端依赖安装完成"

echo ""
echo "📦 步骤2/3：安装前端依赖..."
cd ../frontend
npm install -q
echo "✅ 前端依赖安装完成"

echo ""
echo "🚀 步骤3/3：启动服务..."
echo "后端服务将运行在: http://localhost:8000"
echo "前端服务将运行在: http://localhost:5173"
echo ""

source ../backend/venv/bin/activate
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo "后端 PID: $BACKEND_PID"
echo "前端 PID: $FRONTEND_PID"
echo ""
echo "访问地址："
echo "  前端应用: http://localhost:5173"
echo "  后端API:  http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止服务"

wait