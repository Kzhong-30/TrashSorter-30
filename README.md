# 问卷星在线调研平台

基于 Vue 3 + FastAPI + MongoDB 构建的全栈在线问卷调研平台。

## 功能特性

- 📝 **问卷设计**：拖拽式编辑器，支持8种题型
- ⚙️ **问卷设置**：标题、描述、欢迎语、结束语、时间范围、填写限制
- 📤 **发布收集**：生成链接和二维码，移动端适配
- 📊 **数据分析**：统计图表、交叉分析、词云展示
- 📥 **数据导出**：Excel导出、图表图片导出

## 技术栈

- **前端**：Vue 3 + TypeScript + Element Plus + Pinia
- **后端**：FastAPI + Python 3.11 + MongoDB
- **构建工具**：Vite
- **图表库**：ECharts

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 赋予执行权限
chmod +x start.sh

# 一键启动
./start.sh
```

### 方式二：手动启动

**1. 启动后端服务**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**2. 启动前端服务**

```bash
cd frontend
npm install
npm run dev
```

## 访问地址

- 前端应用：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 项目结构

```
survey-platform/
├── frontend/                    # Vue 3 前端
│   ├── src/
│   │   ├── components/          # 组件
│   │   ├── pages/              # 页面
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── router/             # 路由
│   │   └── utils/              # 工具函数
│   └── package.json
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── api/                # API 路由
│   │   ├── core/               # 核心配置
│   │   ├── schemas/            # 数据模型
│   │   └── services/           # 业务逻辑
│   └── requirements.txt
└── start.sh                    # 一键启动脚本
```

## 演示数据

启动后自动创建一份包含8种题型的演示问卷：
- 单选题、多选题、下拉选择、评分题、矩阵单选、文本输入、日期选择、量表题

同时包含3份模拟答卷数据，可直接查看数据分析功能。