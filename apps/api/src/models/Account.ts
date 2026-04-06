import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  currency: { type: String, required: true },
  salaryType: { type: String, enum: ['monthly', 'biweekly', 'weekly', 'daily', 'yearly', 'one-time'], required: true },
  salary: { type: Number, required: true },
  extras: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  payDay: { type: Number },
  isExecuted: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Account = mongoose.model('Account', accountSchema);
