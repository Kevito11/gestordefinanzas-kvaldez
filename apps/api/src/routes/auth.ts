import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-me';

router.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario ya existe' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            password: passwordHash
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            SECRET_KEY,
            { expiresIn: '1y' }
        );

        res.status(201).json({
            user: {
                id: newUser._id,
                username: newUser.username,
                name: newUser.name
            },
            token,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Credenciales incompletas' });
        }

        const user: any = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            SECRET_KEY,
            { expiresIn: '1y' }
        );

        res.json({
            user: {
                id: user._id,
                username: user.username,
                name: user.name
            },
            token,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.put('/change-password', authenticateToken, async (req: any, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        const user: any = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        user.password = newHash;
        await user.save();

        res.json({ message: 'Contraseña actualizada con éxito' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.get('/export-data', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.user.userId;

        // Fetch all data for the user
        const accounts = await Account.find({ userId });
        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });

        res.json({
            accounts,
            transactions,
            budgets
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Error al exportar datos' });
    }
});

export default router;
