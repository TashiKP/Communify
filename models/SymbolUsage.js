import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const symbolUsageSchema = new Schema({
  usage_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User',
  },
  Symbol_id: {
    type: String,
    required: true,
    ref: 'symbol',
  },
  usage_count: {
    type: Number,
    required: true,
  },
  last_used_timestamp: {
    type: String,
    required: true,
  },
  contexts: {
    type: String,
    required: true,
  },
});

const SymbolUsage = model('SymbolUsage', symbolUsageSchema, 'SYMBOL_USAGE');

export default SymbolUsage;
