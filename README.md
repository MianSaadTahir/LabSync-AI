# LabSync AI — Intelligent Budget Management System

LabSync AI is an automated budget management system that uses AI to extract project requirements from Telegram messages, design optimal budgets, and track allocations through a real-time dashboard.

## Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Features

- **Telegram Integration**: Webhook receiver captures client messages via Telegram bot
- **AI Meeting Extraction**: Automatically extracts project requirements, budget, and timeline from messages using Gemini AI
- **AI Budget Design**: Generates optimized budget allocations based on project requirements
- **Budget Management**: Create, allocate, and track budgets with real-time updates
- **Real-time Dashboard**: Live budget tracking with WebSocket notifications
- **MCP Agent System**: Model Context Protocol integration for AI-powered budget intelligence
- **REST API**: Complete API for budget operations and message management

## Screenshots

[Add your screenshots here]

## Technologies Used

**Backend:**
- Node.js, Express.js, TypeScript
- MongoDB + Mongoose
- Socket.io (WebSocket)
- Google Gemini API
- Model Context Protocol (MCP)

**Frontend:**
- Next.js 16, React 19
- TypeScript, Tailwind CSS
- Socket.io Client

**AI/ML:**
- Google Gemini 1.5 Flash
- MCP Agents (Budget Design, Meeting Extraction)

## Prerequisites

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
- **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)
- **Gemini API Keys** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation & Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/labsync-ai.git
cd labsync-ai
npm install
```

This automatically installs dependencies for all packages (frontend, backend, agents, MCP server).

### 2. Environment Configuration

**Backend** (`backend/.env`):
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/labsync-ai

# Server
PORT=4000
NODE_ENV=development

# Gemini API Keys (at least one required)
GEMINI_API_KEY=your_primary_key_here
GEMINI_API_KEY_SECONDARY=your_secondary_key_here
GEMINI_API_KEY_TERTIARY=your_tertiary_key_here

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app/api/webhook/telegram
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 3. Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 4. Run the Project

**Full Stack (Recommended):**
```bash
npm run dev
```

This starts:
- Backend on `http://localhost:4000`
- Frontend on `http://localhost:3000`
- MCP servers for AI agents
- WebSocket server

**Or run separately:**
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Usage

### 1. Access the Dashboard

Open your browser:
- **Dashboard**: `http://localhost:3000`
- **API Health**: `http://localhost:4000/health`

### 2. Telegram Webhook Setup

**Start ngrok:**
```bash
ngrok http 4000
```

**Register webhook** (open in browser):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_NGROK_URL>/api/webhook/telegram
```

Expected response:
```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

### 3. Test the Workflow

1. Open your Telegram bot → Send a message like:
   ```
   I need a website for my clothing store. 
   Budget is 50,000 PKR. Timeline: 3 weeks.
   ```

2. Backend logs show incoming message:
   ```
   [Telegram Webhook] Received message from user...
   [MeetingExtractionAgent] Processing message...
   ```

3. View stored messages:
   ```
   GET http://localhost:4000/api/messages
   ```

4. Check dashboard: `http://localhost:3000/messages`

### 4. AI Features

**Extract Project Requirements:**
```bash
POST http://localhost:4000/api/extraction/extract/:messageId
```

Response:
```json
{
  "success": true,
  "data": {
    "projectTitle": "Clothing Store Website",
    "budget": 50000,
    "timeline": "3 weeks",
    "requirements": ["website", "e-commerce", ...]
  }
}
```

**Generate AI Budget Design:**
```bash
POST http://localhost:4000/api/budget/design
Content-Type: application/json

{
  "projectTitle": "Clothing Store Website",
  "totalBudget": 50000,
  "requirements": ["frontend", "backend", "hosting"]
}
```

Response:
```json
{
  "success": true,
  "budget": {
    "categories": [
      {
        "name": "Development",
        "allocated": 30000,
        "description": "Frontend and backend development"
      },
      ...
    ]
  }
}
```

## API Documentation

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages` | List all messages |
| `GET` | `/api/messages/:id` | Get message by ID |
| `POST` | `/api/webhook/telegram` | Telegram webhook receiver |

### Extraction

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/extraction/extract/:messageId` | Extract project info from message |
| `GET` | `/api/extraction/:messageId` | Get extraction result |

### Budget

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/budget/design` | Generate AI budget design |
| `GET` | `/api/budget` | List all budgets |
| `POST` | `/api/budget` | Create new budget |
| `GET` | `/api/budget/:id` | Get budget by ID |
| `PUT` | `/api/budget/:id` | Update budget |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |

## Project Structure

```
labsync-ai/
├── frontend/           # Next.js React app (port 3000)
│   ├── app/            # Pages and routes
│   ├── components/     # React components
│   └── lib/            # Utilities
├── backend/            # Express.js API (port 4000)
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # MongoDB schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── .env            # Configuration
├── mcp-server/         # AI agent services
│   └── src/
│       ├── tools/      # MCP tools
│       └── server.ts   # MCP server
├── agents/             # AI agents
│   ├── BudgetDesignAgent.ts
│   └── MeetingExtractionAgent.ts
└── shared/             # Shared types & utilities
```

## Available Commands

```bash
# Development
npm run dev              # Run full stack
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Build
npm run build:all        # Production build
npm run build:libs       # Build shared libraries

# Utilities
npm run check:mongodb    # Verify MongoDB
npm run verify           # System health check
npm run reinstall        # Clean reinstall
npm run clean            # Remove node_modules
```

## Troubleshooting

### Port Already in Use
```bash
# Kill Node processes
pkill -f node

# Or on Windows
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### MongoDB Connection Error
```bash
# Check MongoDB status
npm run check:mongodb

# Start MongoDB
brew services start mongodb-community  # Mac
net start MongoDB                       # Windows
sudo systemctl start mongod            # Linux
```

### Gemini API Error: Model Not Found
Update model name in agent files to use:
```typescript
model: "gemini-1.5-flash-latest"
// or
model: "gemini-2.0-flash-exp"
```

### Dependencies Issues
```bash
npm run reinstall
```

## Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/your-repo/labsync-ai/issues).

## License

This project is proprietary and intended for internal use.

---

**Made with ❤️ using Next.js, Express, and Gemini AI**