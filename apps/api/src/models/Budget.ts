import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  currency: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'weekly', 'biweekly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  payDay: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Budget = mongoose.model('Budget', budgetSchema);
