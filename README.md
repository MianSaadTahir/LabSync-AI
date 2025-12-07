# LabSync AI — Telegram Client Intake System

LabSync AI is a simple but powerful system that captures Telegram bot messages through a webhook, stores them in MongoDB, and displays them on a clean Next.js dashboard for internal teams to review.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Usage](#usage)
- [Contributing](#contributing)

## Features

- Telegram webhook receiver (`/api/webhook/telegram`)
- Stores all incoming Telegram messages in MongoDB
- REST API to list messages (`GET /messages`)
- Next.js dashboard to view all captured messages
- Fully local setup with ngrok support for webhook testing

## Screenshots

<img src="/assets/1.png" alt="frontend" width="75%">
<img src="/assets/2.png" alt="msg" width="75%">

## Technologies Used

- Backend: Node.js, Express, MongoDB
- Frontend: Next.js, Tailwind CSS
- Integration: Telegram Bot API + Webhooks

## Usage

### 1. Environment Variables

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Update:

- MONGODB_URI
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY
- NEXT_PUBLIC_API_BASE_URL

### 2. Run the Project

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the dashboard at:
`http://localhost:3000/`

### 3. Telegram Webhook Setup

- Start backend first
- Start ngrok:
  `ngrok http 4000`
- Copy the HTTPS forwarding URL shown by ngrok. `(https://abcd1234.ngrok-free.app)`
- Register webhook with Telegram by opening this URL in your browser:
  `https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_NGROK_URL/api/webhook/telegram`
- Response:

```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

### 4. Test the workflow

- Open your Telegram bot → press Start.
- Send any message.
- Backend logs will show the incoming message.
- View stored messages:
  `GET http://localhost:4000/api/messages`
- View dashboard:
  `http://localhost:3000/messages`

### 5. AI Extraction & MCP

**Extract project info from a message:**
```bash
POST http://localhost:4000/api/agent/extract/:messageId
```

**Route extracted data to client projects:**
```bash
POST http://localhost:4000/api/mcp/route
Body: {
  "messageId": "...",
  "extracted": {
    "domain": "...",
    "budget": "...",
    "timeline": "..."
  }
}
```

See `MCP_README.md` for detailed documentation.

## Contributing

Contributions, issues, and feature requests are welcome.
Feel free to check out the [issues page](https://github.com/MianSaadTahir/LabSync-AI/issues) for more information.
