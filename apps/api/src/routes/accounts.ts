// apps/api/src/routes/accounts.ts
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { authenticateToken } from '../middleware/auth.js';
import { readJson, writeJson } from '../db/fileDb';
import type { Account } from '../../../../src/types/account';
import { isoNow } from '../../../../src/lib/date';

const FILE = 'accounts.json';
const router = Router();

// Función para migrar datos antiguos al nuevo formato
const migrateAccountData = (data: unknown[]): Account[] => {
  return data.map((item: unknown) => {
    const it = item as Record<string, unknown>;
    // Si tiene balance (formato antiguo), convertirlo
    if ('balance' in it && !('salary' in it)) {
      return {
        id: it.id as string,
        name: it.name as string,
        currency: (it.currency as string) || 'DOP',
        salaryType: 'monthly' as const,
        salary: 0, // Valor por defecto para registros antiguos
        extras: it.extras as number | undefined,
        createdAt: it.createdAt as string,
        updatedAt: it.updatedAt as string | undefined,
      };
    }
    // Si ya tiene el formato nuevo, devolverlo tal cual
    return item as Account;
  });
};

// Función para leer datos migrados automáticamente
const readMigratedData = (): Account[] => {
  let data = readJson<unknown[]>(FILE, []);
  // Verificar si hay datos que necesiten migración
  const needsMigration = data.some((item: unknown) => {
    const it = item as Record<string, unknown>;
    return 'balance' in it && !('salary' in it);
  });
  // Migrar datos si es necesario
  if (needsMigration) {
    data = migrateAccountData(data);
    writeJson(FILE, data);
  }
  return data as Account[];
};

router.use(authenticateToken as any);

router.get('/', (req: any, res) => {
  const data = readMigratedData().filter(a => a.userId === req.user.userId);
  res.json(data);
});

router.post('/', (req: any, res) => {
  const data = readMigratedData();
  const account: Account = {
    id: nanoid(8),
    name: req.body.name,
    currency: req.body.currency ?? 'DOP',
    salaryType: req.body.salaryType ?? 'monthly',
    salary: Number(req.body.salary),
    extras: req.body.extras ? Number(req.body.extras) : undefined,
    userId: (req as any).user.userId,
    createdAt: isoNow(),
  };
  data.push(account);
  writeJson(FILE, data);
  res.status(201).json(account);
});

router.put('/:id', (req: any, res) => {
  const data = readMigratedData();
  const idx = data.findIndex(ac => ac.id === req.params.id && ac.userId === (req as any).user.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body, updatedAt: isoNow() };
  writeJson(FILE, data);
  res.json(data[idx]);
});

router.delete('/:id', (req: any, res) => {
  const data = readMigratedData();
  const next = data.filter(ac => ac.id !== req.params.id || ac.userId !== (req as any).user.userId);
  writeJson(FILE, next);
  res.status(204).end();
});

export default router;
