# LabSync 360 — Intelligent Budget Management System

An automated, AI-driven project budget management system designed to streamline the workflow from client requirements to financial tracking.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies](#technologies)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Telegram Integration**: Seamless communication channel for capturing client requirements via webhooks.
- **MCP Server**: Autonomous agents utilizing MCP server for respective tasks.
- **Automated Extraction**: Meeting Extraction Agent parses natural language messages to identify project scope, goals, and timelines.
- **Smart Budget Design**: Budget Design Agent generates optimized financial plans and Budget Allocation Agent allocates resource based on extracted data.
- **Real-time Dashboard**: Interactive Next.js frontend with Socket.io for live updates on messages and budgets.
- **Scalable Architecture**: Powered by Node.js, Express, and MongoDB for robust data handling.

## Screenshots

<img src="/assets/1.png" alt="Dashboard Overview" width="75%">
<img src="/assets/2.png" alt="Message Analysis" width="75%">
<img src="/assets/3.png" alt="Budget Planning" width="75%">
<img src="/assets/4.png" alt="Allocation Tracking" width="75%">
<img src="/assets/5.png" alt="AI Insights" width="75%">
<img src="/assets/6.png" alt="Settings" width="75%">

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, Socket.io
- **Database**: MongoDB

## Usage

Follow these steps to set up and run the project locally.

### 1. Clone and Install

```bash
git clone https://github.com/MianSaadTahir/LabSync360.git
cd LabSync360
npm install
```

### 2. Environment Configuration

Set up your environment variables for backend and frontend.

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

**Update the `.env` files with your credentials:**

- `MONGODB_URI`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_URL`
- `GEMINI_API_KEY`

### 3. Start Database

Ensure your MongoDB service is running.

- **macOS**: `brew services start mongodb-community`
- **Windows**: `net start MongoDB`
- **Linux**: `sudo systemctl start mongod`

### 4. Run Application

Follow this specific order in separate terminals:

**1. Start Backend**

```bash
cd backend
npm run dev
```

**2. Enable VPN & Start Ngrok**

> ⚠️ Important for users in Pakistan: Turn on your VPN to ensure Telegram Webhook connectivity.

Open a new terminal and run:

```bash
ngrok http 4000
```

_Copy the HTTPS forwarding URL provided by Ngrok (e.g., `https://your-url.ngrok-free.app`)_

**3. Start Frontend**
Open a new terminal and run:

```bash
cd frontend
npm run dev
```

### 5. Telegram Webhook Setup

Now that Ngrok is running, register your webhook to receive messages.

1.  **Construct URL**: Replace `<TOKEN>` with your Bot Token and `<NGROK_URL>` with the URL from Step 2.
    ```
    https://api.telegram.org/bot<TOKEN>/setWebhook?url=<NGROK_URL>/api/webhook/telegram
    ```
2.  **Execute**: Paste the constructed URL into your browser address bar and hit Enter.
    _You should see:_ `{"ok":true, "result":true, "description":"Webhook was set"}`

### 6. Test the Workflow

1.  Open your bot in Telegram.
2.  Send a project requirement message.
3.  Check the Dashboard at [http://localhost:3000/messages](http://localhost:3000/messages).

## Documentation

For detailed documentation, please refer to the [Documentation](https://github.com/MianSaadTahir/LabSync360/tree/main/assets/Documentation).

## Contributing

Contributions are welcome! Please check the [Issues page](https://github.com/MianSaadTahir/LabSync360/issues) or submit a Pull Request.

## License

This project is licensed under the [MIT License](https://github.com/MianSaadTahir/LabSync360/blob/main/LICENSE).


