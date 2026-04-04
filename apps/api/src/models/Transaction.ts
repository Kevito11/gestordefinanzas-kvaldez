import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  counterpartAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  tags: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
