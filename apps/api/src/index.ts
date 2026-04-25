import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import accountsRouter from './routes/accounts';
import budgetsRouter from './routes/budgets';
import transactionsRouter from './routes/transactions';
import authRouter from './routes/auth';
import executionsRouter from './routes/executions';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// MongoDB Connection
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI no está definido en el archivo .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor API corriendo en http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/executions', executionsRouter);