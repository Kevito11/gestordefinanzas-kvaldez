// apps/api/src/routes/budgets.ts
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readJson, writeJson } from '../db/fileDb.js';
import { isoNow } from '../../../../src/lib/date.js';

const FILE = 'budgets.json';
const router = Router();

const DEFAULT_USER_ID = 'default-user';

router.get('/', (_req, res) => {
  const data = readJson<any[]>(FILE, []).filter(b => b.userId === DEFAULT_USER_ID);
  res.json(data);
});

router.post('/', (req, res) => {
  const data: unknown[] = readJson(FILE, []);
  const budget = {
    id: nanoid(),
    name: req.body.name,
    category: req.body.category,
    currency: req.body.currency ?? 'DOP',
    amount: Number(req.body.amount ?? 0),
    period: req.body.period ?? 'monthly',
    startDate: req.body.startDate ?? isoNow().split('T')[0],
    endDate: req.body.endDate,
    userId: DEFAULT_USER_ID,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };
  data.push(budget);
  writeJson(FILE, data);
  res.status(201).json(budget);
});

router.put('/:id', (req, res) => {
  const data: unknown[] = readJson(FILE, []);
  const idx = data.findIndex((b: unknown) => {
    const budget = b as Record<string, unknown>;
    return budget.id === req.params.id && budget.userId === DEFAULT_USER_ID;
  });
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...(data[idx] as object), ...req.body, updatedAt: isoNow() };
  writeJson(FILE, data);
  res.json(data[idx]);
});

router.delete('/:id', (req, res) => {
  const data: unknown[] = readJson(FILE, []);
  const next = data.filter((b: unknown) => {
    const budget = b as Record<string, unknown>;
    return budget.id !== req.params.id || budget.userId !== DEFAULT_USER_ID;
  });
  writeJson(FILE, next);
  res.status(204).end();
});

export default router; 