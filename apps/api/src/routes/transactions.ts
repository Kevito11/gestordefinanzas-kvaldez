// apps/api/src/routes/transactions.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Transaction } from '../models/Transaction';

const router = Router();

router.use(authenticateToken as any);

router.get('/', async (req: any, res) => {
  try {
    const { accountId, from, to } = req.query;
    let query: any = { userId: req.user.userId };
    
    if (accountId) query.accountId = accountId;
    
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(String(from));
      if (to) query.date.$lte = new Date(String(to));
    }

    const data = await Transaction.find(query).sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const tx = new Transaction({
      accountId: req.body.accountId,
      type: req.body.type,
      amount: Number(req.body.amount),
      currency: req.body.currency ?? 'DOP',
      category: req.body.category ?? 'General',
      description: req.body.description,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      counterpartAccountId: req.body.counterpartAccountId,
      tags: req.body.tags ?? [],
      userId: req.user.userId,
    });
    await tx.save();
    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (error) {
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
