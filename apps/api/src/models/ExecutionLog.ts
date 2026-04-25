import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Referencia genérica al Account, Budget o Transaction original
  itemName: { type: String, required: true },
  itemType: { type: String, enum: ['income', 'fixed_expense', 'variable_expense', 'saving'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  executionDate: { type: Date, required: true }, // Fecha exacta en la que el usuario reporta que ocurrió
}, { timestamps: true });

export const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);
