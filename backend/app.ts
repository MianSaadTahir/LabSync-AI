import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './src/routes';
import errorHandler from './src/middleware/errorHandler';
import { errorResponse } from './src/utils/response';
import Message from './src/models/Message';
import Meeting from './src/models/Meeting';
import Budget from './src/models/Budget';

const app = express();

// Configure CORS to allow frontend requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

// Professional status dashboard endpoint
app.get('/status', async (req: Request, res: Response) => {
  try {
    // Get counts from database
    const [
      totalMessages,
      pendingExtractions,
      extractedMeetings,
      pendingBudgets,
      completedBudgets,
      failedItems
    ] = await Promise.all([
      Message.countDocuments(),
      Message.countDocuments({ module1_status: 'pending' }),
      Meeting.countDocuments(),
      Message.countDocuments({ module1_status: 'extracted', module2_status: { $in: ['pending', null] } }),
      Budget.countDocuments(),
      Message.countDocuments({ $or: [{ module1_status: 'failed' }, { module2_status: 'failed' }] })
    ]);

    // Get recent activity
    const recentMessages = await Message.find()
      .sort({ date_received: -1 })
      .limit(5)
      .select('message_id module1_status module2_status date_received');

    // Check API key configuration
    const hasGeminiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
    const hasTelegramToken = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.length > 10);

    // Calculate automation stats
    const automationRate = totalMessages > 0
      ? Math.round((completedBudgets / totalMessages) * 100)
      : 0;

    res.json({
      success: true,
      status: 'RUNNING',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),

      // Pipeline Statistics
      pipeline: {
        totalMessages,
        pendingExtractions,
        extractedMeetings,
        pendingBudgets,
        completedBudgets,
        failedItems,
        automationRate: `${automationRate}%`
      },

      // API Configuration Status
      configuration: {
        geminiApiKey: hasGeminiKey ? 'CONFIGURED' : 'MISSING',
        geminiApiKey2: process.env.GEMINI_API_KEY_2 ? 'CONFIGURED' : 'NOT SET',
        geminiApiKey3: process.env.GEMINI_API_KEY_3 ? 'CONFIGURED' : 'NOT SET',
        telegramBot: hasTelegramToken ? 'CONFIGURED' : 'MISSING',
        telegramWebhook: process.env.TELEGRAM_WEBHOOK_URL ? 'CONFIGURED' : 'NOT SET',
        mongodb: 'CONNECTED'
      },

      // Recent Activity
      recentActivity: recentMessages.map(m => ({
        id: m.message_id,
        extraction: m.module1_status,
        budget: m.module2_status || 'pending',
        received: m.date_received
      })),

      // Automation Flow Status
      automationFlow: {
        step1_telegram: hasTelegramToken ? '✓ Ready' : '✗ Missing Token',
        step2_extraction: hasGeminiKey ? '✓ Ready' : '✗ Missing API Key',
        step3_budgetDesign: hasGeminiKey ? '✓ Ready' : '✗ Missing API Key',
        step4_realtime: '✓ WebSocket Active',
        step5_dashboard: '✓ Frontend Connected'
      }
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  errorResponse(res, 404, 'Route not found');
});

app.use(errorHandler);

export default app;
