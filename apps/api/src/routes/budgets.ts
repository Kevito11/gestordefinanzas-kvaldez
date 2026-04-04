// apps/api/src/routes/budgets.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Budget } from '../models/Budget';

const router = Router();

router.use(authenticateToken as any);

router.get('/', async (req: any, res) => {
  try {
    const data = await Budget.find({ userId: req.user.userId });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching budgets' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const budget = new Budget({
      name: req.body.name,
      category: req.body.category,
      currency: req.body.currency ?? 'DOP',
      amount: Number(req.body.amount ?? 0),
      period: req.body.period ?? 'monthly',
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      payDay: req.body.payDay,
      userId: req.user.userId,
    });
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Error creating budget' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!budget) return res.status(404).json({ error: 'Not found' });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Error updating budget' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const result = await Budget.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting budget' });
  }
});

export default router;