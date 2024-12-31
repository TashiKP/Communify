import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

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

const SymbolCategory = model('SymbolCategory', symbolCategorySchema, 'SYMBOL_CATEGORIES');

export default SymbolCategory;
