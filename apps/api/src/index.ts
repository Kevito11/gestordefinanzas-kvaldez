// apps/api/src/index.ts
import express from 'express';
import cors from 'cors';

import accountsRouter from './routes/accounts';
import budgetsRouter from './routes/budgets';
import transactionsRouter from './routes/transactions';
import authRouter from './routes/auth';

const app = express();
// Force restart
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/transactions', transactionsRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
});