import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './src/routes';
import errorHandler from './src/middleware/errorHandler';
import { errorResponse } from './src/utils/response';

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

app.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  errorResponse(res, 404, 'Route not found');
});

app.use(errorHandler);

export default app;



