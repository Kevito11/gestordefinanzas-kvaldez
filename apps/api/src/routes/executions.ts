import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ExecutionLog } from '../models/ExecutionLog';

const router = Router();

router.use(authenticateToken as any);

// Obtener todos los registros de ejecución del usuario
router.get('/', async (req: any, res) => {
  try {
    const data = await ExecutionLog.find({ userId: req.user.userId }).sort({ executionDate: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching execution logs' });
  }
});

// Crear un nuevo registro de ejecución
router.post('/', async (req: any, res) => {
  try {
    const logData = { ...req.body, userId: req.user.userId };
    const newLog = new ExecutionLog(logData);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: 'Error creating execution log' });
  }
});

// Actualizar la fecha exacta u otros detalles de un registro
router.put('/:id', async (req: any, res) => {
  try {
    const updatedLog = await ExecutionLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updatedLog) {
      return res.status(404).json({ error: 'Execution log not found' });
    }
    res.json(updatedLog);
  } catch (error) {
    res.status(500).json({ error: 'Error updating execution log' });
  }
});

// Eliminar un registro de ejecución (ej: si el usuario desmarca el check "isExecuted")
router.delete('/:id', async (req: any, res) => {
  try {
    const deletedLog = await ExecutionLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!deletedLog) {
      return res.status(404).json({ error: 'Execution log not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting execution log' });
  }
});

export default router;
