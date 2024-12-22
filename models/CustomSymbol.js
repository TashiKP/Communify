const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customSymbolSchema = new Schema({
  custom_symbol_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User',
  },
  image_path: {
    type: String,
    required: true,
  },
  text_representation: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  sharing_status: {
    type: String,
    required: true,
  },
});

const CustomSymbol = mongoose.model('CustomSymbol', customSymbolSchema, 'CUSTOM_SYMBOLS');

module.exports = CustomSymbol;
