// apps/api/src/routes/accounts.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Account } from '../models/Account';

const router = Router();

router.use(authenticateToken as any);

router.get('/', async (req: any, res) => {
  try {
    const data = await Account.find({ userId: req.user.userId });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching accounts' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const account = new Account({
      name: req.body.name,
      currency: req.body.currency ?? 'DOP',
      salaryType: req.body.salaryType ?? 'monthly',
      salary: Number(req.body.salary),
      extras: req.body.extras ? Number(req.body.extras) : 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      payDay: req.body.payDay ? Number(req.body.payDay) : undefined,
      isExecuted: req.body.isExecuted !== undefined ? req.body.isExecuted : false,
      userId: req.user.userId,
    });
    await account.save();
    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: 'Error creating account', details: error });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.salary) updateData.salary = Number(updateData.salary);
    if (updateData.extras) updateData.extras = Number(updateData.extras);

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    if (!account) return res.status(404).json({ error: 'Not found' });
    res.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: 'Error updating account', details: error });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const result = await Account.deleteOne({ _id: req.params.id, userId: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting account' });
  }
});

export default router;
