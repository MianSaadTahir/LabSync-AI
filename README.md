# LabSync AI — Intelligent Budget Management System

LabSync AI is an automated budget management system that uses AI to extract project requirements from Telegram messages, design optimal budgets, and track allocations through a real-time dashboard.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
## Features

- **Telegram Integration**: Webhook receiver captures client messages via Telegram bot
- **AI Meeting Extraction**: Automatically extracts project requirements, budget, and timeline from messages using Gemini AI
- **AI Budget Design**: Generates optimized budget allocations based on project requirements
- **Budget Management**: Create, allocate, and track budgets with real-time updates
- **Real-time Dashboard**: Live budget tracking with WebSocket notifications
- **MCP Agent System**: Model Context Protocol integration for AI-powered budget intelligence
- **REST API**: Complete API for budget operations and message management

## Screenshots

<img src="/assets/1.png" alt="1" width="75%">
<img src="/assets/2.png" alt="2" width="75%">
<img src="/assets/3.png" alt="3" width="75%">
<img src="/assets/4.png" alt="4" width="75%">
<img src="/assets/5.png" alt="5" width="75%">
<img src="/assets/6.png" alt="6" width="75%">

## Technologies Used

**Backend:**

- Node.js, Express.js, TypeScript
- MongoDB
- Socket.io

**Frontend:**

- Next.js, React
- TypeScript, Tailwind CSS

**Agentic AI:**

- Google Gemini Flash API
- Model Context Protocol (MCP) Agents

## Prerequisites

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
- **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)
- **Gemini API Keys** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Usage

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/MianSaadTahir/LabSync-AI
cd labsync-ai
npm install
```

### 2. Environment Configuration

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Update:

- MONGODB_URI
- TELEGRAM_BOT_TOKEN
- TELEGRAM_WEBHOOK_URL
- GEMINI_API_KEY

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

```bash
npm run dev
```

This starts:

- Frontend on `http://localhost:3000`
- Backend on `http://localhost:4000`
- MCP servers for AI agents
- WebSocket server

Open the dashboard at `http://localhost:3000`

### 5. Telegram Webhook Setup

> ⚠️ Telegram API may be blocked in **Pakistan**. Use a VPN to register webhook and receive messages.

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

### 6. Test the Workflow

1. Open your Telegram bot → Send a message like:
   ```
   I need a modern and responsive e-commerce website for apparel products. My estimated budget is 75,000 USD, with a delivery timeline of 5 weeks.
   ```
2. Check backend logs for incoming message.
3. View messages on dashboard: `http://localhost:3000/messages`
4. AI will automatically extract project details

## Troubleshooting

### Telegram Connection Timeout

- Enable VPN (especially in Pakistan)
- Verify bot token is correct
- Check ngrok is running

### MongoDB Connection Error

```bash
npm run check:mongodb
```

### macOS Setup Issues

#### Permission denied for `tsc`, `tsx`, `next`, `concurrently`

```bash
sh: node_modules/.bin/tsc: Permission denied
sh: node_modules/.bin/tsx: Permission denied
sh: node_modules/.bin/next: Permission denied
sh: node_modules/.bin/concurrently: Permission denied
```

**Cause:** macOS blocks execution permission on some binaries.

**Fix:** Run this once at project root:

```bash
chmod -R +x node_modules/.bin
chmod -R +x backend/node_modules/.bin
chmod -R +x frontend/node_modules/.bin
chmod -R +x shared/node_modules/.bin
chmod -R +x agents/node_modules/.bin
chmod -R +x mcp-server/node_modules/.bin
xattr -dr com.apple.quarantine .
xattr -dr com.apple.quarantine node_modules
```

### Gemini API Error

Update model name in agent files to:

```typescript
model: "gemini-flash-latest";
```

### Port Already in Use

```bash
# Kill node processes
pkill -f node  # Mac/Linux
# Or use Task Manager on Windows
```

## Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/MianSaadTahir/LabSync-AI/issues).
## License

This project is open source and available under the MIT [License](https://github.com/MianSaadTahir/LabSync-AI/blob/main/LICENSE).

