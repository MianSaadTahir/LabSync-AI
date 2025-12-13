import mongoose from 'mongoose';
import { Message, Meeting, Budget, BudgetAllocation } from '../models';

const connectDB = async (): Promise<void> => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    // Ensure indexes are created (ignore errors for existing indexes)
    try {
      await Promise.all([
        Message.createIndexes().catch((err) => {
          if (!err.message?.includes('existing index')) {
            console.warn('Message index creation warning:', err.message);
          }
        }),
        Meeting.createIndexes().catch((err) => {
          if (!err.message?.includes('existing index')) {
            console.warn('Meeting index creation warning:', err.message);
          }
        }),
        Budget.createIndexes().catch((err) => {
          if (!err.message?.includes('existing index')) {
            console.warn('Budget index creation warning:', err.message);
          }
        }),
        BudgetAllocation.createIndexes().catch((err) => {
          if (!err.message?.includes('existing index')) {
            console.warn('BudgetAllocation index creation warning:', err.message);
          }
        }),
      ]);
      console.log('Database indexes verified');
    } catch (indexError) {
      // Index creation errors are non-fatal
      console.warn('Index creation warning (non-fatal):', indexError instanceof Error ? indexError.message : 'Unknown error');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MongoDB connection error:', errorMessage);
    throw error;
  }
};

export default connectDB;

