const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const symbolCategorySchema = new Schema({
  category_id: {
    type: String,
    required: true,
    unique: true,
  },
  category_name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  optional_icon: {
    type: String,
    required: false,
  },
});

const SymbolCategory = mongoose.model('SymbolCategory', symbolCategorySchema, 'SYMBOL_CATEGORIES');

module.exports = SymbolCategory;
