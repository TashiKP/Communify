const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const symbolSchema = new Schema({
  symbol_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image_path: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  text_representation: {
    type: String,
    required: true,
  },
  language: {
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
  accessibility_status: {
    type: String,
    required: true,
  },
  creator_info: {
    type: String,
    required: true,
  },
});

const Symbol = mongoose.model('Symbol', symbolSchema, 'SYMBOLS');

module.exports = Symbol;
