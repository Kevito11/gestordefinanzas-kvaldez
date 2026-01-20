// apps/api/src/routes/transactions.ts
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readJson, writeJson } from '../db/fileDb.js';
import type { Transaction } from '../../../../src/types/transaction';
import { isoNow } from '../../../../src/lib/date';

const FILE = 'transactions.json';
const router = Router();

const DEFAULT_USER_ID = 'default-user';

router.get('/', (req, res) => {
  const data = readJson<Transaction[]>(FILE, []);
  const { accountId, from, to } = req.query;
  let filtered = data.filter(t => t.userId === DEFAULT_USER_ID);
  if (accountId) filtered = filtered.filter(t => t.accountId === String(accountId));
  if (from) filtered = filtered.filter(t => new Date(t.date) >= new Date(String(from)));
  if (to) filtered = filtered.filter(t => new Date(t.date) <= new Date(String(to)));
  res.json(filtered);
});

router.post('/', (req, res) => {
  const data = readJson<Transaction[]>(FILE, []);
  const tx: Transaction = {
    id: nanoid(),
    accountId: req.body.accountId,
    type: req.body.type,
    amount: Number(req.body.amount),
    currency: req.body.currency ?? 'DOP',
    category: req.body.category ?? 'General',
    description: req.body.description,
    date: req.body.date ?? isoNow(),
    counterpartAccountId: req.body.counterpartAccountId,
    tags: req.body.tags ?? [],
    userId: DEFAULT_USER_ID,
    createdAt: isoNow(),
  };
  data.push(tx);
  writeJson(FILE, data);
  res.status(201).json(tx);
});

router.put('/:id', (req, res) => {
  const data = readJson<Transaction[]>(FILE, []);
  const idx = data.findIndex(t => t.id === req.params.id && t.userId === DEFAULT_USER_ID);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body, updatedAt: isoNow() };
  writeJson(FILE, data);
  res.json(data[idx]);
});

router.delete('/:id', (req, res) => {
  const data = readJson<Transaction[]>(FILE, []);
  const next = data.filter(t => t.id !== req.params.id || t.userId !== DEFAULT_USER_ID);
  writeJson(FILE, next);
  res.status(204).end();
});

export default router;
