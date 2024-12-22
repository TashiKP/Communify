const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const SymbolUsage = mongoose.model('SymbolUsage', symbolUsageSchema, 'SYMBOL_USAGE');

module.exports = SymbolUsage;
